import { type InjectionKey, type Ref } from 'vue-demi'
import { Page,  } from '../../core/models'
import { Schema } from '../../json-schema'
import { type ISchemaFieldVueFactoryOptions } from '../types'
// import { GeneralField } from '../../core/types'
export const PageSymbol: InjectionKey<Ref<Page>> = Symbol('page')
export const FieldSymbol= Symbol('field')
export const SchemaMarkupSymbol: InjectionKey<Ref<Schema>> =
  Symbol('schemaMarkup')
export const SchemaSymbol: InjectionKey<Ref<Schema>> = Symbol('schema')
export const SchemaExpressionScopeSymbol: InjectionKey<
  Ref<Record<string, any>>
> = Symbol('schemaExpression')
export const SchemaOptionsSymbol: InjectionKey<
  Ref<ISchemaFieldVueFactoryOptions>
> = Symbol('schemaOptions')
