import { computed, defineComponent, inject, provide, type Ref } from 'vue-demi'
import { SchemaExpressionScopeSymbol, Fragment, h } from '../shared'
import { type IExpressionScopeProps } from '../types'

export const ExpressionScope = defineComponent({
  name: 'ExpressionScope',
  props: ['value'],
  setup(props: IExpressionScopeProps, { slots }) {
    const scopeRef = inject<Ref>(SchemaExpressionScopeSymbol)
    const expressionScopeRef = computed(() => ({
      ...scopeRef.value,
      ...props.value,
    }))

    provide(SchemaExpressionScopeSymbol, expressionScopeRef)

    return () => h(Fragment, {}, slots)
  },
})
