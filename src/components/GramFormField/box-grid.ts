/* eslint-disable vue/one-component-per-file */
import {
  defineComponent,
  provide,
  onMounted,
  InjectionKey,
  Ref,
  computed,
  watchEffect,
  inject,
  PropType,
  getCurrentInstance,
  ComponentInternalInstance
} from "vue";
import { h } from "@formily/vue";
import { observer } from "@formily/reactive-vue";
import { markRaw } from "@formily/reactive";
import { Grid, IGridOptions } from "@formily/grid";
import { useFormLayout } from "@formily/element-plus";
import { ElDivider } from "element-plus";
import { stylePrefix } from "./constants";

export interface IGramFormGridBoxProps extends IGridOptions {
  grid?: Grid<HTMLElement>;
  prefixCls?: string;
  className?: string;
}

const GramFormGridBoxSymbol: InjectionKey<Ref<Grid<HTMLElement>>> = Symbol("GramFormGridBoxContext");

interface GridColumnProps {
  gridSpan: number;
}

export const createGramFormGridBox = (props: IGramFormGridBoxProps): Grid<HTMLElement> => {
  return markRaw(new Grid(props));
};

export const useGramFormGridBox = (): Ref<Grid<HTMLElement>> => inject(GramFormGridBoxSymbol);

/**
 * @deprecated
 */
export const useGridColumn = (gridSpan = "span 1") => {
  return gridSpan;
};

const useRefs = (): Record<string, unknown> => {
  const vm: ComponentInternalInstance | null = getCurrentInstance();
  return vm?.refs || {};
};

const GramFormGridBoxInner = observer(
  defineComponent({
    name: "GramFormGridBox",
    props: {
      label: {
        type: String
      },
      columnGap: {
        type: Number
      },
      rowGap: {
        type: Number
      },
      minColumns: {
        type: [Number, Array],
        default: 1
      },
      minWidth: {
        type: [Number, Array]
      },
      maxColumns: {
        type: [Number, Array],
        default: 4
      },
      maxWidth: {
        type: [Number, Array],
        default: 240
      },
      breakpoints: {
        type: Array
      },
      colWrap: {
        type: Boolean,
        default: true
      },
      strictAutoFit: {
        type: Boolean,
        default: false
      },
      shouldVisible: {
        type: Function as PropType<IGridOptions["shouldVisible"]>,
        default() {
          return () => true;
        }
      },
      grid: {
        type: Object as PropType<Grid<HTMLElement>>
      }
    },
    setup(props: any, { slots, attrs }) {
      const layout = useFormLayout();

      const gridInstance = computed(() => {
        const newProps: IGramFormGridBoxProps = {};
        Object.keys(props).forEach(key => {
          if (typeof props[key] !== "undefined") {
            newProps[key] = props[key];
          }
        });
        const options = {
          columnGap: layout.value?.gridColumnGap ?? 24,
          rowGap: layout.value?.gridRowGap ?? 16,
          ...newProps
        };
        return markRaw(options?.grid ? options.grid : new Grid(options));
      });
      const prefixCls = `${stylePrefix}-form-grid`;

      provide(GramFormGridBoxSymbol, gridInstance);

      onMounted(() => {
        const refs = useRefs();
        watchEffect(onInvalidate => {
          const dispose = gridInstance.value.connect(refs.root as HTMLElement);
          onInvalidate(() => {
            dispose();
          });
        });
      });
      return () => {
        return [
          h(ElDivider, { contentPosition: "left", ...attrs }, { default: () => props.label || "BOX" }),
          h(
            "div",
            {
              class: `${prefixCls}`,
              style: {
                gridTemplateColumns: gridInstance.value.templateColumns,
                gap: gridInstance.value.gap
              },
              ref: "root"
            },
            slots
          )
        ];
      };
    }
  })
) as any;

const GramFormGridBoxColumn = observer(
  defineComponent({
    name: "GramFormGridBoxColumn",
    props: {
      gridSpan: {
        type: Number,
        default: 1
      }
    },
    setup(props: GridColumnProps, { slots }) {
      return () => {
        return h(
          "div",
          {
            "data-grid-span": props.gridSpan
          },
          slots
        );
      };
    }
  })
);

export const GramFormGridBox = Object.assign(GramFormGridBoxInner, {
  GridColumn: GramFormGridBoxColumn,
  useGramFormGridBox,
  createGramFormGridBox
});

export default GramFormGridBox;
