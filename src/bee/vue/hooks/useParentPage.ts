import { computed, type Ref } from 'vue-demi'
import { useField } from './useField'
import { usePage } from './usePage'
import { isObjectField, type Page, type GeneralField, type ObjectField } from '../../core'

export const useParentPage = (): Ref<Page | ObjectField> => {
  const field = useField()
  const page = usePage()
  const findObjectParent = (field: GeneralField) => {
    if (!field) return page.value
    if (isObjectField(field)) return field
    return findObjectParent(field?.parent)
  }
  return computed(() => findObjectParent(field.value))
}
