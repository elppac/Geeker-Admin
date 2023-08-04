import { isEmpty, toArr, type FormPathPattern } from "@formily/shared";

import { define, observable, batch, toJS, action } from "@formily/reactive";
import {
  type JSXComponent,
  LifeCycleTypes,
  type IFieldFeedback,
  type FeedbackMessage,
  type IFieldCaches,
  type IFieldRequests,
  type FieldDataSource,
  type ISearchFeedback,
  type IFieldProps,
  type IFieldState,
  type IModelSetter,
  type IModelGetter,
  type IPageFeedback
} from "../types";
import {
  updateFeedback,
  queryFeedbacks,
  allowAssignDefaultValue,
  queryFeedbackMessages,
  getValuesFromEvent,
  createReactions,
  createStateSetter,
  createStateGetter,
  isHTMLInputEvent,
  setLoading,
  modifySelf,
  getValidFieldDefaultValue,
  initializeStart,
  initializeEnd,
  createChildrenFeedbackFilter,
  createReaction
} from "../shared/internals";
import { Page } from "./Page";
import { BaseField } from "./BaseField";
export class Field<
  Decorator extends JSXComponent = any,
  Component extends JSXComponent = any,
  TextType = any,
  ValueType = any
> extends BaseField<Decorator, Component, TextType> {
  displayName = "Field";
  props: IFieldProps<Decorator, Component, TextType, ValueType>;
  loading!: boolean;
  active!: boolean;
  visited!: boolean;
  selfModified!: boolean;
  modified!: boolean;
  inputValue!: ValueType;
  inputValues!: any[];
  dataSource!: FieldDataSource;
  feedbacks!: IFieldFeedback[];
  caches: IFieldCaches = {};
  requests: IFieldRequests = {};

  constructor(
    address: FormPathPattern,
    props: IFieldProps<Decorator, Component, TextType, ValueType>,
    page: Page,
    designable: boolean
  ) {
    super();
    this.page = page;
    this.props = props;
    this.designable = designable;
    initializeStart();
    this.locate(address);
    this.initialize();
    this.makeObservable();
    this.makeReactive();
    this.onInit();
    initializeEnd();
  }

  protected initialize() {
    this.initialized = false;
    this.loading = false;
    this.selfModified = false;
    this.active = false;
    this.visited = false;
    this.mounted = false;
    this.unmounted = false;
    this.inputValues = [];
    this.inputValue = null;
    this.feedbacks = [];
    this.title = this.props.title;
    this.description = this.props.description;
    this.display = this.props.display;
    this.pattern = this.props.pattern;
    this.editable = this.props.editable;
    this.disabled = this.props.disabled;
    this.readOnly = this.props.readOnly;
    this.readPretty = this.props.readPretty;
    this.visible = this.props.visible;
    this.hidden = this.props.hidden;
    this.dataSource = this.props.dataSource;
    this.content = this.props.content;
    this.initialValue = this.props.initialValue;
    this.value = this.props.value;
    this.data = this.props.data;
    this.decorator = toArr(this.props.decorator);
    this.component = toArr(this.props.component);
  }

  protected makeObservable() {
    if (this.designable) return;
    define(this, {
      path: observable.ref,
      title: observable.ref,
      description: observable.ref,
      dataSource: observable.ref,
      selfDisplay: observable.ref,
      selfPattern: observable.ref,
      loading: observable.ref,
      selfModified: observable.ref,
      modified: observable.ref,
      active: observable.ref,
      visited: observable.ref,
      initialized: observable.ref,
      mounted: observable.ref,
      unmounted: observable.ref,
      inputValue: observable.ref,
      inputValues: observable.ref,
      decoratorType: observable.ref,
      componentType: observable.ref,
      content: observable.ref,
      feedbacks: observable.ref,
      decoratorProps: observable,
      componentProps: observable,
      data: observable.shallow,
      component: observable.computed,
      decorator: observable.computed,
      errors: observable.computed,
      warnings: observable.computed,
      successes: observable.computed,
      selfErrors: observable.computed,
      selfWarnings: observable.computed,
      selfSuccesses: observable.computed,
      validateStatus: observable.computed,
      value: observable.computed,
      initialValue: observable.computed,
      display: observable.computed,
      pattern: observable.computed,
      hidden: observable.computed,
      visible: observable.computed,
      disabled: observable.computed,
      readOnly: observable.computed,
      readPretty: observable.computed,
      editable: observable.computed,
      indexes: observable.computed,
      setDisplay: action,
      setTitle: action,
      setDescription: action,
      setDataSource: action,
      setValue: action,
      setPattern: action,
      setInitialValue: action,
      setLoading: action,
      setFeedback: action,
      setComponent: action,
      setComponentProps: action,
      setDecorator: action,
      setDecoratorProps: action,
      setData: action,
      setContent: action,
      onInit: batch,
      onInput: batch,
      onMount: batch,
      onUnmount: batch,
      onFocus: batch,
      onBlur: batch
    });
  }

  protected makeReactive() {
    if (this.designable) return;
    this.disposers.push(
      createReaction(
        () => this.initialValue,
        () => {
          this.notify(LifeCycleTypes.ON_FIELD_INITIAL_VALUE_CHANGE);
        }
      ),
      createReaction(
        () => this.display,
        display => {
          const value = this.value;
          if (display === "visible") {
            if (isEmpty(value)) {
              this.setValue(this.caches.value);
              this.caches.value = undefined;
            }
          } else {
            this.caches.value = toJS(value) ?? toJS(this.initialValue);
            if (display === "none") {
              this.page.deleteValuesIn(this.path);
            }
          }
          if (display === "none" || display === "hidden") {
            this.setFeedback({
              type: "error",
              messages: []
            });
          }
        }
      ),
      createReaction(
        () => this.pattern,
        pattern => {
          if (pattern !== "editable") {
            this.setFeedback({
              type: "error",
              messages: []
            });
          }
        }
      )
    );
    createReactions(this);
  }

  get selfErrors(): FeedbackMessage {
    return queryFeedbackMessages(this, {
      type: "error"
    });
  }

  get errors(): IPageFeedback[] {
    return this.page.errors.filter(createChildrenFeedbackFilter(this));
  }

  get selfWarnings(): FeedbackMessage {
    return queryFeedbackMessages(this, {
      type: "warning"
    });
  }

  get warnings(): IPageFeedback[] {
    return this.page.warnings.filter(createChildrenFeedbackFilter(this));
  }

  get selfSuccesses(): FeedbackMessage {
    return queryFeedbackMessages(this, {
      type: "success"
    });
  }

  get successes(): IPageFeedback[] {
    return this.page.successes.filter(createChildrenFeedbackFilter(this));
  }
  get value(): ValueType {
    return this.page.getValuesIn(this.path);
  }

  get initialValue(): ValueType {
    return this.page.getInitialValuesIn(this.path);
  }

  get validateStatus() {
    if (this.selfWarnings.length) return "warning";
    if (this.selfSuccesses.length) return "success";
  }

  set value(value: ValueType) {
    this.setValue(value);
  }

  set initialValue(initialValue: ValueType) {
    this.setInitialValue(initialValue);
  }

  set selfErrors(messages: FeedbackMessage) {
    this.setFeedback({
      type: "error",
      code: "EffectError",
      messages
    });
  }

  set selfWarnings(messages: FeedbackMessage) {
    this.setFeedback({
      type: "warning",
      code: "EffectWarning",
      messages
    });
  }

  set selfSuccesses(messages: FeedbackMessage) {
    this.setFeedback({
      type: "success",
      code: "EffectSuccess",
      messages
    });
  }

  setDataSource = (dataSource?: FieldDataSource) => {
    this.dataSource = dataSource;
  };

  setFeedback = (feedback?: IFieldFeedback) => {
    updateFeedback(this, feedback);
  };

  setValue = (value?: ValueType) => {
    if (this.destroyed) return;
    if (!this.initialized) {
      if (this.display === "none") {
        this.caches.value = value;
        return;
      }
      value = getValidFieldDefaultValue(value, this.initialValue);
      if (!allowAssignDefaultValue(this.value, value) && !this.designable) {
        return;
      }
    }
    this.page.setValuesIn(this.path, value);
  };

  setInitialValue = (initialValue?: ValueType) => {
    if (this.destroyed) return;
    if (!this.initialized) {
      if (!allowAssignDefaultValue(this.initialValue, initialValue) && !this.designable) {
        return;
      }
    }
    this.page.setInitialValuesIn(this.path, initialValue);
  };

  setLoading = (loading?: boolean) => {
    setLoading(this, loading);
  };
  setState: IModelSetter<IFieldState> = createStateSetter(this);

  getState: IModelGetter<IFieldState> = createStateGetter(this);

  onInput = async (...args: any[]) => {
    const getValues = (args: any[]) => {
      if (args[0]?.target) {
        if (!isHTMLInputEvent(args[0])) return args;
      }
      return getValuesFromEvent(args);
    };
    const values = getValues(args);
    const value = values[0];
    this.caches.inputting = true;
    this.inputValue = value;
    this.inputValues = values;
    this.value = value;
    this.modify();
    this.notify(LifeCycleTypes.ON_FIELD_INPUT_VALUE_CHANGE);
    this.notify(LifeCycleTypes.ON_FORM_INPUT_CHANGE, this.page);
    // await validateSelf(this, 'onInput')
    this.caches.inputting = false;
  };

  onFocus = async (...args: any[]) => {
    if (args[0]?.target) {
      if (!isHTMLInputEvent(args[0], false)) return;
    }
    this.active = true;
    this.visited = true;
    // await validateSelf(this, 'onFocus')
  };

  onBlur = async (...args: any[]) => {
    if (args[0]?.target) {
      if (!isHTMLInputEvent(args[0], false)) return;
    }
    this.active = false;
    // await validateSelf(this, 'onBlur')
  };

  queryFeedbacks = (search?: ISearchFeedback): IFieldFeedback[] => {
    return queryFeedbacks(this, search);
  };

  modify = () => modifySelf(this);
}
