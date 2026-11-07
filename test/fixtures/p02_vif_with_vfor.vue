<template>
  <ul>
    <li
      v-for="item in items"
      v-if="item"
      :key="item"
    >
      {{ item }}
    </li>
  </ul>
</template>
<script setup lang="ts">
const items = ['a', 'b'];
</script>
