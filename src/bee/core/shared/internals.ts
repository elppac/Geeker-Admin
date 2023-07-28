import {
  FormPath,
  type FormPathPattern,
  each,
  pascalCase,
  isFn,
  isValid,
  isUndef,
  isEmpty,
  isPlainObj,
  isNumberLike,
  clone,
  toArr,
} from '@formily/shared'

import {
  autorun,
  batch,
  contains,
  toJS,
  isObservable,
  DataChange,
  reaction,
  untracked,
} from '@formily/reactive'
import { Field, ArrayField, Page, ObjectField } from '../models'
import {
  type ISpliceArrayStateProps,
  type IExchangeArrayStateProps,
  type IFieldResetOptions,
  type ISearchFeedback,
  type IFieldFeedback,
  type INodePatch,
  type GeneralField,
  type IPageFeedback,
  LifeCycleTypes,
  type FieldMatchPattern,
} from '../types'
import {
  isArrayField,
  isObjectField,
  isGeneralField,
  isDataField,
  isPage,
  isQuery,
  isVoidField,
} from './externals'
import {
  RESPONSE_REQUEST_DURATION,
  ReservedProperties,
  MutuallyExclusiveProperties,
  NumberIndexReg,
  GlobalState,
  ReadOnlyProperties,
} from './constants'

const hasOwnProperty = Object.prototype.hasOwnProperty

const notify = (
  target: Page | Field,
  pageType: LifeCycleTypes,
  fieldType: LifeCycleTypes
) => {
  if (isPage(target)) {
    target.notify(pageType)
  } else {
    target.notify(fieldType)
  }
}

export const isHTMLInputEvent = (event: any, stopPropagation = true) => {
  if (event?.target) {
    if (
      typeof event.target === 'object' &&
      ('value' in event.target || 'checked' in event.target)
    )
      return true
    if (stopPropagation) event.stopPropagation?.()
  }
  return false
}

export const getValuesFromEvent = (args: any[]) => {
  return args.map((event) => {
    if (event?.target) {
      if (isValid(event.target.value)) return event.target.value
      if (isValid(event.target.checked)) return event.target.checked
      return
    }
    return event
  })
}

export const getTypedDefaultValue = (field: Field) => {
  if (isArrayField(field)) return []
  if (isObjectField(field)) return {}
}

export const buildFieldPath = (field: GeneralField) => {
  return buildDataPath(field.page.fields, field.address)
}

export const buildDataPath = (
  fields: Record<string, GeneralField>,
  pattern: FormPath
) => {
  let prevArray = false
  const segments = pattern.segments
  const path = segments.reduce((path: string[], key: string, index: number) => {
    const currentPath = path.concat(key)
    const currentAddress = segments.slice(0, index + 1)
    const current = fields[currentAddress.join('.')]
    if (prevArray) {
      if (!isVoidField(current)) {
        prevArray = false
      }
      return path
    }
    if (index >= segments.length - 1) {
      return currentPath
    }
    if (isVoidField(current)) {
      const parentAddress = segments.slice(0, index)
      const parent = fields[parentAddress.join('.')]
      if (isArrayField(parent) && isNumberLike(key)) {
        prevArray = true
        return currentPath
      }
      return path
    } else {
      prevArray = false
    }
    return currentPath
  }, [])
  return new FormPath(path)
}

export const locateNode = (field: GeneralField, address: FormPathPattern) => {
  field.address = FormPath.parse(address)
  field.path = buildFieldPath(field)
  field.page.indexes[field.path.toString()] = field.address.toString()
  return field
}

export const patchFieldStates = (
  target: Record<string, GeneralField>,
  patches: INodePatch<GeneralField>[]
) => {
  patches.forEach(({ type, address, oldAddress, payload }) => {
    if (type === 'remove') {
      destroy(target, address, false)
    } else if (type === 'update') {
      if (payload) {
        target[address] = payload
        if (target[oldAddress] === payload) {
          delete target[oldAddress]
        }
      }
      if (address && payload) {
        locateNode(payload, address)
      }
    }
  })
}

export const destroy = (
  target: Record<string, GeneralField>,
  address: string,
  forceClear = true
) => {
  const field = target[address]
  field?.dispose()
  if (isDataField(field) && forceClear) {
    const page = field.page
    const path = field.path
    page.deleteValuesIn(path)
    page.deleteInitialValuesIn(path)
  }
  delete target[address]
}

export const patchPageValues = (
  page: Page,
  path: Array<string | number>,
  source: any
) => {
  const update = (path: Array<string | number>, source: any) => {
    if (path.length) {
      page.setValuesIn(path, clone(source))
    } else {
      Object.assign(page.values, clone(source))
    }
  }

  const patch = (source: any, path: Array<string | number> = []) => {
    const targetValue = page.getValuesIn(path)
    const targetField = page.query(path).take()
    const isUnVoidField = targetField && !isVoidField(targetField)

    if (isUnVoidField && targetField.display === 'none') {
      targetField.caches.value = clone(source)
      return
    }

    if (allowAssignDefaultValue(targetValue, source)) {
      update(path, source)
    } else {
      if (isEmpty(source)) return
      if (GlobalState.initializing) return
      if (isPlainObj(targetValue) && isPlainObj(source)) {
        each(source, (value, key) => {
          patch(value, path.concat(key))
        })
      } else {
        if (targetField) {
          if (isUnVoidField && !targetField.selfModified) {
            update(path, source)
          }
        } else if (page.initialized) {
          update(path, source)
        }
      }
    }
  }
  patch(source, path)
}

export const matchFeedback = (
  search?: ISearchFeedback,
  feedback?: IPageFeedback
) => {
  if (!search || !feedback) return false
  if (search.type && search.type !== feedback.type) return false
  if (search.code && search.code !== feedback.code) return false
  if (search.path && feedback.path) {
    if (!FormPath.parse(search.path).match(feedback.path)) return false
  }
  if (search.address && feedback.address) {
    if (!FormPath.parse(search.address).match(feedback.address)) return false
  }
  if (search.triggerType && search.triggerType !== feedback.triggerType)
    return false
  return true
}

export const queryFeedbacks = (field: Field, search?: ISearchFeedback) => {
  return field.feedbacks.filter((feedback) => {
    if (!feedback.messages?.length) return false
    return matchFeedback(search, {
      ...feedback,
      address: field.address?.toString(),
      path: field.path?.toString(),
    })
  })
}

export const queryFeedbackMessages = (
  field: Field,
  search: ISearchFeedback
) => {
  if (!field.feedbacks.length) return []
  return queryFeedbacks(field, search).reduce(
    (buf, info) => (isEmpty(info.messages) ? buf : buf.concat(info.messages)),
    []
  )
}

export const updateFeedback = (field: Field, feedback?: IFieldFeedback) => {
  if (!feedback) return
  return batch(() => {
    if (!field.feedbacks.length) {
      if (!feedback.messages?.length) {
        return
      }
      field.feedbacks = [feedback]
    } else {
      const searched = queryFeedbacks(field, feedback)
      if (searched.length) {
        field.feedbacks = field.feedbacks.reduce((buf, item) => {
          if (searched.includes(item)) {
            if (feedback.messages?.length) {
              item.messages = feedback.messages
              return buf.concat(item)
            } else {
              return buf
            }
          } else {
            return buf.concat(item)
          }
        }, [])
        return
      } else if (feedback.messages?.length) {
        field.feedbacks = field.feedbacks.concat(feedback)
      }
    }
  })
}


export const spliceArrayState = (
  field: ArrayField,
  props?: ISpliceArrayStateProps
) => {
  const { startIndex, deleteCount, insertCount } = {
    startIndex: 0,
    deleteCount: 0,
    insertCount: 0,
    ...props,
  }
  const address = field.address.toString()
  const addrLength = address.length
  const page = field.page
  const fields = page.fields
  const fieldPatches: INodePatch<GeneralField>[] = []
  const offset = insertCount - deleteCount
  const isArrayChildren = (identifier: string) => {
    return identifier.indexOf(address) === 0 && identifier.length > addrLength
  }
  const isAfterNode = (identifier: string) => {
    const afterStr = identifier.substring(addrLength)
    const number = afterStr.match(NumberIndexReg)?.[1]
    if (number === undefined) return false
    const index = Number(number)
    return index > startIndex + deleteCount - 1
  }
  const isInsertNode = (identifier: string) => {
    const afterStr = identifier.substring(addrLength)
    const number = afterStr.match(NumberIndexReg)?.[1]
    if (number === undefined) return false
    const index = Number(number)
    return index >= startIndex && index < startIndex + insertCount
  }
  const isDeleteNode = (identifier: string) => {
    const preStr = identifier.substring(0, addrLength)
    const afterStr = identifier.substring(addrLength)
    const number = afterStr.match(NumberIndexReg)?.[1]
    if (number === undefined) return false
    const index = Number(number)
    return (
      (index > startIndex &&
        !fields[
          `${preStr}${afterStr.replace(/^\.\d+/, `.${index + deleteCount}`)}`
        ]) ||
      index === startIndex
    )
  }
  const moveIndex = (identifier: string) => {
    if (offset === 0) return identifier
    const preStr = identifier.substring(0, addrLength)
    const afterStr = identifier.substring(addrLength)
    const number = afterStr.match(NumberIndexReg)?.[1]
    if (number === undefined) return identifier
    const index = Number(number) + offset
    return `${preStr}${afterStr.replace(/^\.\d+/, `.${index}`)}`
  }

  batch(() => {
    each(fields, (field, identifier) => {
      if (isArrayChildren(identifier)) {
        if (isAfterNode(identifier)) {
          const newIdentifier = moveIndex(identifier)
          fieldPatches.push({
            type: 'update',
            address: newIdentifier,
            oldAddress: identifier,
            payload: field,
          })
        }
        if (isInsertNode(identifier) || isDeleteNode(identifier)) {
          fieldPatches.push({ type: 'remove', address: identifier })
        }
      }
    })
    patchFieldStates(fields, fieldPatches)
  })
  field.page.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE)
}

export const exchangeArrayState = (
  field: ArrayField,
  props: IExchangeArrayStateProps
) => {
  const { fromIndex, toIndex } = {
    fromIndex: 0,
    toIndex: 0,
    ...props,
  }
  const address = field.address.toString()
  const fields = field.page.fields
  const addrLength = address.length
  const fieldPatches: INodePatch<GeneralField>[] = []
  const isArrayChildren = (identifier: string) => {
    return identifier.indexOf(address) === 0 && identifier.length > addrLength
  }

  const isDown = fromIndex < toIndex

  const isMoveNode = (identifier: string) => {
    const afterStr = identifier.slice(address.length)
    const number = afterStr.match(NumberIndexReg)?.[1]
    if (number === undefined) return false
    const index = Number(number)
    return isDown
      ? index > fromIndex && index <= toIndex
      : index < fromIndex && index >= toIndex
  }

  const isFromNode = (identifier: string) => {
    const afterStr = identifier.substring(addrLength)
    const number = afterStr.match(NumberIndexReg)?.[1]
    if (number === undefined) return false
    const index = Number(number)
    return index === fromIndex
  }

  const moveIndex = (identifier: string) => {
    const preStr = identifier.substring(0, addrLength)
    const afterStr = identifier.substring(addrLength)
    const number = afterStr.match(NumberIndexReg)[1]
    const current = Number(number)
    let index = current
    if (index === fromIndex) {
      index = toIndex
    } else {
      index += isDown ? -1 : 1
    }

    return `${preStr}${afterStr.replace(/^\.\d+/, `.${index}`)}`
  }

  batch(() => {
    each(fields, (field, identifier) => {
      if (isArrayChildren(identifier)) {
        if (isMoveNode(identifier) || isFromNode(identifier)) {
          const newIdentifier = moveIndex(identifier)
          fieldPatches.push({
            type: 'update',
            address: newIdentifier,
            oldAddress: identifier,
            payload: field,
          })
          if (!fields[newIdentifier]) {
            fieldPatches.push({
              type: 'remove',
              address: identifier,
            })
          }
        }
      }
    })
    patchFieldStates(fields, fieldPatches)
  })
  field.page.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE)
}

export const cleanupArrayChildren = (field: ArrayField, start: number) => {
  const address = field.address.toString()
  const fields = field.page.fields

  const isArrayChildren = (identifier: string) => {
    return (
      identifier.indexOf(address) === 0 && identifier.length > address.length
    )
  }

  const isNeedCleanup = (identifier: string) => {
    const afterStr = identifier.slice(address.length)
    const numStr = afterStr.match(NumberIndexReg)?.[1]
    if (numStr === undefined) return false
    const index = Number(numStr)
    return index >= start
  }

  batch(() => {
    each(fields, (field, identifier) => {
      if (isArrayChildren(identifier) && isNeedCleanup(identifier)) {
        field.destroy()
      }
    })
  })
}

export const cleanupObjectChildren = (field: ObjectField, keys: string[]) => {
  if (keys.length === 0) return
  const address = field.address.toString()
  const fields = field.page.fields

  const isObjectChildren = (identifier: string) => {
    return (
      identifier.indexOf(address) === 0 && identifier.length > address.length
    )
  }

  const isNeedCleanup = (identifier: string) => {
    const afterStr = identifier.slice(address.length)
    const key = afterStr.match(/^\.([^.]+)/)?.[1]
    if (key === undefined) return false
    return keys.includes(key)
  }

  batch(() => {
    each(fields, (field, identifier) => {
      if (isObjectChildren(identifier) && isNeedCleanup(identifier)) {
        field.destroy()
      }
    })
  })
}

export const initFieldUpdate = batch.scope.bound((field: GeneralField) => {
  const page = field.page
  const updates = FormPath.ensureIn(page, 'requests.updates', [])
  const indexes = FormPath.ensureIn(page, 'requests.updateIndexes', {})
  for (let index = 0; index < updates.length; index++) {
    const { pattern, callbacks } = updates[index]
    let removed = false
    if (field.match(pattern)) {
      callbacks.forEach((callback) => {
        field.setState(callback)
      })
      if (!pattern.isWildMatchPattern && !pattern.isMatchPattern) {
        updates.splice(index--, 1)
        removed = true
      }
    }
    if (!removed) {
      indexes[pattern.toString()] = index
    } else {
      delete indexes[pattern.toString()]
    }
  }
})

export const subscribeUpdate = (
  page: Page,
  pattern: FormPath,
  callback: (...args: any[]) => void
) => {
  const updates = FormPath.ensureIn(page, 'requests.updates', [])
  const indexes = FormPath.ensureIn(page, 'requests.updateIndexes', {})
  const id = pattern.toString()
  const current = indexes[id]
  if (isValid(current)) {
    if (
      updates[current] &&
      !updates[current].callbacks.some((fn: any) =>
        fn.toString() === callback.toString() ? fn === callback : false
      )
    ) {
      updates[current].callbacks.push(callback)
    }
  } else {
    indexes[id] = updates.length
    updates.push({
      pattern,
      callbacks: [callback],
    })
  }
}

export const deserialize = (model: any, setter: any) => {
  if (!model) return
  if (isFn(setter)) {
    setter(model)
  } else {
    for (let key in setter) {
      if (!hasOwnProperty.call(setter, key)) continue
      if (ReadOnlyProperties[key] || ReservedProperties[key]) continue
      const MutuallyExclusiveKey = MutuallyExclusiveProperties[key]
      if (
        MutuallyExclusiveKey &&
        hasOwnProperty.call(setter, MutuallyExclusiveKey) &&
        !isValid(setter[MutuallyExclusiveKey])
      )
        continue
      const value = setter[key]
      if (isFn(value)) continue
      model[key] = value
    }
  }
  return model
}

export const serialize = (model: any, getter?: any) => {
  if (isFn(getter)) {
    return getter(model)
  } else {
    const results = {}
    for (let key in model) {
      if (!hasOwnProperty.call(model, key)) continue
      if (ReservedProperties[key]) continue
      if (key === 'address' || key === 'path') {
        results[key] = model[key].toString()
        continue
      }
      const value = model[key]
      if (isFn(value)) continue
      results[key] = toJS(value)
    }
    return results
  }
}

export const createChildrenFeedbackFilter = (field: Field) => {
  const identifier = field.address?.toString()
  return ({ address }: IPageFeedback) => {
    return address === identifier || address.indexOf(identifier + '.') === 0
  }
}

export const createStateSetter = (model: any) => {
  return batch.bound((setter?: any) => deserialize(model, setter))
}

export const createStateGetter = (model: any) => {
  return (getter?: any) => serialize(model, getter)
}

export const createBatchStateSetter = (page: Page) => {
  return batch.bound((pattern: FieldMatchPattern, payload?: any) => {
    if (isQuery(pattern)) {
      pattern.forEach((field) => {
        field.setState(payload)
      })
    } else if (isGeneralField(pattern)) {
      pattern.setState(payload)
    } else {
      let matchCount = 0,
        path = FormPath.parse(pattern)
      page.query(path).forEach((field) => {
        field.setState(payload)
        matchCount++
      })

      if (matchCount === 0 || path.isWildMatchPattern) {
        subscribeUpdate(page, path, payload)
      }
    }
  })
}

export const createBatchStateGetter = (page: Page) => {
  return (pattern: FieldMatchPattern, payload?: any) => {
    if (isQuery(pattern)) {
      return pattern.take(payload)
    } else if (isGeneralField(pattern)) {
      return (pattern as any).getState(payload)
    } else {
      return page.query(pattern).take((field: any) => {
        return field.getState(payload)
      })
    }
  }
}

export const triggerPageInitialValuesChange = (
  page: Page,
  change: DataChange
) => {
  if (Array.isArray(change.object) && change.key === 'length') return
  if (
    contains(page.initialValues, change.object) ||
    page.initialValues === change.value
  ) {
    if (change.type === 'add' || change.type === 'set') {
      patchPageValues(page, change.path.slice(1), change.value)
    }
    if (page.initialized) {
      page.notify(LifeCycleTypes.ON_FORM_INITIAL_VALUES_CHANGE)
    }
  }
}

export const triggerPageValuesChange = (page: Page, change: DataChange) => {
  if (Array.isArray(change.object) && change.key === 'length') return
  if (
    (contains(page.values, change.object) || page.values === change.value) &&
    page.initialized
  ) {
    page.notify(LifeCycleTypes.ON_FORM_VALUES_CHANGE)
  }
}


export const setLoading = (target: Page | Field, loading: boolean) => {
  clearTimeout(target.requests.loading)
  if (loading) {
    target.requests.loading = setTimeout(() => {
      batch(() => {
        target.loading = loading
        notify(
          target,
          LifeCycleTypes.ON_FORM_LOADING,
          LifeCycleTypes.ON_FIELD_LOADING
        )
      })
    }, RESPONSE_REQUEST_DURATION)
  } else if (target.loading !== loading) {
    target.loading = loading
  }
}


export const resetSelf = batch.bound(
  async (target: Field, options?: IFieldResetOptions, noEmit = false) => {
    const typedDefaultValue = getTypedDefaultValue(target)
    target.modified = false
    target.selfModified = false
    target.visited = false
    target.feedbacks = []
    target.inputValue = typedDefaultValue
    target.inputValues = []
    target.caches = {}
    if (!isUndef(target.value)) {
      if (options?.forceClear) {
        target.value = typedDefaultValue
      } else {
        target.value = toJS(
          !isUndef(target.initialValue)
            ? target.initialValue
            : typedDefaultValue
        )
      }
    }
    if (!noEmit) {
      target.notify(LifeCycleTypes.ON_FIELD_RESET)
    }
    if (options?.validate) {
      // return await validateSelf(target)
    }
  }
)

export const modifySelf = (target: Field) => {
  if (target.selfModified) return
  target.selfModified = true
  target.modified = true
  let parent = target.parent
  while (parent) {
    if (isDataField(parent)) {
      if (parent.modified) return
      parent.modified = true
    }
    parent = parent.parent
  }
  target.page.modified = true
}

export const getValidPageValues = (values: any) => {
  if (isObservable(values)) return values
  return clone(values || {})
}

export const getValidFieldDefaultValue = (value: any, initialValue: any) => {
  if (allowAssignDefaultValue(value, initialValue)) return clone(initialValue)
  return value
}

export const allowAssignDefaultValue = (target: any, source: any) => {
  const isEmptyTarget = target !== null && isEmpty(target)
  const isEmptySource = source !== null && isEmpty(source)
  const isValidTarget = !isUndef(target)
  const isValidSource = !isUndef(source)
  if (!isValidTarget) {
    if (isValidSource) {
      return true
    }
    return false
  }

  if (typeof target === typeof source) {
    if (target === '') return false
    if (target === 0) return false
  }

  if (isEmptyTarget) {
    if (isEmptySource) {
      return false
    } else {
      return true
    }
  }
  return false
}

export const createReactions = (field: GeneralField) => {
  const reactions = toArr(field.props.reactions)
  field.page.addEffects(field, () => {
    reactions.forEach((reaction) => {
      if (isFn(reaction)) {
        field.disposers.push(
          autorun(
            batch.scope.bound(() => {
              if (field.destroyed) return
              reaction(field)
            })
          )
        )
      }
    })
  })
}

export const createReaction = <T>(
  tracker: () => T,
  scheduler?: (value: T) => void
) => {
  return reaction(tracker, untracked.bound(scheduler))
}

export const initializeStart = () => {
  GlobalState.initializing = true
}

export const initializeEnd = () => {
  batch.endpoint(() => {
    GlobalState.initializing = false
  })
}
