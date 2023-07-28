import {
  ref,
  defineComponent,
  provide,
  h,
} from 'vue'
import { connect, mapProps } from '../../vue'

import { usePageLayout, PageLayoutShallowContext } from '../page-layout'
import {
  composeExport,
  stylePrefix,
} from '../__builtins__'
import { useGridColumn } from '../page-grid'

export type PageGridItemProps = {
  className?: string
  wrapperWidth?: number
  wrapperStyle?: Record<string, any>
  fullness?: boolean
  asterisk?: boolean
  gridSpan?: number | string
  bordered?: boolean
}

export const PageGridBaseItem = defineComponent({
  name: 'PageItem',
  props: {
    className: {},
    wrapperWidth: {},
    wrapperStyle: {},
    fullness: {},
    asterisk: {},
    gridSpan: {},
    bordered: { default: true },
    inset: { default: false },
  },
  setup(props, { slots }) {
    const active = ref(false)
    const deepLayoutRef = usePageLayout()
    const prefixCls = `${stylePrefix}-page-grid-item`
    provide(PageLayoutShallowContext, ref({}))
    return () => {
      const gridColumn = useGridColumn(props.gridSpan as string)
      const gridStyles: Record<string, any> = {}

      if (gridColumn) {
        gridStyles.gridColumn = gridColumn
      }
      const deepLayout = deepLayoutRef.value
      const {
        layout = deepLayout.layout ?? 'horizontal',
        wrapperWrap = deepLayout.wrapperWrap,
        fullness = deepLayout.fullness,
        size = deepLayout.size,
        bordered = deepLayout.bordered,
        inset = deepLayout.inset,
      } = props as any
      const formatChildren = slots.default?.()
      return h(
        'div',
        {
          style: {
            ...gridStyles,
          },
          class: {
            [`${prefixCls}`]: true,
            [`${prefixCls}-layout-${layout}`]: true,
            [`${prefixCls}-size-${size}`]: !!size,
            [`${prefixCls}-fullness`]: !!fullness || !!inset,
            [`${prefixCls}-inset`]: !!inset,
            [`${prefixCls}-active`]: active.value,
            [`${prefixCls}-inset-active`]: !!inset && active.value,
            [`${prefixCls}-control-wrap`]: !!wrapperWrap,
            [`${prefixCls}-bordered-none`]:
              bordered === false || !!inset ,
            [`${props.className}`]: !!props.className,
          }
        },
        {
          default: () => [ formatChildren],
        }
      )
    }
  },
})

const Item = connect(
  PageGridBaseItem,
  mapProps(
    (props, field) => {
      if (!field) return props
      let asterisk = false
      if ('asterisk' in props) {
        asterisk = props.asterisk
      }
      return {
        asterisk,
      }
    }
  )
)

export const PageGridItem = composeExport(Item, {
  BaseItem: PageGridBaseItem,
})

export default PageGridItem
