<template>
  <ul>
    <li v-for="item in items">{{ item }}</li>
  </ul>
</template>
<script setup lang="ts">
const items = ['a', 'b'];
</script>
