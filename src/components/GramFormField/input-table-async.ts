import { computed, defineComponent, h } from "vue";
import { RecursionField, Schema } from "@formily/vue";
import { observer } from "@formily/reactive-vue";
import { useModel } from "@/hooks/useModel";
export const GramFormInputTableAsync = defineComponent<any>({
  inheritAttrs: false,
  name: "GramFormInputTableAsync",
  setup(props, { attrs }) {
    const { page } = useModel(attrs?.source?.value);
    const schema = computed(() => {
      const json = page.value.ability?.inputTable();
      if (json) {
        return new Schema(json);
      }
      return null;
    });

    return () => {
      if (!schema.value) {
        return ["loading"];
      }
      console.count("GramFormInputTableAsync render");
      return [h(RecursionField, { schema: schema.value, onlyRenderProperties: false, name: attrs?.name }, {})];
    };
  }
});

export default observer(GramFormInputTableAsync);
