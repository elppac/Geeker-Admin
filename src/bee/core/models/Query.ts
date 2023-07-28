import { FormPath, isFn, each, type FormPathPattern } from '@formily/shared'
import { buildDataPath } from '../shared/internals'
import { type GeneralField, type IGeneralFieldState, type IQueryProps } from '../types'
import { Page } from './Page'

const output = (
  field: GeneralField,
  taker: (field: GeneralField, address: FormPath) => any
) => {
  if (!field) return
  if (isFn(taker)) {
    return taker(field, field.address)
  }
  return field
}

const takeMatchPattern = (page: Page, pattern: FormPath) => {
  const identifier = pattern.toString()
  const indexIdentifier = page.indexes[identifier]
  const absoluteField = page.fields[identifier]
  const indexField = page.fields[indexIdentifier]
  if (absoluteField) {
    return identifier
  } else if (indexField) {
    return indexIdentifier
  }
}

export class Query {
  private pattern: FormPath
  private addresses: string[] = []
  private page: Page
  constructor(props: IQueryProps) {
    this.pattern = FormPath.parse(props.pattern, props.base)
    this.page = props.page
    if (!this.pattern.isMatchPattern) {
      const matched = takeMatchPattern(
        this.page,
        this.pattern.haveRelativePattern
          ? buildDataPath(props.page.fields, this.pattern)
          : this.pattern
      )
      if (matched) {
        this.addresses = [matched]
      }
    } else {
      each(this.page.fields, (field, address) => {
        if (field.match(this.pattern)) {
          this.addresses.push(address)
        }
      })
    }
  }

  take(): GeneralField
  take<Result>(
    getter: (field: GeneralField, address: FormPath) => Result
  ): Result
  take(taker?: any): any {
    return output(this.page.fields[this.addresses[0]], taker)
  }

  map(): GeneralField[]
  map<Result>(
    iterator?: (field: GeneralField, address: FormPath) => Result
  ): Result[]
  map(iterator?: any): any {
    return this.addresses.map((address) =>
      output(this.page.fields[address], iterator)
    )
  }

  forEach<Result>(
    iterator: (field: GeneralField, address: FormPath) => Result
  ) {
    return this.addresses.forEach((address) =>
      output(this.page.fields[address], iterator)
    )
  }

  reduce<Result>(
    reducer: (value: Result, field: GeneralField, address: FormPath) => Result,
    initial?: Result
  ): Result {
    return this.addresses.reduce(
      (value, address) =>
        output(this.page.fields[address], (field, address) =>
          reducer(value, field, address)
        ),
      initial
    )
  }

  get<K extends keyof IGeneralFieldState>(key: K): IGeneralFieldState[K] {
    const results: any = this.take()
    if (results) {
      return results[key]
    }
  }

  getIn(pattern?: FormPathPattern) {
    return FormPath.getIn(this.take(), pattern)
  }

  value() {
    return this.get('value')
  }

  initialValue() {
    return this.get('initialValue')
  }
}
