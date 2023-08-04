<template>
  <div v-if="pageSchema">
    <PageProvider :page="page">
      <SchemaField :schema="pageSchema" />
    </PageProvider>
  </div>
</template>

<script setup lang="ts" name="general">
import { computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { PageProvider, createPage, createSchemaField } from "@/bee/vue";
import TreeTable from "@/components/TreeTable/index.vue";
import { useAppStore } from "@/stores/modules/app";
import { usePageStore } from "@/stores/modules/page";

const route = useRoute();
const pageName = route.name as string;
// const pageReactive = reactive<any>({ pageSchema: undefined });
const appStore = useAppStore();
const pageStore = usePageStore();

onMounted(async () => {
  await appStore.setCurrentPageName(pageName);
  await appStore.getPage(pageName);
  // console.log(pageStore.pageState);
});

onBeforeUnmount(() => {
  console.log("unmounted", pageName);
  pageStore.$reset();
});
console.log("render page ", pageName);

const pageSchema = computed(() => appStore.pageSchema);

const page = createPage();
const { SchemaField } = createSchemaField({
  components: {
    TreeTable
  }
});
</script>
