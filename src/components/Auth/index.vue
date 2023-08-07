<template>
  <div v-if="!Permissions">权限校验中...</div>
  <div v-if="Permissions && !Permissions.includes('view')">
    <el-result icon="warning" title="无权限" sub-title="请联系管理员进行添加"> </el-result>
  </div>
  <slot v-if="Permissions && Permissions.includes('view')"></slot>
</template>
<script setup lang="ts" name="auth">
import { usePermissions } from "@/hooks/usePermission";
const { Permissions } = usePermissions();
</script>
