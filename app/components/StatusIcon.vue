<!-- 状态图标 -->
<template>
  <span
    :style="{ width: `${size}px`, height: `${size}px` }"
    :class="['status-icon', type]"
    role="img"
    :aria-label="type"
  >
    <svg
      v-if="type === 'normal'"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M4.2 8.4 6.6 10.8 11.8 5.4" />
    </svg>
    <svg
      v-else-if="type === 'warn'"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    >
      <path d="M8 4.2v4.6" />
      <circle cx="8" cy="11.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
    <svg
      v-else-if="type === 'error'"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    >
      <path d="M5.2 5.2 10.8 10.8M10.8 5.2 5.2 10.8" />
    </svg>
    <svg
      v-else-if="type === 'loading'"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      class="spin"
    >
      <path d="M8 2.5a5.5 5.5 0 1 0 5.5 5.5" />
    </svg>
    <svg
      v-else
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    >
      <path d="M6 5v6M10 5v6" />
    </svg>
  </span>
</template>

<script setup lang="ts">
import type { SiteType } from "~~/types/main";

withDefaults(
  defineProps<{
    type: SiteType;
    size?: number;
  }>(),
  {
    size: 16,
  },
);
</script>

<style lang="scss" scoped>
.status-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  color: #fff;
  background: var(--unknown-color);
  &.normal {
    background: var(--normal-color);
  }
  &.warn {
    background: var(--warn-color);
  }
  &.error {
    background: var(--error-color);
  }
  &.unknown {
    background: var(--unknown-color);
  }
  &.loading {
    background: var(--loading-color);
  }
  svg {
    width: 70%;
    height: 70%;
  }
  .spin {
    animation: status-spin 1s linear infinite;
  }
}

@keyframes status-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
