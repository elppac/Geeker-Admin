<template>
  <Auth>
    <div v-if="pageModel.pageSchema">
      <PageProvider :page="page">
        <SchemaField :schema="pageModel.pageSchema" />
      </PageProvider>
    </div>
  </Auth>
</template>

<script setup lang="ts" name="general">
import { onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { PageProvider, createPage, createSchemaField } from "@/bee/vue";
import TreeTable from "@/components/TreeTable/index.vue";
import { usePageStore } from "@/stores/modules/page";
import Auth from "@/components/Auth/index.vue";
import { useModel } from "@/hooks/useModel";

const route = useRoute();
const pageName = route.name as string;
// const pageReactive = reactive<any>({ pageSchema: undefined });
const { page: pageModel } = useModel();

const pageStore = usePageStore();
onMounted(async () => {
  // await appStore.getPage(pageName);
  // console.log(pageStore.pageState);
});

onBeforeUnmount(() => {
  console.log("unmounted", pageName);
  pageStore.$reset();
});
// const pageSchema = computed(() => appStore.pageSchema);

const page = createPage();
const { SchemaField } = createSchemaField({
  components: {
    TreeTable
  }
});
</script>
