import { type InjectionKey, provide, type Ref, ref } from "vue";

export const useInjectionCleaner = (injectionKeys: InjectionKey<Ref<unknown>>[]) => {
  injectionKeys.forEach(key => provide(key, ref()));
};
