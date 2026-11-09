<template>
  <v-data-table :items="items" :headers="headers">
    <template #item.name="{ item }">{{ item.name }}</template>
  </v-data-table>
</template>
<script setup lang="ts">
const items = [{ name: 'a' }];
const headers = [{ title: '名前', key: 'name' }];
</script>
