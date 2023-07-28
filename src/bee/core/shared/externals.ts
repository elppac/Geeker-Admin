import { FormPath } from '@formily/shared'
import { Page } from '../models'
import { type IPageProps } from '../types'
import {
  createEffectHook,
  createEffectContext,
  useEffectPage,
} from './effective'
import {
  isArrayField,
  isArrayFieldState,
  isDataField,
  isDataFieldState,
  isField,
  isFieldState,
  isPage,
  isPageState,
  isGeneralField,
  isGeneralFieldState,
  isObjectField,
  isObjectFieldState,
  isQuery,
  isVoidField,
  isVoidFieldState,
} from './checkers'

const createPage = <T extends object = any>(options?: IPageProps<T>) => {
  return new Page(options)
}

export {
  FormPath,
  createPage,
  isArrayField,
  isArrayFieldState,
  isDataField,
  isDataFieldState,
  isField,
  isFieldState,
  isPage,
  isPageState,
  isGeneralField,
  isGeneralFieldState,
  isObjectField,
  isObjectFieldState,
  isQuery,
  isVoidField,
  isVoidFieldState,
  createEffectHook,
  createEffectContext,
  useEffectPage,
}
