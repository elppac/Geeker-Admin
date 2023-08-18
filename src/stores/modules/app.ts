import { defineStore } from "pinia";
import { getPage } from "@/api/modules/app";
import { type Reaction } from "@/reaction";
export type PAGES = { "x-reactions"?: Reaction[]; [key: string]: any };
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
