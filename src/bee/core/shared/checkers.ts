import { isFn } from '@formily/shared'
import {
  Page,
  Field,
  ArrayField,
  ObjectField,
  VoidField,
  Query,
} from '../models'
import {
  type IPageState,
  type IFieldState,
  type IVoidFieldState,
  type GeneralField,
  type IGeneralFieldState,
  type DataField,
} from '../types'

export const isPage = (node: any): node is Page => {
  return node instanceof Page
}

export const isField = (node: any): node is Field => {
  return node instanceof Field
}

export const isGeneralField = (node: any): node is GeneralField => {
  return node instanceof Field || node instanceof VoidField
}

export const isArrayField = (node: any): node is ArrayField => {
  return node instanceof ArrayField
}

export const isObjectField = (node: any): node is ObjectField => {
  return node instanceof ObjectField
}

export const isVoidField = (node: any): node is VoidField => {
  return node instanceof VoidField
}

export const isPageState = (state: any): state is IPageState => {
  if (isFn(state?.initialize)) return false
  return state?.displayName === 'Page'
}

export const isFieldState = (state: any): state is IFieldState => {
  if (isFn(state?.initialize)) return false
  return state?.displayName === 'Field'
}

export const isGeneralFieldState = (node: any): node is IGeneralFieldState => {
  if (isFn(node?.initialize)) return false
  return node?.displayName?.indexOf('Field') > -1
}

export const isArrayFieldState = (state: any): state is IFieldState => {
  if (isFn(state?.initialize)) return false
  return state?.displayName === 'ArrayField'
}

export const isDataField = (node: any): node is DataField => {
  return isField(node) || isArrayField(node) || isObjectField(node)
}

export const isDataFieldState = (node: any) => {
  return (
    isFieldState(node) || isObjectFieldState(node) || isArrayFieldState(node)
  )
}

export const isObjectFieldState = (state: any): state is IFieldState => {
  if (isFn(state?.initialize)) return false
  return state?.displayName === 'ObjectField'
}

export const isVoidFieldState = (state: any): state is IVoidFieldState => {
  if (isFn(state?.initialize)) return false
  return state?.displayName === 'VoidField'
}

export const isQuery = (query: any): query is Query => {
  return query && query instanceof Query
}
