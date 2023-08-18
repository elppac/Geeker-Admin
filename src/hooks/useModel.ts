import { useAppStore } from "@/stores/modules/app";
import { computed } from "vue";
import { useRoute } from "vue-router";
import * as _ from "lodash-es";
import { ISchema } from "@formily/json-schema";
import { type Reaction } from "@/reaction";

/**
 * 列表场景
 * @param page
 * @returns
 */
const getListSetting = (page: any) => {
  return _.get(page, `[x-scenes].list`);
};
/**
 * 列表场景
 * @param page
 * @returns
 */
const getSearchbarSetting = (page: any) => {
  return _.get(page, `[x-scenes].search`);
};
const getFormSetting = (page: any) => {
  return _.get(page, `[x-scenes].edit`);
};
/**
 * 元模型
 * @param page
 * @returns
 */
const getModel = (page: any) => {
  return _.get(page, `[x-model]`);
};
/**
 * 字段的场景扩展
 * @param page
 * @returns
 */
const getFieldExtra = (page: any) => {
  return _.get(page, `[x-field-extra]`);
};

const scenesListConfig = (page: any) => {
  const setting = getListSetting(page);
  const model = getModel(page);
  if (setting) {
    const extra = getFieldExtra(page);
    const items = _.filter(model, i => setting.fields.includes(i.name)).map(i => {
      if (extra && extra[i.name] && extra[i.name].list) {
        return { ...i, ...extra[i.name].list };
      }
      return i;
    });

    return { ...setting, items };
  }
  return null;
};
const scenesSearchbarConfig = (page: any) => {
  const setting = getSearchbarSetting(page);
  const model = getModel(page);
  if (setting) {
    const extra = getFieldExtra(page);
    const items = _.filter(model, i => setting.fields.includes(i.name)).map(i => {
      if (extra && extra[i.name] && extra[i.name].search) {
        return { ...i, ...extra[i.name].search };
      }
      return i;
    });

    return { ...setting, items };
  }
  return null;
};
const getComponent = (schema: any) => {
  let formSchema: any = { "x-component": "Input" };
  switch (schema.type) {
    case "number":
    case "integer":
      formSchema["x-component"] = "InputNumber";
      break;
    case "date":
      formSchema["x-component"] = "DatePicker";
      // formSchema["x-component-props"] = {
      //   type: "datetime"
      // };
      break;
    default:
  }
  if (schema.bizType === "enum") {
    switch (schema.source.type) {
      case "static":
      case "model":
        formSchema["x-component"] = "Select";
        formSchema["x-reactions"] = ["{{useAsyncDataSource()}}"];
        break;
      default:
    }
  } else if (schema.bizType === "image") {
    formSchema["x-component"] = "Upload";
  } else if (schema.bizType === "model") {
    formSchema["x-component"] = "InputTableAsync";
    formSchema["x-decorator-props"] = { gridSpan: "span 4", layout: "vertical", labelAlign: "left" };
    formSchema["type"] = "void";
    formSchema["name"] = `${schema.name}Async`;
    formSchema["x-component-props"] = { name: schema.name };
  }
  return formSchema;
};

const scenesFormConfig = (page: any) => {
  const setting = getFormSetting(page);
  const model = getModel(page);
  const extra = getFieldExtra(page);

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
          schema.properties[props.name] = props;
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
};

const abilityInputTable = (page: any) => {
  const fields = _.get(page, "[x-ability].inputTable.fields", getListSetting(page).fields);
  const model = getModel(page);
  const schema: any = {
    type: "array",
    "x-component": "InputTable",
    "x-component-props": { pagination: { pageSize: 20 } }
  };

  const getColumn = (
    field: any,
    customComponent: any,
    options?: {
      name?: string;
      width?: number;
      align?: "left" | "center" | "right";
      fixed?: "right" | "left";
      title?: string;
      type?: string;
    }
  ) => {
    const { name, source, ...rest } = field;
    return {
      type: "void",
      "x-component": "InputTable.Column",
      "x-component-props": { title: field.title, ...(options || {}) },
      properties: {
        [name || customComponent.name]: {
          ...rest,
          title: undefined,
          "x-decorator": "FormItem",
          ...getComponent(field),
          ...customComponent,
          "x-component-props": { source }
        }
      }
    };
  };
  const columns: any = {};
  columns.idx = getColumn(
    {},
    { name: "$idx", "x-component": "InputTable.Index", "x-decorator": undefined },
    { title: "Index", align: "center", width: 80 }
  );
  // columns.selection = getColumn(
  //   {},
  //   { name: "$selection", "x-component": "InputTable.Selection", "x-decorator": undefined },
  //   { title: "Selection", align: "center", width: 80, type: "selection" }
  // );
  model
    .filter((i: any) => fields.includes(i.name))
    .forEach((i: any) => {
      columns[i.name] = getColumn(i, {});
    });
  columns.operations = getColumn(
    {},
    {
      name: "item",
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
      },
      type: "void",
      "x-component": "FormItem",
      "x-decorator": undefined
    },
    { title: "Operations", fixed: "right", width: 180 }
  );

  schema.items = {
    type: "object",
    properties: columns
  };
  schema.properties = {
    add: {
      type: "void",
      "x-component": "InputTable.Addition",
      title: "添加条目"
    }
    // removeAll: {
    //   type: "void",
    //   "x-component": "InputTable.RemoveAll",
    //   title: "选中删除"
    // }
  };
  console.log("abilityInputTable schema", JSON.stringify(schema));
  return schema;
};

/**
 * 返回页面路由
 * @param name 页面名称
 * @returns
 */
export const useModel = (name?: string) => {
  const pageStore = useAppStore();
  const pageName = name || (useRoute().name as string);
  const page = computed<{
    pageSchema?: ISchema;
    scenes?: {
      form: () => any;
      list: () => any;
      searchbar: () => any;
    };
    ability?: {
      inputTable: () => any;
    };
    reactions?: Reaction[];
  }>(() => {
    const pageData = pageStore.pageData[pageName];
    if (!pageData) {
      return {};
    }
    return {
      pageSchema: pageData["x-schema"],
      scenes: {
        form: () => scenesFormConfig(pageData),
        list: () => scenesListConfig(pageData),
        searchbar: () => scenesSearchbarConfig(pageData)
      },
      ability: {
        inputTable: () => abilityInputTable(pageData)
      },
      reactions: pageData["x-reactions"]
    };
  });
  pageStore.getPage(pageName);
  return {
    page
  };
};
