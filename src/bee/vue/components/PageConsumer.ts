import { defineComponent } from "vue";
import { observer } from "@formily/reactive-vue";
import { usePage } from "../hooks";
import h from "../shared/h";

export default observer(
  defineComponent({
    name: "PageConsumer",
    inheritAttrs: false,
    setup(props, { slots }) {
      const pageRef = usePage();
      return () => {
        // just like <Fragment>
        return h(
          "div",
          { style: { display: "contents" } },
          {
            default: () =>
              slots.default?.({
                page: pageRef.value
              })
          }
        );
      };
    }
  }),
  {
    // make sure observables updated <cannot be tracked by tests>
    scheduler: /* istanbul ignore next */ update => Promise.resolve().then(update)
  }
);
