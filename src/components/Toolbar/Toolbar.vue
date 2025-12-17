<template>
  <div v-if="visible" :class="$style.toolbar">
    <button type="button" :class="$style.primaryButton" @click="emit('open')">Pegar notas</button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  visible?: boolean;
}

withDefaults(defineProps<Props>(), {
  visible: true,
});

const emit = defineEmits<{
  open: [];
}>();
</script>

<style scoped module src="./Toolbar.css"></style>
