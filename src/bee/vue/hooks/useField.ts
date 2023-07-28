import { inject, type Ref, ref } from 'vue-demi'
import { FieldSymbol } from '../shared/context'
import type { GeneralField } from '../../core/types'

export const useField = <T = GeneralField>(): Ref<T> => {
  return inject(FieldSymbol, ref()) as any
}
