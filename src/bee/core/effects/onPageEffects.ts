import { autorun, batch } from "@formily/reactive";
import { Page } from "../models";
import { LifeCycleTypes } from "../types";
import { createEffectHook } from "../shared/effective";

function createPageEffect(type: LifeCycleTypes) {
  return createEffectHook(type, (page: Page) => (callback: (page: Page) => void) => {
    batch(() => {
      callback(page);
    });
  });
}

export const onPageInit = createPageEffect(LifeCycleTypes.ON_FORM_INIT);
export const onPageMount = createPageEffect(LifeCycleTypes.ON_FORM_MOUNT);
export const onPageUnmount = createPageEffect(LifeCycleTypes.ON_FORM_UNMOUNT);
export const onPageValuesChange = createPageEffect(LifeCycleTypes.ON_FORM_VALUES_CHANGE);
export const onPageInitialValuesChange = createPageEffect(LifeCycleTypes.ON_FORM_INITIAL_VALUES_CHANGE);
export const onPageInputChange = createPageEffect(LifeCycleTypes.ON_FORM_INPUT_CHANGE);
export const onPageGraphChange = createPageEffect(LifeCycleTypes.ON_FORM_GRAPH_CHANGE);
export const onPageLoading = createPageEffect(LifeCycleTypes.ON_FORM_LOADING);
export function onPageReact(callback?: (page: Page) => void) {
  let dispose = null;
  onPageInit(page => {
    dispose = autorun(() => {
      callback(page);
    });
  });
  onPageUnmount(() => {
    dispose();
  });
}
