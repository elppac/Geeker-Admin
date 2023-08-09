/* eslint-disable vue/one-component-per-file */
import { computed, defineComponent, ref, Ref, h } from "vue";
import { GeneralField, IVoidFieldFactoryProps, FieldDisplayTypes, ArrayField } from "@formily/core";
import { useField, RecursionField as _RecursionField, FragmentComponent, useFieldSchema } from "@formily/vue";
import { observer } from "@formily/reactive-vue";
import { clone, isArr, isBool, isValid } from "@formily/shared";
import { Schema } from "@formily/json-schema";

import type { VNode, Component } from "vue";
import { ElTable, ElTableColumn, ElPagination, ElSelect, ElOption, ElBadge, ElButton, ElTooltip } from "element-plus";

import { Space } from "@formily/element-plus";
import { ArrayBase } from "@formily/element-plus/esm/array-base/index";
import { stylePrefix } from "./constants";
import { CirclePlus } from "@element-plus/icons-vue";

type ElTableProps = typeof ElTable;
type ElColumnProps = typeof ElTableColumn;
type ElPaginationProps = typeof ElPagination;

const RecursionField = _RecursionField as unknown as Component;

type ArrayTableProps = ElTableProps & {
  pagination?: ElPaginationProps | boolean;
};

interface ObservableColumnSource {
  field: GeneralField;
  fieldProps: IVoidFieldFactoryProps<any, any>;
  columnProps: ElColumnProps & { title: string; asterisk: boolean };
  schema: Schema;
  display: FieldDisplayTypes;
  required: boolean;
  name: string;
}

type ColumnProps = ElColumnProps & {
  key: string | number;
  asterisk: boolean;
  render?: (startIndex?: Ref<number>) => (props: { row: Record<string, any>; column: ElColumnProps; $index: number }) => VNode;
};

const isColumnComponent = (schema: Schema) => {
  return schema["x-component"]?.indexOf("Column") > -1;
};

const isOperationsComponent = (schema: Schema) => {
  return schema["x-component"]?.indexOf("Operations") > -1;
};

const isAdditionComponent = (schema: Schema) => {
  return schema["x-component"]?.indexOf("Addition") > -1;
};

const getArrayTableSources = (arrayFieldRef: Ref<ArrayField>, schemaRef: Ref<Schema>) => {
  const arrayField = arrayFieldRef.value;
  const parseSources = (schema: Schema): ObservableColumnSource[] => {
    if (isColumnComponent(schema) || isOperationsComponent(schema) || isAdditionComponent(schema)) {
      if (!schema["x-component-props"]?.["prop"] && !schema["name"]) return [];
      const name = schema["x-component-props"]?.["prop"] || schema["name"];
      const field = arrayField.query(arrayField.address.concat(name)).take();
      const fieldProps = field?.props || schema.toFieldProps();
      const columnProps = (field?.component as any[])?.[1] || schema["x-component-props"] || {};
      const display = field?.display || schema["x-display"];
      const required = schema.reduceProperties((required, property) => {
        if (required) {
          return required;
        }
        return !!property.required;
      }, false);

      return [
        {
          name,
          display,
          required,
          field,
          fieldProps,
          schema,
          columnProps
        }
      ];
    } else if (schema.properties) {
      return schema.reduceProperties((buf: any[], schema) => {
        return buf.concat(parseSources(schema));
      }, []);
    } else {
      return [];
    }
  };

  const parseArrayTable = (schema: Schema["items"]) => {
    if (!schema) return [];
    const sources: ObservableColumnSource[] = [];
    const items = isArr(schema) ? schema : ([schema] as Schema[]);
    return items.reduce((columns, schema) => {
      const item = parseSources(schema);
      if (item) {
        return columns.concat(item);
      }
      return columns;
    }, sources);
  };

  if (!schemaRef.value) throw new Error("can not found schema object");

  return parseArrayTable(schemaRef.value.items);
};

const getArrayTableColumns = (sources: ObservableColumnSource[]): ColumnProps[] => {
  return sources.reduce((buf: ColumnProps[], { name, columnProps, schema, display, required }, key) => {
    const { title, asterisk, ...props } = columnProps;
    if (display !== "visible") return buf;
    if (!isColumnComponent(schema)) return buf;

    const render = (startIndex?: Ref<number>) => {
      return columnProps?.type && columnProps?.type !== "default"
        ? undefined
        : (props: { row: Record<string, any>; column: ElColumnProps; $index: number }): VNode => {
            const index = (startIndex?.value ?? 0) + props.$index;
            // const index = reactiveDataSource.value.indexOf(props.row)
            const children = h(
              ArrayBase.Item,
              { index, record: props.row, key: `${key}${index}` },
              {
                default: () => {
                  return h(
                    RecursionField as any,
                    {
                      schema,
                      name: index,
                      onlyRenderProperties: true
                    },
                    {}
                  );
                }
              }
            );
            return children;
          };
    };

    return (buf as any).concat({
      label: title,
      ...props,
      key,
      prop: name,
      asterisk: asterisk ?? required,
      render
    });
  }, []);
};

const renderAddition = () => {
  const schemaRef = useFieldSchema();
  return schemaRef.value.reduceProperties((addition, schema) => {
    if (isAdditionComponent(schema)) {
      return h(
        RecursionField as any,
        {
          schema,
          name: "addition"
        },
        {}
      );
    }
    return addition;
  }, null);
};

const schedulerRequest: { request: number } = {
  request: 0
};

const StatusSelect = observer(
  defineComponent({
    props: {
      value: Number,
      onChange: Function,
      options: Array,
      pageSize: Number
    },
    setup(props) {
      const fieldRef = useField<ArrayField>();
      const prefixCls = `${stylePrefix}-array-table`;

      return () => {
        const field = fieldRef.value;
        const width = String(props.options?.length).length * 15;
        const errors = field.errors;
        const parseIndex = (address: string) => {
          return Number(address.slice(address.indexOf(field.address.toString()) + 1).match(/(\d+)/)?.[1]);
        };

        return h(
          ElSelect as any,
          {
            style: {
              width: `${width < 60 ? 60 : width}px`
            },
            class: [
              `${prefixCls}-status-select`,
              {
                "has-error": errors?.length
              }
            ],
            modelValue: props.value,
            popperClass: `${prefixCls}-status-select-dropdown`,
            onChange: props.onChange
          },
          {
            default: () => {
              return (props.options as { label: string; value: number }[])?.map(({ label, value }) => {
                const hasError = errors.some(({ address }) => {
                  const currentIndex = parseIndex(address);
                  const startIndex = (value - 1) * props.pageSize;
                  const endIndex = value * props.pageSize;
                  return currentIndex >= startIndex && currentIndex <= endIndex;
                });

                return h(
                  ElOption as any,
                  {
                    key: value,
                    label,
                    value
                  },
                  {
                    default: () => {
                      if (hasError) {
                        return h(
                          ElBadge,
                          {
                            isDot: true
                          },
                          { default: () => label }
                        );
                      }

                      return label;
                    }
                  }
                );
              });
            }
          }
        );
      };
    }
  }),
  {
    scheduler: update => {
      clearTimeout(schedulerRequest.request as unknown as number);
      schedulerRequest.request = setTimeout(() => {
        update();
      }, 100) as unknown as number;
    }
  }
);

const ArrayTablePagination = defineComponent({
  inheritAttrs: false,
  props: ["pageSize", "dataSource", "onChange"],
  setup(props, { attrs, slots }) {
    const prefixCls = `${stylePrefix}-array-table`;
    const current = ref(1);
    const pageSize = computed(() => props.pageSize || 10);
    const dataSource = computed(() => props.dataSource || []);
    const startIndex = computed(() => (current.value - 1) * pageSize.value);
    const endIndex = computed(() => startIndex.value + pageSize.value - 1);
    const total = computed(() => dataSource.value?.length || 0);
    const totalPage = computed(() => Math.ceil(total.value / pageSize.value));
    const pages = computed(() => {
      return Array.from(new Array(totalPage.value)).map((_, index) => {
        const page = index + 1;
        return {
          label: page,
          value: page
        };
      });
    });

    const renderPagination = function () {
      if (totalPage.value <= 1) return;
      return h(
        "div",
        {
          class: [`${prefixCls}-pagination`]
        },
        h(
          Space,
          {},
          {
            default: () => [
              h(
                StatusSelect,
                {
                  value: current.value,
                  onChange: (val: number) => {
                    current.value = val;
                  },
                  pageSize: pageSize.value,
                  options: pages.value
                },
                {}
              ),
              h(
                ElPagination,
                {
                  background: true,
                  layout: "prev, pager, next",
                  ...attrs,
                  pageSize: pageSize.value,
                  pageCount: totalPage.value,
                  currentPage: current.value,
                  onCurrentChange: (val: number) => {
                    current.value = val;
                  }
                },
                {}
              )
            ]
          }
        )
      );
    };

    return () => {
      return h(
        FragmentComponent,
        {},
        {
          default: () =>
            slots?.default?.(dataSource.value?.slice(startIndex.value, endIndex.value + 1), renderPagination, startIndex)
        }
      );
    };
  }
});

const ArrayTableInner = observer(
  defineComponent({
    name: "GramFormInputTable",
    inheritAttrs: false,
    props: ["onChange"],
    setup(props, { attrs, slots }) {
      console.log("ipnut table rendered");
      const fieldRef = useField<ArrayField>();
      const schemaRef = useFieldSchema();
      const prefixCls = `${stylePrefix}-array-table`;
      const defaultRowKey = (record: any, index: number) => {
        return getKey(record, index);
      };

      // const { page } = useModel(attrs?.source?.value);
      // const schemaRef = computed(() => new Schema(page.value.ability?.inputTable()));
      const { getKey, keyMap } = ArrayBase.useKey(schemaRef.value);

      return () => {
        const props = attrs as unknown as ArrayTableProps;
        const field = fieldRef.value;
        const dataSource = Array.isArray(field.value) ? field.value.slice() : [];
        const pagination = props.pagination;
        const sources = getArrayTableSources(fieldRef, schemaRef);
        const columns = getArrayTableColumns(sources);

        // if (!(page && page.value.pageSchema)) {
        //   return h("div", {}, { default: () => "loading..." });
        // }

        const renderColumns = (startIndex?: Ref<number>) => {
          return columns.map(({ key, render, asterisk, ...props }) => {
            const children = {} as Record<string, any>;
            if (render) {
              children.default = render(startIndex);
            }
            if (asterisk) {
              children.header = ({ column }: { column: ElColumnProps }) =>
                h("span", {}, [
                  h(
                    "span",
                    { class: `${prefixCls}-asterisk` },
                    "*"
                    // { default: () => ['*'] }
                  ),
                  column.label
                ]);
            }
            return h(
              ElTableColumn as any,
              {
                ...props,
                key
              },
              children
            );
          });
        };

        const renderStateManager = () =>
          sources.map((column, key) => {
            //专门用来承接对Column的状态管理
            if (!isColumnComponent(column.schema)) return;
            return h(
              RecursionField as any,
              {
                name: column.name,
                schema: column.schema,
                onlyRenderSelf: true,
                key
              },
              {}
            );
          });

        const renderTable = (dataSource?: any[], pager?: () => VNode, startIndex?: Ref<number>) => {
          return h(
            "div",
            { class: prefixCls },
            h(
              ArrayBase,
              {
                keyMap
              },
              {
                default: () => [
                  h(
                    ElTable as any,
                    {
                      rowKey: defaultRowKey,
                      ...attrs,
                      data: dataSource
                    },
                    {
                      ...slots,
                      default: () => renderColumns(startIndex)
                    }
                  ),
                  pager?.(),
                  renderStateManager(),
                  renderAddition()
                ]
              }
            )
          );
        };

        if (!pagination) {
          return renderTable(dataSource);
        }
        return h(
          ArrayTablePagination,
          {
            ...(isBool(pagination) ? {} : pagination),
            dataSource
          },
          { default: renderTable }
        );
      };
    }
  })
);
const getDefaultValue = (defaultValue: any, schema: Schema): any => {
  if (isValid(defaultValue)) return clone(defaultValue);
  if (Array.isArray(schema?.items)) return getDefaultValue(defaultValue, schema.items[0]);
  if (schema?.items?.type === "array") return [];
  if (schema?.items?.type === "boolean") return true;
  if (schema?.items?.type === "date") return "";
  if (schema?.items?.type === "datetime") return "";
  if (schema?.items?.type === "number") return 0;
  if (schema?.items?.type === "object") return {};
  if (schema?.items?.type === "string") return "";
  return null;
};

const ArrayTableAddition = defineComponent({
  name: "ArrayBaseAddition",
  props: ["method", "defaultValue", "title"],
  setup(props, { attrs }) {
    const self = useField();
    const array = ArrayBase.useArray();
    return () => {
      if (!array) return null;
      if (array?.field.value.pattern !== "editable") return null;
      return h(
        ElTooltip,
        { content: self.value.title || props.title },
        {
          default: () =>
            h(
              ElButton,
              {
                ...attrs,
                ...props,
                type: "primary",
                circle: true,
                class: `header-addition`,
                icon: CirclePlus,
                onClick: e => {
                  if (array.props?.disabled) return;
                  const defaultValue = getDefaultValue(props.defaultValue, array?.schema.value);
                  if (props.method === "unshift") {
                    array?.field?.value.unshift(defaultValue);
                    array.attrs?.add?.(0);
                  } else {
                    array?.field?.value.push(defaultValue);
                    array.attrs?.add?.(array?.field?.value?.value?.length - 1);
                  }
                  if (typeof attrs.onClick === "function") {
                    attrs.onClick(e);
                  }
                }
              },
              {
                default: () => [self.value.title || props.title]
              }
            )
        }
      );
    };
  }
});

const ArrayTableColumn: Component = {
  name: "GramFormInputTableColumn",
  render() {
    return null;
  }
};

export const GramFormInputTable = Object.assign(ArrayTableInner, {
  Column: ArrayTableColumn,
  Index: ArrayBase.Index,
  SortHandle: ArrayBase.SortHandle,
  Addition: ArrayTableAddition,
  Remove: ArrayBase.Remove,
  MoveDown: ArrayBase.MoveDown,
  MoveUp: ArrayBase.MoveUp,
  useArray: ArrayBase.useArray,
  useIndex: ArrayBase.useIndex,
  useRecord: ArrayBase.useRecord
});

export default GramFormInputTable;
