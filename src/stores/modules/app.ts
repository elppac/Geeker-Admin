import { defineStore } from "pinia";
import { getPage } from "@/api/modules/app";
export type PAGES = { [key: string]: any };
export interface AppState {
  pages: PAGES;
}
export const useAppStore = defineStore({
  id: "gram-app",
  state: (): AppState => ({
    pages: {}
  }),
  getters: {
    pageData: state => state.pages
  },
  actions: {
    async getPage(name: string) {
      if (!this.pages[name]) {
        this.pages[name] = await getPage({ name });
      }
    }
  }
});
