import * as _ from "lodash-es";
import { usePageStore } from "@/stores/modules/page";
import { computed, watch } from "vue";

export const useEnum = (
  callback: (data: any[]) => void,
  params: {
    uniqueKey: string;
    source: {
      type: string;
      value: any;
    };
  }
) => {
  const pageStore = usePageStore();
  const data = computed(() => {
    return _.get(pageStore.enum, `${params.uniqueKey}.data`) ?? undefined;
  });
  watch(data, () => {
    callback(data.value as any);
  });
  if (data.value) {
    callback(data.value as any);
  }
  pageStore.putEnum(params.uniqueKey, params.source);
};
