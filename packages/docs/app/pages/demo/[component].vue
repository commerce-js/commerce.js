<script lang="ts" setup>
const route = useRoute()
const componentName = route.params.component
</script>
<template>
    {{ componentName }}
</template>