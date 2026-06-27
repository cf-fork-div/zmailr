<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  to: string;
}>();

/** Site-root absolute paths — relative `../..` breaks under VitePress client routing. */
const href = computed(() => {
  if (/^https?:\/\//i.test(props.to)) return props.to;
  if (props.to.startsWith('/')) return props.to;
  return props.to;
});

/** Leave VitePress SPA for app routes (login, dashboard, api-docs, …). */
function onClick(event: MouseEvent) {
  const url = href.value;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (/^https?:\/\//i.test(url)) return;
  if (!url.startsWith('/') || url.startsWith('/docs')) return;
  event.preventDefault();
  window.location.assign(url);
}
</script>

<template>
  <a :href="href" class="site-link" @click="onClick"><slot /></a>
</template>
