import { uid } from "@formily/shared";
import { onBeforeUnmount } from "vue";
import type { Page } from "../../core/models";
import { usePage } from "./usePage";

export const usePageEffects = (effects?: (page: Page) => void): void => {
  const pageRef = usePage();

  const id = uid();
  pageRef.value.addEffects(id, effects);

  onBeforeUnmount(() => {
    pageRef.value.removeEffects(id);
  });
};
