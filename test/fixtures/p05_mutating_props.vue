<template>
  <button @click="count++">
    {{ count }}
  </button>
</template>
<script setup lang="ts">
defineProps<{ count: number }>();
</script>
