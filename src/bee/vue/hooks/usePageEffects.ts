import { onBeforeUnmount } from 'vue-demi'
import { uid } from '@formily/shared'
import { usePage } from './usePage'
import type { Page } from '../../core/models'

export const usePageEffects = (effects?: (page: Page) => void): void => {
  const pageRef = usePage()

  const id = uid()
  pageRef.value.addEffects(id, effects)

  onBeforeUnmount(() => {
    pageRef.value.removeEffects(id)
  })
}
