import { useDef } from "@/hooks/useDef";
import { paramsToKey } from "@/utils";
import { Field, Form, onFieldReact, onFieldValueChange } from "@formily/core";
import * as _ from "lodash-es";
import { expression } from "./expression";

interface ReactionBase {
  type: "react" | "affect";
  dependencies?: string[];
  target?: string[];
  name: string;
  api?: string;
  method?: "GET" | "POST";
  property: "enum" | "value" | "title" | "maxLength" | "minLength" | "required" | "x-visible" | "x-disabled" | "*";
  action?: string;
  value?: string;
}
export interface ReactReaction extends ReactionBase {
  type: "react";
  dependencies: string[];
}
export interface AffectReaction extends ReactionBase {
  type: "affect";
  target: string[];
}
export type Reaction = ReactReaction | AffectReaction;

export const run = (reactions: Reaction[] = []) => {
  reactions
    // 12矩阵中已经描述了枚举
    .filter(i => i.property !== "enum")
    .forEach(i => {
      if (i.type === "react") {
        onFieldReact(i.name, (field: Field | any, form) => {
          if (i.action) {
            if (i.action.indexOf("expression#") === 0) {
              expression(i, { field, form });
            }
            return;
          }

          const params: any[] = i.dependencies.map(item => ({ key: item, value: field.query(item).get("value") }));
          // TODO 字段空数组未处理
          const isEmpty = _.some(params, i => [undefined, null].includes(i.value));
          if (isEmpty) {
            field.reset();
          } else {
            if (i.api) {
              useDef(
                data => {
                  if (i.property === "value") {
                    field.setValue(data);
                  } else {
                    // TODO 这里可以做太多事了
                  }
                },
                {
                  uniqueKey: `${i.api}$${paramsToKey(params)}`,
                  source: {
                    type: "def",
                    value: i.api
                  }
                },
                params.reduce((pre, cur) => {
                  pre[cur.key] = cur.value;
                  return pre;
                }, {})
              );
            }
          }
        });
      } else if (i.type === "affect") {
        onFieldValueChange(i.name, (field: Field, form: Form) => {
          if (i.action) {
            if (i.action.indexOf("expression#") === 0) {
              expression(i, { field, form });
            }
            return;
          }
        });
      }
    });
};
