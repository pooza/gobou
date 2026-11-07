<template>
  <div>{{ ok }}</div>
</template>
<script setup lang="ts">
const a: unknown = 1;
const ok = a == '1';
</script>
