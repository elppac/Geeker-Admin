import { createPage } from '../../core'
import { markRaw } from 'vue-demi'

const createRawPage = (...args: Parameters<typeof createPage>) => {
  const page = createPage(...args)
  return markRaw(page)
}

export { createRawPage as createPage }
