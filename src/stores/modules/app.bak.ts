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
const getFormSetting = (state: AppState) => {
  return _.get(getPageSetting(state), `[x-scenes].edit`);
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
    },
    scenesFormConfig: state => {
      const setting = getFormSetting(state);
      const model = getModel(state);
      const extra = getFieldExtra(state);

      const getComponent = (schema: any) => {
        let formSchema: any = { "x-component": "Input" };
        switch (schema.type) {
          case "number":
            formSchema["x-component"] = "InputNumber";
            break;
          default:
        }
        if (schema.bizType === "enum") {
          switch (schema.source.type) {
            case "static":
              formSchema["x-component"] = "Select";
              formSchema["x-reactions"] = ["{{useAsyncDataSource()}}"];
              break;
            default:
          }
        } else if (schema.bizType === "image") {
          formSchema["x-component"] = "Upload";
        } else if (schema.bizType === "model") {
          formSchema["x-component"] = "InputTable";
          formSchema["x-decorator-props"] = { gridSpan: "span 4", layout: "vertical", labelAlign: "left" };
          formSchema["x-component-props"] = { pagination: { pageSize: 2 } };
          formSchema.items = {
            type: "object",
            properties: {
              column1: {
                type: "void",
                "x-component": "InputTable.Column",
                "x-component-props": {
                  width: 80,
                  title: "Index",
                  align: "center"
                },
                properties: {
                  index: {
                    type: "void",
                    "x-component": "InputTable.Index"
                  }
                }
              },
              column2: {
                type: "void",
                "x-component": "InputTable.Column",
                "x-component-props": { width: 200, title: "A1" },
                properties: {
                  a1: {
                    type: "string",
                    "x-decorator": "FormItem",
                    "x-component": "Input"
                  }
                }
              },
              column3: {
                type: "void",
                "x-component": "InputTable.Column",
                "x-component-props": { width: 200, title: "A2" },
                properties: {
                  a2: {
                    type: "string",
                    "x-decorator": "FormItem",
                    "x-component": "Input"
                  }
                }
              },
              column4: {
                type: "void",
                "x-component": "InputTable.Column",
                "x-component-props": { title: "A3" },
                properties: {
                  a3: {
                    type: "string",
                    "x-decorator": "FormItem",
                    "x-component": "Input"
                  }
                }
              },
              column5: {
                type: "void",
                "x-component": "InputTable.Column",
                "x-component-props": {
                  title: "Operations",
                  prop: "operations",
                  width: 200,
                  fixed: "right"
                },
                properties: {
                  item: {
                    type: "void",
                    "x-component": "FormItem",
                    properties: {
                      remove: {
                        type: "void",
                        "x-component": "InputTable.Remove"
                      },
                      moveDown: {
                        type: "void",
                        "x-component": "InputTable.MoveDown"
                      },
                      moveUp: {
                        type: "void",
                        "x-component": "InputTable.MoveUp"
                      }
                    }
                  }
                }
              }
            }
          };
          formSchema.properties = {
            add: {
              type: "void",
              "x-component": "InputTable.Addition",
              title: "添加条目"
            }
          };
        }
        return formSchema;
      };

      const recursion: any = (data: any) => {
        const { children, fields, ...rest } = data;
        const schema: any = rest;
        if (Array.isArray(children)) {
          schema.properties = {};
          children
            .map(i => recursion(i))
            .forEach(i => {
              schema.properties[i.name ?? _.uniqueId(_.camelCase(i["x-component"] || "unknown"))] = i;
            });
        }
        if (Array.isArray(fields)) {
          if (!schema.properties) {
            schema.properties = {};
          }
          model.forEach((i: any) => {
            const { name, source, ...rest } = i;
            if (fields.includes(name)) {
              const props = {
                name,
                ...rest,
                ...(extra[name]?.edit ?? {}),
                ...getComponent(i),
                "x-decorator": "FormItem"
              };
              props["x-component-props"] = { ...(props["x-component-props"] || {}), source };
              schema.properties[name] = props;
            }
          });
        }
        return schema;
      };

      if (setting) {
        const schema = recursion(setting.layout);
        console.log("schema", schema);
        return { ...setting, schema };
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
