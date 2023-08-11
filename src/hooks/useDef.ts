import * as _ from "lodash-es";
import { usePageStore } from "@/stores/modules/page";
import { computed, watch } from "vue";

export const useDef = (
  callback: (data: any[]) => void,
  params: {
    uniqueKey: string;
    source: {
      type: string;
      value: any;
    };
  },
  dependencies?: any
) => {
  const pageStore = usePageStore();
  const data = computed(() => {
    return _.get(pageStore.store, `${params.uniqueKey}.data`) ?? undefined;
  });
  watch(data, () => {
    callback(data.value as any);
  });
  if (data.value) {
    callback(data.value as any);
  }
  pageStore.putStore(params.uniqueKey, params.source, dependencies);
};
