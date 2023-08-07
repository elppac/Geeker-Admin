import { defineComponent } from "vue";
import { RecursionField, h, useFieldSchema } from "@formily/vue";
import { DividerProps } from "element-plus";
import { ElDivider } from "element-plus";
import { observer } from "@formily/reactive-vue";

export interface BoxProps extends DividerProps {
  label: string;
}

export const GramFormBox = defineComponent<BoxProps>({
  inheritAttrs: false,
  name: "GramFormBox",
  setup(props, { attrs }) {
    const schema = useFieldSchema();
    return () => {
      return h(
        "div",
        {},
        {
          default() {
            return [
              h(ElDivider, { contentPosition: "left", ...attrs }, { default: () => attrs.label || "BOX" }),
              h(
                "dev",
                {},
                {
                  default: () => schema.value.mapProperties((schema, name) => h(RecursionField, { schema, name }, {}))
                }
              )
            ];
          }
        }
      );
    };
  }
});

export default observer(GramFormBox);
