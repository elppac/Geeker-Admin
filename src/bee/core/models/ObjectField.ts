import { reaction } from "@formily/reactive";
import { cleanupObjectChildren } from "../shared/internals";
import { type JSXComponent, type IFieldProps, type FormPathPattern } from "../types";
import { Field } from "./Field";
import { Page } from "./Page";

export class ObjectField<Decorator extends JSXComponent = any, Component extends JSXComponent = any> extends Field<
  Decorator,
  Component,
  any,
  Record<string, any>
> {
  displayName = "ObjectField";
  private additionalProperties: string[] = [];
  constructor(address: FormPathPattern, props: IFieldProps<Decorator, Component>, page: Page, designable: boolean) {
    super(address, props, page, designable);
    this.makeAutoCleanable();
  }

  protected makeAutoCleanable() {
    this.disposers.push(
      reaction(
        () => Object.keys(this.value || {}),
        newKeys => {
          const filterKeys = this.additionalProperties.filter(key => !newKeys.includes(key));
          cleanupObjectChildren(this, filterKeys);
        }
      )
    );
  }

  addProperty = (key: string, value: any) => {
    this.page.setValuesIn(this.path.concat(key), value);
    this.additionalProperties.push(key);
    return this.onInput(this.value);
  };

  removeProperty = (key: string) => {
    this.page.deleteValuesIn(this.path.concat(key));
    this.additionalProperties.splice(this.additionalProperties.indexOf(key), 1);
    return this.onInput(this.value);
  };

  existProperty = (key: string) => {
    return this.page.existValuesIn(this.path.concat(key));
  };
}
