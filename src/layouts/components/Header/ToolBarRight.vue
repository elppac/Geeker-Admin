<template>
  <div class="tool-bar-ri">
    <el-space direction="horizontal" alignment="center" :size="12">
      <AssemblySize id="assemblySize" />
      <SearchMenu id="searchMenu" />
      <ThemeSetting id="themeSetting" />
      <Message id="message" />
      <Fullscreen id="fullscreen" />
      <div>
        <Avatar /> <span class="username">{{ username }}</span>
      </div>
      <Language id="language" />
    </el-space>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useUserStore } from "@/stores/modules/user";
import AssemblySize from "./components/AssemblySize.vue";
import Language from "./components/Language.vue";
import SearchMenu from "./components/SearchMenu.vue";
import ThemeSetting from "./components/ThemeSetting.vue";
import Message from "./components/Message.vue";
import Fullscreen from "./components/Fullscreen.vue";
import Avatar from "./components/Avatar.vue";

const userStore = useUserStore();
const username = computed(() => userStore.userInfo.name);
</script>

<style scoped lang="scss">
.tool-bar-ri {
  display: flex;
  align-items: center;
  justify-content: center;
  :deep(.toolbar-icon) {
    padding: 6px;
    font-size: 18px;
    color: var(--el-header-text-color);
    &:hover {
      --new-color: color-mix(in srgb, var(--el-header-text-color), var(--el-header-bg-color) 90%);

      background-color: var(--new-color);
      border-radius: 4px;
    }
  }
  .username {
    margin-left: 8px;
    font-size: 14px;
    color: var(--el-header-text-color);
  }
}
</style>
