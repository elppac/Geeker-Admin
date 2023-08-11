<template>
  <el-icon v-if="icon && icon.indexOf('icon') === -1">
    <component :is="icon"></component>
  </el-icon>
  <i v-if="icon && icon.indexOf('icon') === 0" class="iconfont" :class="icon"></i>
</template>

<script setup lang="ts">
defineProps<{
  icon: string | any;
}>();
</script>
