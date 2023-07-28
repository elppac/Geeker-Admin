import { define, batch } from '@formily/reactive'
import { each, FormPath } from '@formily/shared'
import { type IPageGraph } from '../types'
import { Page } from './Page'
import {
  isPageState,
  isFieldState,
  isArrayFieldState,
  isObjectFieldState,
} from '../shared/checkers'

export class Graph {
  page: Page

  constructor(page: Page) {
    this.page = page
    define(this, {
      setGraph: batch,
    })
  }

  getGraph = (): IPageGraph => {
    const graph = {}
    graph[''] = this.page.getState()
    each(this.page.fields, (field: any, identifier) => {
      graph[identifier] = field.getState()
    })
    return graph
  }

  setGraph = (graph: IPageGraph) => {
    const page = this.page
    const createField = (identifier: string, state: any) => {
      const address = FormPath.parse(identifier)
      const name = address.segments[address.segments.length - 1]
      const basePath = address.parent()
      if (isFieldState(state)) {
        return this.page.createField({ name, basePath })
      } else if (isArrayFieldState(state)) {
        return this.page.createArrayField({ name, basePath })
      } else if (isObjectFieldState(state)) {
        return this.page.createObjectField({ name, basePath })
      } else {
        return this.page.createVoidField({ name, basePath })
      }
    }
    each(graph, (state, address) => {
      if (isPageState(state)) {
        page.setState(state)
      } else {
        const field = page.fields[address]
        if (field) {
          field.setState(state as any)
        } else {
          createField(address, state).setState(state as any)
        }
      }
    })
  }
}
