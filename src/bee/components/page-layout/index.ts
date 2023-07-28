import {
  provide,
  inject,
  type InjectionKey,
  defineComponent,
  type Ref,
  ref,
  watch,
  type SetupContext,
} from 'vue'
import { h } from '../../vue'

import { useResponsivePageLayout } from './useResponsivePageLayout'
import { stylePrefix } from '../__builtins__'

export type PageLayoutProps = {
  className?: string
  colon?: boolean
  labelAlign?: 'right' | 'left' | ('right' | 'left')[]
  wrapperAlign?: 'right' | 'left' | ('right' | 'left')[]
  labelWrap?: boolean
  labelWidth?: number
  wrapperWidth?: number
  wrapperWrap?: boolean
  labelCol?: number | number[]
  wrapperCol?: number | number[]
  fullness?: boolean
  size?: 'small' | 'default' | 'large'
  layout?:
    | 'vertical'
    | 'horizontal'
    | 'inline'
    | ('vertical' | 'horizontal' | 'inline')[]
  direction?: 'rtl' | 'ltr'
  shallow?: boolean
  feedbackLayout?: 'loose' | 'terse' | 'popover'
  tooltipLayout?: 'icon' | 'text'
  bordered?: boolean
  breakpoints?: number[]
  inset?: boolean
  spaceGap?: number
  gridColumnGap?: number
  gridRowGap?: number
}

export const PageLayoutDeepContext: InjectionKey<Ref<PageLayoutProps>> = Symbol(
  'PageLayoutDeepContext'
)

export const PageLayoutShallowContext: InjectionKey<Ref<PageLayoutProps>> =
  Symbol('PageLayoutShallowContext')

export const usePageDeepLayout = (): Ref<PageLayoutProps> =>
  inject(PageLayoutDeepContext, ref({}))

export const usePageShallowLayout = (): Ref<PageLayoutProps> =>
  inject(PageLayoutShallowContext, ref({}))

export const usePageLayout = (): Ref<PageLayoutProps> => {
  const shallowLayout = usePageShallowLayout()
  const deepLayout = usePageDeepLayout()
  const pageLayout = ref({
    ...deepLayout.value,
    ...shallowLayout.value,
  })

  watch(
    [shallowLayout, deepLayout],
    () => {
      pageLayout.value = {
        ...deepLayout.value,
        ...shallowLayout.value,
      }
    },
    {
      deep: true,
    }
  )
  return pageLayout
}

export const PageLayout = defineComponent({
  name: 'BeePageLayout',
  props: {
    className: {},
    colon: { default: true },
    labelAlign: {},
    wrapperAlign: {},
    labelWrap: { default: false },
    labelWidth: {},
    wrapperWidth: {},
    wrapperWrap: { default: false },
    labelCol: {},
    wrapperCol: {},
    fullness: { default: false },
    size: { default: 'default' },
    layout: { default: 'horizontal' },
    direction: { default: 'ltr' },
    shallow: { default: true },
    feedbackLayout: {},
    tooltipLayout: {},
    bordered: { default: true },
    inset: { default: false },
    breakpoints: {},
    spaceGap: {},
    gridColumnGap: {},
    gridRowGap: {},
  },
  setup(customProps: any, { slots }: SetupContext) {
    const { props }: any = useResponsivePageLayout(customProps as any)

    const deepLayout = usePageDeepLayout()
    const newDeepLayout = ref({
      ...deepLayout.value,
    })
    const shallowProps = ref({})
    watch(
      [props, deepLayout],
      () => {
        shallowProps.value = props.value.shallow ? props.value : undefined
        if (!props.value.shallow) {
          Object.assign(newDeepLayout.value, props.value)
        } else {
          if (props.value.size) {
            newDeepLayout.value.size = props.value.size
          }
          if (props.value.colon) {
            newDeepLayout.value.colon = props.value.colon
          }
        }
      },
      { deep: true, immediate: true }
    )

    provide(PageLayoutDeepContext, newDeepLayout)
    provide(PageLayoutShallowContext, shallowProps)

    const pagePrefixCls = `${stylePrefix}-page`
    return () => {
      const classNames = {
        [`${pagePrefixCls}-${props?.value.layout}`]: true,
        [`${pagePrefixCls}-rtl`]: props?.value.direction === 'rtl',
        [`${pagePrefixCls}-${props?.value.size}`]:
          props?.value.size !== undefined,
        [`${props?.value.className}`]: props?.value.className !== undefined,
      }
      return h(
        'div',
        {
          ref: 'root',
          class: classNames,
        },
        slots
      )
    }
  },
})

export default PageLayout
