import { Fragment as FragmentV2 } from "vue-frag";
import { type DefineComponent } from "../types";
import { isVue2 } from "vue-demi";
import { defineComponent } from "vue";

export const Fragment = "#fragment";

let FragmentComponent: DefineComponent<{}>;

if (isVue2) {
  FragmentComponent = {
    name: "Fragment",
    ...FragmentV2
  } as unknown as DefineComponent<{}>;
} else {
  /* istanbul ignore next */
  FragmentComponent = defineComponent({
    name: "Fragment",
    render() {
      return this.$slots.default?.();
    }
  });
}

export { FragmentComponent };
