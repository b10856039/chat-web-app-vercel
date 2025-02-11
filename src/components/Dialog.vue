<template>
  <el-dialog
    v-model="isVisible"
    :title="title"
    :width="width"
    :before-close="beforeClose"
  >
    <slot name="content">Default content</slot>
    <template #footer>
      <slot name="footer" v-if="dialogType === 'submit'">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="confirmDialog">确定</el-button>
      </slot>
      <slot name="footer" v-if="dialogType === 'confirm'">
        <el-button @click="closeDialog">關閉</el-button>
      </slot>
      <slot name="footer" v-if="dialogType === 'none'">
      </slot>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: "CustomDialog",
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      default: "title",
    },
    dialogType : {
      type: String,
      default: "confirm",
    },
    width: {
      type: String,
      default: "50%",
    },
    beforeClose: {
      type: Function,
      default: null,
    },
  },
  emits: ["update:modelValue", "confirm", "cancel"],
  computed: {
    isVisible: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit("update:modelValue", value);
      },
    },
  },
  methods: {
    closeDialog() {
      if (this.beforeClose) {
        this.beforeClose(() => (this.isVisible = false));
      } else {
        this.isVisible = false;
        this.$emit("cancel");
      }
    },
    confirmDialog() {
      this.$emit("confirm");
      this.isVisible = false;
    },
    handleBeforeClose(done) {
      if (this.beforeClose) {
        this.beforeClose(done);
      } else {
        done();
      }
    },
  },
};
</script>
