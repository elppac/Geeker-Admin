<!-- eslint-disable vue/attribute-hyphenation -->
<template>
  <FormProvider :form="form">
    <FormLayout :breakpoints="[680]" layout="horizontal" label-align="left" :label-col="6" :wrapper-col="10">
      <Button>Button</Button>
    </FormLayout>
    <Field name="input2" :component="[Input, { placeholder: '请输入 22' }]" />
  </FormProvider>
</template>

<script setup lang="ts">
import { createForm } from "@formily/core";
import { FormLayout } from "@formily/element-plus";
import { FormProvider, Field } from "@formily/vue";
import { ElInput as Input, ElButton as Button } from "element-plus";
// import { onRenderTracked, onRenderTriggered } from "vue";

// onRenderTracked(event => {
//   debugger;
// });

// onRenderTriggered(event => {
//   debugger;
// });

const form = createForm();
</script>
