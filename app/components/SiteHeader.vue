<!-- 站点状态横幅 -->
<template>
  <header id="header" class="site-container">
    <div :class="['status-banner', status]">
      <div class="banner-main">
        <div class="banner-title-row">
          <StatusIcon :type="status" :size="16" />
          <div class="banner-title">{{ statusText }}</div>
        </div>
        <div class="banner-desc">{{ statusDesc }}</div>
      </div>
      <div v-if="updateText" class="banner-update">
        {{ $t("header.update") }} {{ updateText }}
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { SiteType } from "~~/types/main";

const { t } = useI18n();
const statusStore = useStatusStore();

// 整体状态：优先根据当前数据推导，避免刷新时闪烁
const status = computed<SiteType>(() => {
  const data = statusStore.siteData;
  if (!data) return statusStore.siteStatus;
  const { ok, error } = data.status;
  if (error > 0) return ok > 0 ? "warn" : "error";
  if (ok > 0) return "normal";
  return "unknown";
});

const statusText = computed(() => {
  const map: Record<SiteType, string> = {
    loading: t("site.loading"),
    unknown: t("site.unknown"),
    normal: t("site.normal"),
    warn: t("site.warn"),
    error: t("site.error"),
  };
  return map[status.value];
});

const statusDesc = computed(() => {
  const map: Record<SiteType, string> = {
    loading: t("banner.loadingDesc"),
    unknown: statusStore.siteData
      ? t("banner.pausedDesc")
      : t("banner.unknownDesc"),
    normal: t("banner.normalDesc"),
    warn: t("banner.warnDesc"),
    error: t("banner.errorDesc"),
  };
  return map[status.value];
});

const updateText = computed(() => {
  const timestamp = statusStore.siteData?.timestamp;
  if (!timestamp) return "";
  return formatTime(timestamp, { showTime: true, showOnlyTimeIfToday: true });
});

// 每 5 分钟自动刷新
useIntervalFn(
  async () => {
    if (document.hidden) return;
    await getSiteData();
  },
  5 * 60 * 1000,
);
</script>

<style lang="scss" scoped>
#header {
  margin-top: 24px;
}
.status-banner {
  position: relative;
  padding: 4px;
  border-radius: 12px;
  overflow: hidden;
  &.normal {
    background: var(--banner-bg);
  }
  &.warn {
    background: rgba(245, 158, 11, 0.15);
  }
  &.error {
    background: rgba(239, 68, 68, 0.15);
  }
  &.unknown {
    background: var(--panel-bg);
  }
  &.loading {
    background: rgba(59, 130, 246, 0.12);
  }
}
.banner-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px 16px;
}
.banner-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
}
.banner-title {
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  color: var(--text-color);
}
.banner-desc {
  margin-left: 24px;
  font-size: 14px;
  line-height: 20px;
  color: var(--muted-text);
}
.banner-update {
  position: absolute;
  right: 16px;
  bottom: 12px;
  font-size: 12px;
  color: var(--muted-text);
  opacity: 0.8;
}
@media (max-width: 640px) {
  .banner-update {
    display: none;
  }
}
</style>
