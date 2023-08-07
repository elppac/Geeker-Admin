import { computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/modules/auth";

/**
 * @description 页面按钮权限
 * */
export const usePermissions = () => {
  const route = useRoute();
  const authStore = useAuthStore();
  const permissionList = authStore.permissionListGet;

  const Permissions = computed(() => {
    let currentPagePermission: string[] = permissionList
      .filter(i => i.indexOf(`${route.name as string}:`) === 0)
      .map(i => i.replace(`${route.name as string}:`, ""));
    return currentPagePermission;
  });

  return {
    Permissions
  };
};
