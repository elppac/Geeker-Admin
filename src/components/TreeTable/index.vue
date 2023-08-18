<template>
  <div class="main-box">
    <TreeFilter
      label="name"
      title="部门列表(单选)"
      :data="treeFilterData"
      :default-value="initParam.departmentId"
      @change="changeTreeFilter"
    />
    <div class="table-box">
      <ProTable
        ref="proTable"
        title="用户列表"
        row-key="id"
        :searchbar-columns="searchbarColumns"
        :indent="20"
        :columns="columns"
        :request-api="getUserTreeList"
        :request-auto="false"
        :init-param="initParam"
        :search-col="{ xs: 1, sm: 1, md: 2, lg: 3, xl: 3 }"
      >
        <!-- 表格 header 按钮 -->
        <template #tableHeader="scope">
          <div class="table-box-operations">
            <el-button v-if="Permissions.includes('add')" type="primary" :icon="CirclePlus" @click="openForm('新增')">
              新增用户
            </el-button>
            <Operation location="multiple" :data="scope" :permissions="Permissions" />
          </div>
        </template>
        <template #toolButton>
          <Operation location="single" :button="{ circle: true }" :permissions="Permissions" />
        </template>
        <!-- 表格操作 -->
        <template #operation="scope">
          <el-button
            v-if="Permissions.includes('view')"
            type="primary"
            link
            :icon="View"
            @click="openForm('查看', scope.row, true)"
          >
            查看
          </el-button>
          <el-button
            v-if="Permissions.includes('update')"
            type="primary"
            link
            :icon="EditPen"
            @click="openForm('编辑', scope.row)"
          >
            编辑
          </el-button>
          <el-button v-if="Permissions.includes('delete')" type="primary" link :icon="Delete" @click="deleteAccount(scope.row)">
            删除
          </el-button>
          <Operation location="record" :button="{ link: true, type: 'primary' }" :data="scope.row" :permissions="Permissions" />
        </template>
      </ProTable>
      <UserDrawer ref="drawerRef" />
      <ImportExcel ref="dialogRef" />
    </div>
  </div>
</template>

<script setup lang="tsx" name="TreeTable">
import * as _ from "lodash-es";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useHandleData } from "@/hooks/useHandleData";
import { FormDrawer, FormLayout, FormItem, Input, FormTab, Select, Upload, DatePicker, InputNumber } from "@formily/element-plus";
import { ElButton, ElTooltip } from "element-plus";
import { createSchemaField } from "@formily/vue";
import { ElMessage } from "element-plus";
import ProTable from "@/components/ProTable/index.vue";
import TreeFilter from "@/components/TreeFilter/index.vue";
import ImportExcel from "@/components/ImportExcel/index.vue";
import UserDrawer from "@/views/proTable/components/UserDrawer.vue";
import { CirclePlus, Delete, EditPen, View } from "@element-plus/icons-vue";
import { ColumnProps, ProTableInstance } from "@/components/ProTable/interface";
import { deleteUser, getUserTreeList } from "@/api/modules/user";
import { usePageStore } from "@/stores/modules/page";
import { User } from "@/api/interface";
import { GramFormGridBox, GramFormInputTable, GramFormInputTableAsync } from "@/components/GramFormField";
import { useEnum } from "@/hooks/useEnum";
import { usePermissions } from "@/hooks/usePermission";
import { useModel } from "@/hooks/useModel";
import { DataField, Field, Form, GeneralField, onFieldReact, onFieldValueChange } from "@formily/core";
import { run as runReaction } from "@/reaction";
import { paramsToKey } from "@/utils";

const { page } = useModel();
const pageStore = usePageStore();
const { Permissions } = usePermissions();
const props = defineProps<{
  treeFilter: any;
  operations: any[];
}>();
console.log("appStore.pageSchema?.operations", props.operations);
const TREE_FILTER_UNIQUE = "treeFilter";

const OperationButtonOptions: {
  [key: string]: {
    icon?: any;
    type?: string;
    selected?: boolean;
  };
} = {
  export: {
    icon: <i class="iconfont icon-export" />
  },
  import: {
    icon: <i class="iconfont icon-import" />
  },
  delete: {
    icon: <i class="iconfont icon-rest" />,
    type: "danger"
  },
  share: {
    icon: <i class="iconfont icon-share-alt" />
  },
  print: {
    icon: <i class="iconfont icon-printer" />
  }
};

onMounted(() => {
  pageStore.putStore(TREE_FILTER_UNIQUE, props.treeFilter.source);
  // ElNotification({
  //   title: "温馨提示",
  //   message: "该页面 ProTable 数据不会自动请求，需等待 treeFilter 数据请求完成之后，才会触发表格请求。",
  //   type: "info",
  //   duration: 10000
  // });
});

// 获取 ProTable 元素，调用其获取刷新数据方法（还能获取到当前查询参数，方便导出携带参数）
const proTable = ref<ProTableInstance>();

// 如果表格需要初始化请求参数，直接定义传给 ProTable(之后每次请求都会自动带上该参数，此参数更改之后也会一直带上，改变此参数会自动刷新表格数据)
const initParam = reactive({ departmentId: "" });
// 获取 treeFilter 数据
// 当 proTable 的 requestAuto 属性为 false，不会自动请求表格数据，等待 treeFilter 数据回来之后，更改 initParam.departmentId 的值，才会触发请求 proTable 数据
const treeFilterData = computed(() => _.get(pageStore.enum, `${TREE_FILTER_UNIQUE}.data`));
watch(treeFilterData, () => {
  initParam.departmentId = _.get(treeFilterData.value, "[0].id", "");
});

// 树形筛选切换
const changeTreeFilter = (val: string) => {
  ElMessage.success("请注意查看请求参数变化 🤔");
  proTable.value!.pageable.pageNum = 1;
  initParam.departmentId = val;
};

const columns: ColumnProps<any>[] = page.value?.scenes?.list().items.map((i: any) => {
  const { type, name, title, ...rest } = i;
  return { ...rest, prop: name, label: title, dataType: type, isShow: true };
});
columns.unshift({ type: "selection", fixed: "left", width: 60 });
columns.push({ prop: "operation", label: "操作", width: 300, fixed: "right" });

const getSearchComponent = (i: any) => {
  const config: any = {
    el: "input"
  };
  // switch (dataType) {
  //   case "number":
  //     ui = "InputNumber";
  //     break;

  //   default:
  //     break;
  // }
  if (i.bizType) {
    if (i.bizType === "enum") {
      config.props = {
        source: i.source
      };
      if (i.source.type === "static") {
        config.el = "select";
      } else if (i.source.type === "model") {
        config.el = "tree-select";
      } else {
        config.el = i.source.type;
      }
    }
  }
  return config;
};
const searchbarColumns = page.value?.scenes?.searchbar().items.map((i: any) => {
  const { name, title, ...rest } = i;
  return {
    ...rest,
    prop: name,
    label: title,
    search: getSearchComponent(i)
  };
});

// 删除用户信息
const deleteAccount = async (params: User.ResUserList) => {
  await useHandleData(deleteUser, { id: [params.id] }, `删除【${params.username}】用户`);
  proTable.value?.getTableList();
};

const useAsyncDataSource = () => (field: Field) => {
  const category = field.componentProps.source.type === "static" ? "static" : field.componentProps.source.value;
  const name = field.props.name;

  // 依赖处理
  const dependencies = _.get(_.first((page.value.reactions || []).filter((i: any) => i.name === name)), "dependencies") || [];
  const dependenciesValue: { [key: string]: any } = {};
  if (dependencies.length > 0) {
    const formValues = field.form.values;
    let required = false;
    dependencies.forEach(i => {
      // TODO 这个需要处理一下 "作用域" 如主子表单的相互依赖; 对表单空值需要定义。
      if (formValues[i] !== undefined && formValues[i] !== null) {
        dependenciesValue[i] = formValues[i];
      } else {
        required = true;
      }
    });
    console.log("useAsyncDataSource", name, field, dependencies);
    if (required) {
      field.dataSource = [];
      field.reset();
      return;
    }
  }

  const suffix = dependencies.length > 0 ? `$${paramsToKey(dependenciesValue as any)}` : "";
  const uniqueKey = `${name}$${category}${suffix}`;
  field.loading = true;
  useEnum(
    data => {
      // 选中的值不在列表中， 就重置
      if (!_.some(data, ["value", field.value])) {
        field.reset();
      }
      field.dataSource = data;
      field.loading = false;
    },
    {
      uniqueKey,
      source: field.componentProps.source
    },
    dependenciesValue
  );
};

const Operation = ({
  data,
  location,
  button = {},
  permissions
}: {
  data?: any;
  location: "record" | "multiple" | "single";
  button?: { [key: string]: any };
  permissions: string[];
}) => {
  return props.operations
    ?.filter((i: any) => i.location === location)
    .map(i => {
      const hiddenText = button.circle === true;
      const btnProps: any = {
        onClick: () => {
          console.log(i.name, data);
        },
        key: i.name,
        disabled: !(data && data.isSelected) && i.selected === true,
        ...button,
        type: OperationButtonOptions[i.name].type ?? "",
        icon: OperationButtonOptions[i.name].icon
      };
      // ElButton 对 <ElButton></ElButton> 和 <ElButton/> 解析会不一致
      const btn = hiddenText ? <ElButton {...btnProps} /> : <ElButton {...btnProps}>{i.title}</ElButton>;
      return permissions.includes(i.name) && (hiddenText ? <ElTooltip content={i.title}>{btn}</ElTooltip> : btn);
    });
};

// 打开 drawer(新增、查看、编辑)

const scenesFormConfig = page.value?.scenes?.form();
const { SchemaField } = createSchemaField({
  components: {
    FormItem,
    Input,
    Tab: FormTab,
    // Box: GramFormBox,
    GridBox: GramFormGridBox,
    Select,
    Upload,
    InputTable: GramFormInputTable,
    InputTableAsync: GramFormInputTableAsync,
    DatePicker,
    InputNumber
  }
});
const DrawerForm = {
  props: ["form"],
  data() {
    const schema = scenesFormConfig.schema;
    return {
      schema: {
        type: "object",
        properties: {
          root: schema
        }
      }
    };
  },
  render() {
    return (
      <FormLayout>
        <SchemaField schema={this.schema as any} scope={{ useAsyncDataSource }} />
      </FormLayout>
    );
  }
};
const openForm = (title: string, data: any = null, readPretty: boolean = false) => {
  FormDrawer(
    {
      title,
      size: "90%"
    },
    DrawerForm
  )
    .open({
      initialValues: data || {},
      readPretty,
      effects: () => {
        runReaction(page.value.reactions);
      }
    })
    .then(values => {
      console.log("values", values);
    })
    .catch(e => {
      console.log(e);
    });
};
// openForm("新增");
</script>
