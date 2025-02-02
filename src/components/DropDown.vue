<template>
  <el-dropdown ref="dropdownElement" :trigger="trigger">
    <span class="el-dropdown-link">
      {{ title }}
      <el-icon v-if="showIcon" class="el-icon--right">
        <ArrowDown />
      </el-icon>
    </span>
    <template #dropdown>
      <slot name="content"></slot>
    </template>
  </el-dropdown>
</template>

<script>
  import { ref } from 'vue';
  import { ArrowDown } from '@element-plus/icons-vue';

  export default {
    components: {
      ArrowDown,
    },
    props: {
      title: String,
      trigger: {
        type: String,
        default: 'click',
      },
      showIcon:{
        type:Boolean,
        default:true
      }
    },
    setup() {
      const dropdownElement = ref(null);

      const handleOpen = () => {
        if (dropdownElement.value) {
          dropdownElement.value.handleOpen(); 
        }
      };

      const handleClose = () => {
        if (dropdownElement.value) {
          dropdownElement.value.handleClose(); 
        }
      };

      return {
        dropdownElement,
        handleOpen,
        handleClose,
      };
    },
  };
</script>

<style scoped>
  .el-dropdown-link {
    cursor: pointer;
    color: var(--el-color-primary);
    display: flex;
    align-items: center;
  }
</style>
