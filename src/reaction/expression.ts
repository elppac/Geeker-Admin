import { Field, Form } from "@formily/core";
import { type Reaction } from ".";
import * as _ from "lodash-es";

const getFieldStateByExpression: any = (pathOrValue: string, form: Form) => {
  if (pathOrValue.indexOf("$") === 0) {
    return _.get(form, pathOrValue.substring(1));
  }
  return pathOrValue;
};

export const expression = (item: Reaction, { field, form }: { field: Field; form: Form }) => {
  if (!item.action) {
    return;
  }
  // 表达式类型和更多参数
  const [expressionType, ...rest] = item.action.split("#")[1].split("|");
  const expressionGroupType = expressionType.substring(0, 1);
  const formValues = form.values;
  const fieldValue = field.value;
  if (expressionGroupType === "C") {
    // 简单表达式
    // C0 为 affect
    if (expressionType === "C0" && item.type === "affect") {
      // A变更,BCD...变为A
      // A变更,BCD...变为X或X字段的值
      const v = item.value ? getFieldStateByExpression(item.value, form) : fieldValue;
      form.setValues(item.target.reduce((pre, cur) => ({ [cur]: v }), {}));
    }
    // C1 为 react
    if (expressionType === "C1" && item.type === "react" && item.value) {
      // AB...值相同,E变为X或X字段的值
      const value = String(formValues[item.dependencies[0]]);
      if (value && item.dependencies.every(name => String(formValues[name]) === value)) {
        field.setValue(getFieldStateByExpression(item.value, form));
      }
    }
    if (expressionType === "C2" && item.type === "react") {
      // E的值为其他字段通过X表达式计算得出,结果保留D位小数
      const params = item.dependencies.map(name => {
        let value = Number(fieldValue[name]);
        return isFinite(value) ? value : 0;
      });
      const type = rest[0];
      const decimal: any = rest[1];
      let result = 0;
      switch (type) {
        case "sum":
          result = params.reduce((x, y) => x + y);
          break;
        case "sub":
          result = params.reduce((x, y) => x - y);
          break;
        case "multi":
          result = params.reduce((x, y) => x * y);
          break;
        case "div":
          result = params.reduce((x, y) => x / y);
          break;
        default:
          break;
      }
      field.setValue((isFinite(result) ? result : 0).toFixed(decimal));
    }
    if (expressionType === "C3" && item.type === "react") {
      // result = X / (1 + Y)
      const result = (_.toFinite(item.dependencies[0]) / (1 + _.toFinite(item.dependencies[1]))).toFixed(_.toInteger(rest[0]));
      field.setValue(result);
    }
    if (expressionType === "C4" && item.type === "react") {
      // result = X * Y - Z
      const result = (
        _.toFinite(item.dependencies[0]) * _.toFinite(item.dependencies[1]) -
        _.toFinite(item.dependencies[2])
      ).toFixed(_.toInteger(rest[0]));
      field.setValue(result);
    }
    // item.passiveFields.forEach(name => {
    //   this.itemValueChange(name, data, rowIndex);
    // });
  }
  // if (expressionGroupType === "R") {
  //   // 复杂表达式
  //   if (expressionType === "R0") {
  //     // A1:A2,B1:B2...如果X1值相同,X2值也要相同
  //     const kv = {};
  //     let active;
  //     const group = item.rule.split(",").map(i => {
  //       const arr = i.split(":");
  //       kv[arr[0]] = String(data[arr[0]]);
  //       kv[arr[1]] = String(data[arr[1]]);
  //       if (activeName === arr[0]) {
  //         active = [activeName, arr[1]];
  //       }
  //       if (activeName === arr[1]) {
  //         active = [arr[0], activeName];
  //       }
  //       return arr;
  //     });
  //     if (!kv.hasOwnProperty(activeName)) return;
  //     for (let i = 0; i < group.length; i++) {
  //       const key1 = group[i][0];
  //       const key2 = group[i][1];
  //       // 其它X1值相同项
  //       if (active[0] !== key1 && kv[active[0]] === kv[key1]) {
  //         if (active[0] === activeName) {
  //           // X1引起变化,X2值变为其它X1值相同项对应的X2值
  //           data[active[1]] = kv[key2];
  //           break;
  //         }
  //         if (active[1] === activeName) {
  //           // X2引起变化,其它X1值相同项对应的X2值改变
  //           data[key2] = kv[active[1]];
  //         }
  //       }
  //     }
  //   }
  //   // if (expressionType === "R1") {
  //   //   // 可编辑列表,A,B...如果空值,整行数据清空
  //   //   if (data !== this.table.data) return;
  //   //   if (item.rule.split(",").some(i => {
  //   //     return _.isNil(data[i]) || String(i) === "";
  //   //   })) {
  //   //     this.$set(this.table.data, rowIndex, JSON.parse(JSON.stringify(this.default_form)));
  //   //   }
  //   // }
  // }
};
