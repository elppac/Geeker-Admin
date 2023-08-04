import { provide, defineComponent, toRef } from "vue";
import {
  PageSymbol,
  FieldSymbol,
  SchemaMarkupSymbol,
  SchemaSymbol,
  SchemaExpressionScopeSymbol,
  SchemaOptionsSymbol
} from "../shared/context";
import { type IProviderProps, type DefineComponent } from "../types";
import { useAttach } from "../hooks/useAttach";
import { useInjectionCleaner } from "../hooks/useInjectionCleaner";
import h from "../shared/h";
import { Fragment } from "../shared/fragment";

export default defineComponent({
  name: "PageProvider",
  inheritAttrs: false,
  props: ["page"],
  setup(props: IProviderProps, { slots }) {
    const pageRef = useAttach(toRef(props, "page"));
    provide(PageSymbol, pageRef);
    useInjectionCleaner([FieldSymbol, SchemaMarkupSymbol, SchemaSymbol, SchemaExpressionScopeSymbol, SchemaOptionsSymbol]);

    return () => h(Fragment, {}, slots);
  }
}) as DefineComponent<IProviderProps>;
