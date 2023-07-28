import { FormPath, isFn, toArr } from '@formily/shared'
import { autorun, reaction, batch } from '@formily/reactive'
import { Page } from '../models'
import {
  LifeCycleTypes,
  type FormPathPattern,
  type GeneralField,
  type DataField,
  type IFieldState,
} from '../types'
import { createEffectHook, useEffectPage } from '../shared/effective'

function createFieldEffect<Result extends GeneralField = GeneralField>(
  type: LifeCycleTypes
) {
  return createEffectHook(
    type,
    (field: Result, page: Page) =>
      (
        pattern: FormPathPattern,
        callback: (field: Result, page: Page) => void
      ) => {
        if (
          FormPath.parse(pattern).matchAliasGroup(field.address, field.path)
        ) {
          batch(() => {
            callback(field, page)
          })
        }
      }
  )
}
const _onFieldInit = createFieldEffect(LifeCycleTypes.ON_FIELD_INIT)
export const onFieldMount = createFieldEffect(LifeCycleTypes.ON_FIELD_MOUNT)
export const onFieldUnmount = createFieldEffect(LifeCycleTypes.ON_FIELD_UNMOUNT)
export const onFieldValueChange = createFieldEffect<DataField>(
  LifeCycleTypes.ON_FIELD_VALUE_CHANGE
)
export const onFieldInitialValueChange = createFieldEffect<DataField>(
  LifeCycleTypes.ON_FIELD_INITIAL_VALUE_CHANGE
)
export const onFieldInputValueChange = createFieldEffect<DataField>(
  LifeCycleTypes.ON_FIELD_INPUT_VALUE_CHANGE
)
export const onFieldLoading = createFieldEffect<DataField>(
  LifeCycleTypes.ON_FIELD_LOADING
)

export function onFieldInit(
  pattern: FormPathPattern,
  callback?: (field: GeneralField, page: Page) => void
) {
  const page = useEffectPage()
  const count = page.query(pattern).reduce((count, field) => {
    callback(field, page)
    return count + 1
  }, 0)
  if (count === 0) {
    _onFieldInit(pattern, callback)
  }
}

export function onFieldReact(
  pattern: FormPathPattern,
  callback?: (field: GeneralField, page: Page) => void
) {
  onFieldInit(pattern, (field, page) => {
    field.disposers.push(
      autorun(() => {
        if (isFn(callback)) callback(field, page)
      })
    )
  })
}
export function onFieldChange(
  pattern: FormPathPattern,
  callback?: (field: GeneralField, page: Page) => void
): void
export function onFieldChange(
  pattern: FormPathPattern,
  watches: (keyof IFieldState)[],
  callback?: (field: GeneralField, page: Page) => void
): void
export function onFieldChange(
  pattern: FormPathPattern,
  watches: any,
  callback?: (field: GeneralField, page: Page) => void
): void {
  if (isFn(watches)) {
    callback = watches
    watches = ['value']
  } else {
    watches = watches || ['value']
  }
  onFieldInit(pattern, (field, page) => {
    if (isFn(callback)) callback(field, page)
    const dispose = reaction(
      () => {
        return toArr(watches).map((key) => {
          return field[key]
        })
      },
      () => {
        if (isFn(callback)) callback(field, page)
      }
    )
    field.disposers.push(dispose)
  })
}
