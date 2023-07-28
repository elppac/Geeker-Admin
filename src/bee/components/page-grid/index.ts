import {
  defineComponent,
  provide,
  onMounted,
  type InjectionKey,
  type Ref,
  computed,
  watchEffect,
  inject,
  type PropType,
  getCurrentInstance,
  type ComponentInternalInstance,
} from 'vue'
import { h } from '../../vue'
import { observer } from '@formily/reactive-vue'
import { markRaw } from '@formily/reactive'
import { Grid, type IGridOptions } from '@formily/grid'
import { stylePrefix, composeExport } from '../__builtins__'
import { usePageLayout } from '../page-layout'

export interface IPageGridProps extends IGridOptions {
  grid?: Grid<HTMLElement>
  prefixCls?: string
  className?: string
}

const PageGridSymbol: InjectionKey<Ref<Grid<HTMLElement>>> =
  Symbol('PageGridContext')

interface GridColumnProps {
  gridSpan: number
}

export const createPageGrid = (props: IPageGridProps): Grid<HTMLElement> => {
  return markRaw(new Grid(props))
}

export const usePageGrid = (): Ref<Grid<HTMLElement>> => inject(PageGridSymbol)

/**
 * @deprecated
 */
export const useGridColumn = (gridSpan = 'span 1') => {
  return gridSpan
}

const useRefs = (): Record<string, unknown> => {
  const vm: ComponentInternalInstance | null = getCurrentInstance()
  return vm?.refs || {}
}

const PageGridInner = observer(
  defineComponent({
    name: 'BeePageGrid',
    props: {
      columnGap: {
        type: Number,
      },
      rowGap: {
        type: Number,
      },
      minColumns: {
        type: [Number, Array],
      },
      minWidth: {
        type: [Number, Array],
      },
      maxColumns: {
        type: [Number, Array],
      },
      maxWidth: {
        type: [Number, Array],
      },
      breakpoints: {
        type: Array,
      },
      colWrap: {
        type: Boolean,
        default: true,
      },
      strictAutoFit: {
        type: Boolean,
        default: false,
      },
      shouldVisible: {
        type: Function as PropType<IGridOptions['shouldVisible']>,
        default() {
          return () => true
        },
      },
      grid: {
        type: Object as PropType<Grid<HTMLElement>>,
      },
    },
    setup(props: any, { slots }) {
      const layout = usePageLayout()
      const gridInstance = computed(() => {
        const newProps: IPageGridProps = {}
        Object.keys(props).forEach((key) => {
          if (typeof props[key] !== 'undefined') {
            newProps[key] = props[key]
          }
        })
        const options = {
          columnGap: layout.value?.gridColumnGap ?? 8,
          rowGap: layout.value?.gridRowGap ?? 4,
          ...newProps,
        }
        return markRaw(options?.grid ? options.grid : new Grid(options))
      })
      const prefixCls = `${stylePrefix}-page-grid`

      provide(PageGridSymbol, gridInstance)

      onMounted(() => {
        const refs = useRefs()
        watchEffect((onInvalidate) => {
          const dispose = gridInstance.value.connect(refs.root as HTMLElement)
          onInvalidate(() => {
            dispose()
          })
        })
      })

      return () => {
        return h(
          'div',
          {
            class: `${prefixCls}`,
            style: {
              gridTemplateColumns: gridInstance.value.templateColumns,
              gap: gridInstance.value.gap,
            },
            ref: 'root',
          },
          slots
        )
      }
    },
  })
) as any

const PageGridColumn = observer(
  defineComponent({
    name: 'BeePageGridColumn',
    props: {
      gridSpan: {
        type: Number,
        default: 1,
      },
    },
    setup(props: GridColumnProps, { slots }) {
      return () => {
        debugger
        return h(
          'div',
          {
            'data-grid-span': props.gridSpan,
          },
          slots
        )
      }
    },
  })
)

export const PageGrid = composeExport(PageGridInner, {
  GridColumn: PageGridColumn,
  usePageGrid,
  createPageGrid,
})

export default PageGrid
