import { defineStore } from "pinia";
import { getPage } from "@/api/modules/app";
import * as _ from "lodash-es";
export type PAGES = { [key: string]: any };
export interface AppState {
  currentPage: string;
  pages: PAGES;
}
/**
 * 页面设置
 * @param state
 * @returns
 */
const getPageSetting = (state: AppState) => {
  return _.get(state, `pages[${state.currentPage}]`);
};
/**
 * 列表场景
 * @param state
 * @returns
 */
const getListSetting = (state: AppState) => {
  return _.get(getPageSetting(state), `[x-scenes].list`);
};
/**
 * 列表场景
 * @param state
 * @returns
 */
const getSearchbarSetting = (state: AppState) => {
  return _.get(getPageSetting(state), `[x-scenes].search`);
};
/**
 * 元模型
 * @param state
 * @returns
 */
const getModel = (state: AppState) => {
  return _.get(getPageSetting(state), `[x-model]`);
};
/**
 * 字段的场景扩展
 * @param state
 * @returns
 */
const getFieldExtra = (state: AppState) => {
  return _.get(getPageSetting(state), `[x-field-extra]`);
};
export const useAppStore = defineStore({
  id: "gram-app",
  state: (): AppState => ({
    pages: {},
    // 当前页面的 router name
    currentPage: ""
  }),
  getters: {
    pageSchema: state => {
      if (!state.currentPage) {
        return null;
      }
      const page = getPageSetting(state);
      if (page) {
        return page["x-schema"];
      }
      return null;
    },
    pageState: state => state,
    scenesListConfig: state => {
      const setting = getListSetting(state);
      const model = getModel(state);
      if (setting) {
        const extra = getFieldExtra(state);
        const items = _.filter(model, i => setting.fields.includes(i.name)).map(i => {
          if (extra && extra[i.name] && extra[i.name].list) {
            return { ...i, ...extra[i.name].list };
          }
          return i;
        });

        return { ...setting, items };
      }
      return null;
    },
    scenesSearchbarConfig: state => {
      const setting = getSearchbarSetting(state);
      const model = getModel(state);
      if (setting) {
        const extra = getFieldExtra(state);
        const items = _.filter(model, i => setting.fields.includes(i.name)).map(i => {
          if (extra && extra[i.name] && extra[i.name].search) {
            return { ...i, ...extra[i.name].search };
          }
          return i;
        });

        return { ...setting, items };
      }
      return null;
    }
  },
  actions: {
    async getPage(name: string) {
      if (!this.pages[this.currentPage]) {
        const page = await getPage({ name });
        this.pages[this.currentPage] = page;
      }
    },
    // Set RouteName
    async setCurrentPageName(name: string) {
      this.currentPage = name;
    }
  }
});
