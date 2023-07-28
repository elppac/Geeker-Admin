import { inject, type Ref, ref } from 'vue-demi'
import { PageSymbol } from '../shared/context'
import { Page } from '../../core/models'

export const usePage = (): Ref<Page> => {
  const page = inject(PageSymbol, ref())
  return page
}
