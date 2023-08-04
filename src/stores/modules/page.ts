import { getDef, getModel } from "@/api/modules/app";
import { defineStore } from "pinia";
export interface PageState {
  store: {
    [key: string]: {
      loading: boolean;
      data?: any;
    };
  };
}
export const usePageStore = defineStore({
  id: "gram-page",
  state: (): PageState => ({
    store: {}
  }),
  getters: {
    // enum: state => {
    //   return (unique: string) => {
    //     return state.store[unique];
    //   };
    // },
    enum: state => {
      return state.store;
    }
  },
  actions: {
    async putEnum(unique: string, { type, value }: { type: string; value: any }) {
      if (!this.store[unique]) {
        if (type === "static") {
          this.store = {
            ...this.store,
            [unique]: {
              data: value,
              loading: false
            }
          };
        } else if (type === "model") {
          this.store[unique] = { loading: true };
          const { data } = await getModel(value);
          this.store[unique] = {
            data,
            loading: false
          };
        } else if (type === "def") {
          this.store[unique] = { loading: true };
          const { data } = await getDef(value);
          this.store[unique] = {
            data,
            loading: false
          };
        }
      }
    }
  }
});
