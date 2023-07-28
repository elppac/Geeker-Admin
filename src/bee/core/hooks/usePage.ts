import { inject, type Ref, ref } from 'vue-demi'
import type { Page } from '../Page'
import { PageSymbol } from '../context'

export const usePage = (): Ref<Page> => {
  const page = inject(PageSymbol, ref())
  return page
}
