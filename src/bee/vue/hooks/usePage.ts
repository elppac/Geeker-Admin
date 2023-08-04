import { inject, type Ref, ref } from "vue";
import { PageSymbol } from "../shared/context";
import { Page } from "../../core/models";

export const usePage = (): Ref<Page> => {
  const page = inject(PageSymbol, ref());
  return page;
};
