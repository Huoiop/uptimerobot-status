<!-- 故障详情页 -->
<template>
  <div class="incident-page site-container">
    <button class="back-link" @click="navigate(backTarget)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m15 18-6-6 6-6" />
      </svg>
      {{ backText }}
    </button>

    <template v-if="incident">
      <div class="incident-head">
        <div class="incident-title-row">
          <h1 class="incident-title">{{ title }}</h1>
          <span
            v-for="tag in incident.tags || []"
            :key="tag.id ?? tag.name"
            class="tag-pill"
          >
            {{ tag.name }}
          </span>
        </div>
        <div class="incident-badges">
          <div
            :class="[
              'status-badge',
              incident.resolvedAt ? 'resolved' : 'ongoing',
            ]"
          >
            {{
              incident.resolvedAt
                ? $t("card.resolved")
                : $t("card.investigating")
            }}
          </div>
        </div>
        <div class="incident-time">
          {{ formatDateTime(incident.startedAt) }}
          <span class="sep">~</span>
          {{
            incident.resolvedAt
              ? formatDateTime(incident.resolvedAt)
              : $t("card.ongoing")
          }}
          ({{ formatDuration(currentDuration) }})
          <span class="sep">·</span>
          {{ timezone }}
        </div>
        <p class="incident-desc">
          {{
            incident.resolvedAt
              ? $t("card.resolvedDesc")
              : $t("card.investigatingDesc")
          }}
        </p>
      </div>

      <!-- 受影响组件 -->
      <section class="affected-panel">
        <div class="affected-head">{{ $t("status.affected") }}</div>
        <div ref="affectedBody" class="affected-body">
          <div
            :class="['affected-times', { dimmed: cursorX !== null }]"
          >
            <span>{{ shortTime(incident.startedAt) }}</span>
            <span>
              {{
                incident.resolvedAt
                  ? shortTime(incident.resolvedAt)
                  : $t("card.ongoing")
              }}
            </span>
          </div>
          <div class="component-row">
            <StatusIcon
              :type="incident.resolvedAt ? 'normal' : 'error'"
              :size="16"
            />
            <span class="component-name">
              {{ incident.monitorName || $t("status.allMonitors") }}
            </span>
            <span
              v-for="tag in incident.tags || []"
              :key="tag.id ?? tag.name"
              class="tag-pill"
            >
              {{ tag.name }}
            </span>
            <span v-if="incident.cause" class="component-code">
              {{ incident.cause }}
            </span>
            <span class="component-meta">
              {{ formatDuration(currentDuration) }}
            </span>
          </div>
          <div
            :class="[
              'affected-bar',
              { ongoing: !incident.resolvedAt },
            ]"
            @mousemove="onBarMove"
            @mouseleave="clearCursor"
          >
            <span class="seg green" />
            <span class="seg mid" />
            <span class="seg green" />
          </div>
          <div
            v-if="cursorX !== null"
            class="affected-cursor"
            :style="{ left: `${cursorX}px` }"
          >
            <span class="affected-cursor-time">{{ cursorTime }}</span>
          </div>
        </div>
      </section>

      <!-- 更新记录 -->
      <section class="updates">
        <h2>{{ $t("status.updates") }}</h2>
        <IncidentTimeline :incidents="[incident]" />
      </section>

      <!-- 跟随鼠标的故障提示 -->
      <Teleport to="body">
        <div
          v-if="tooltipPos"
          class="affected-tooltip-float"
          :style="tooltipStyle"
        >
          <div class="affected-tooltip">
            <div class="affected-tooltip-head">
              <span>
                {{
                  hoveredSegment === "healthy"
                    ? $t("status.healthy")
                    : incident.resolvedAt
                      ? $t("status.outage")
                      : $t("card.investigating")
                }}
              </span>
              <span
                v-if="hoveredSegment === 'incident'"
                class="affected-tooltip-duration"
              >
                {{ formatDuration(currentDuration) }}
              </span>
            </div>
            <div class="affected-tooltip-time">
              <template v-if="hoveredSegment === 'incident'">
                {{ shortTime(incident.startedAt) }}
                <span class="arrow">→</span>
                {{
                  incident.resolvedAt
                    ? shortTime(incident.resolvedAt)
                    : $t("card.ongoing")
                }}
              </template>
              <template v-else>{{ cursorTime }}</template>
            </div>
          </div>
        </div>
      </Teleport>
    </template>

    <div v-else-if="loading" class="panel loading">
      <n-spin size="large" />
    </div>

    <div v-else class="panel not-found">
      <n-text depth="3">{{ $t("status.incidentNotFound") }}</n-text>
      <button class="outline-btn" @click="navigate(backTarget)">
        {{ backText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppRoute } from "~/composables/useAppRoute";
import { getIncidentTitle } from "~/utils/incident";
import type { SiteIncident } from "~~/types/main";

const props = defineProps<{
  incidentId: string;
}>();

const { t, locale } = useI18n();
const statusStore = useStatusStore();
const { navigate, previousPath } = useAppRoute();
const { siteTitle } = useRuntimeConfig().public;

const backTarget = computed(() =>
  previousPath.value === "/history" ? "/history" : "/",
);
const backText = computed(() =>
  previousPath.value === "/history"
    ? t("status.backToHistory")
    : t("status.backToStatus", { site: siteTitle }),
);

const loading = ref(!statusStore.siteData);

const affectedBody = ref<HTMLElement | null>(null);
const cursorX = ref<number | null>(null);
const cursorRatio = ref(0);
const tooltipPos = ref<{
  x: number;
  y: number;
  above: boolean;
} | null>(null);

const onBarMove = (event: MouseEvent) => {
  const body = affectedBody.value;
  const bar = event.currentTarget as HTMLElement | null;
  if (!body || !bar) return;
  const bodyRect = body.getBoundingClientRect();
  const barRect = bar.getBoundingClientRect();
  cursorX.value = Math.min(
    Math.max(event.clientX - bodyRect.left, 0),
    bodyRect.width,
  );
  cursorRatio.value = Math.min(
    Math.max((event.clientX - barRect.left) / barRect.width, 0),
    1,
  );
  tooltipPos.value = {
    x: event.clientX,
    y: event.clientY,
    above: event.clientY + 110 > window.innerHeight,
  };
};

const tooltipStyle = computed(() => {
  const pos = tooltipPos.value;
  if (!pos) return {};
  const width = Math.min(280, window.innerWidth - 24);
  const half = width / 2;
  const x = Math.min(
    Math.max(pos.x, half + 12),
    window.innerWidth - half - 12,
  );
  return {
    left: `${x}px`,
    top: `${pos.above ? pos.y - 16 : pos.y + 16}px`,
    transform: pos.above ? "translate(-50%, -100%)" : "translateX(-50%)",
    maxWidth: `${width}px`,
  };
});

const hoveredSegment = computed<"healthy" | "incident">(() => {
  if (cursorX.value === null) return "incident";
  return cursorRatio.value < 0.0833 || cursorRatio.value > 0.9167
    ? "healthy"
    : "incident";
});

const cursorTime = computed(() => {
  const value = incident.value;
  if (!value || cursorX.value === null) return "";
  const start = value.startedAt;
  const end = value.resolvedAt ?? Math.floor(Date.now() / 1000);
  // 条形中间 83.34% 对应故障起止时间
  const ratio = Math.min(
    Math.max((cursorRatio.value - 0.0833) / 0.8334, 0),
    1,
  );
  return shortTime(start + Math.round((end - start) * ratio));
});

const clearCursor = () => {
  cursorX.value = null;
  cursorRatio.value = 0;
  tooltipPos.value = null;
};

// 在已加载的数据中查找该故障
const incident = computed<SiteIncident | undefined>(() => {
  for (const site of statusStore.siteData?.data ?? []) {
    for (const day of site.days) {
      const found = day.incidents?.find(
        (item) => item.id === props.incidentId,
      );
      if (found) return found;
    }
  }
  return undefined;
});

const title = computed(() =>
  getIncidentTitle(incident.value, t("card.unknownReason")),
);

const currentDuration = computed(() => {
  const value = incident.value;
  if (!value) return 0;
  if (value.resolvedAt) return value.duration;
  return Math.max(0, Math.floor(Date.now() / 1000) - value.startedAt);
});

const timezone =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const formatDateTime = (time: number) => {
  if (!time) return "-";
  try {
    return new Intl.DateTimeFormat(locale.value, {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(time * 1000));
  } catch {
    return formatTime(time, { showTime: true });
  }
};

const shortTime = (time: number) => {
  if (!time) return "-";
  try {
    return new Intl.DateTimeFormat(locale.value, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(time * 1000));
  } catch {
    return formatTime(time, { showTime: true });
  }
};

const load = async () => {
  if (statusStore.siteData) return;
  loading.value = true;
  try {
    await getSiteData();
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>

<style lang="scss" scoped>
.incident-page {
  padding-top: 24px;
  padding-bottom: 40px;
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--muted-text);
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
  svg {
    width: 16px;
    height: 16px;
  }
  &:hover {
    color: var(--text-color);
  }
}
.incident-head {
  margin-top: 28px;
}
.incident-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.incident-title {
  font-size: 18px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--text-color);
}
.incident-badges {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.tag-pill {
  padding: 1px 7px;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  color: var(--muted-text);
  font-size: 11px;
  line-height: 18px;
  white-space: nowrap;
}
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  &.resolved {
    background: rgba(34, 197, 94, 0.14);
    color: var(--normal-color);
  }
  &.ongoing {
    background: rgba(239, 68, 68, 0.14);
    color: var(--error-color);
  }
}
.incident-time {
  margin-top: 8px;
  font-size: 14px;
  line-height: 20px;
  color: var(--muted-text);
  .sep {
    margin: 0 4px;
  }
}
.incident-desc {
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-color);
}
.affected-panel {
  margin-top: 24px;
  padding: 4px;
  border-radius: 12px;
  background: var(--panel-bg);
}
.affected-head {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}
.affected-body {
  position: relative;
  padding: 16px;
  border-radius: 8px;
  background: var(--panel-inner-bg);
}
.affected-cursor {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 2;
  width: 1px;
  background: rgba(128, 128, 128, 0.5);
  pointer-events: none;
  .affected-cursor-time {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    padding: 0 4px;
    border-radius: 4px;
    background: var(--panel-inner-bg);
    color: var(--text-color);
    font-size: 12px;
    white-space: nowrap;
  }
}
.affected-times {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8.33%;
  font-size: 12px;
  color: var(--muted-text);
  transition: opacity 0.15s;
  &.dimmed {
    opacity: 0.35;
  }
}
.component-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  row-gap: 4px;
  margin: 12px 0 8px;
  .component-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color);
  }
  .component-code {
    padding: 1px 7px;
    border-radius: 999px;
    background: rgba(239, 68, 68, 0.15);
    color: var(--error-color);
    font-size: 11px;
    font-weight: 600;
  }
  .component-meta {
    margin-left: auto;
    font-size: 12px;
    color: var(--muted-text);
  }
}
.affected-bar {
  display: flex;
  height: 16px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--button-bg);
  cursor: pointer;
  .seg {
    height: 100%;
    transition: filter 0.15s;
    &:hover {
      filter: brightness(0.82);
    }
    &.green {
      width: 8.33%;
      background: var(--normal-color);
    }
    &.mid {
      flex: 1;
      background: var(--warn-color);
    }
  }
  &.ongoing .seg.mid {
    background: var(--error-color);
  }
}
.affected-tooltip-float {
  position: fixed;
  z-index: 3000;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--popup-bg);
  box-shadow: 0 8px 24px var(--tooltip-shadow);
  pointer-events: none;
}
.affected-tooltip {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 240px;
  .affected-tooltip-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    font-size: 14px;
    color: var(--text-color);
  }
  .affected-tooltip-duration {
    padding: 1px 6px;
    border-radius: 4px;
    background: var(--button-bg);
    color: var(--muted-text);
    font-size: 12px;
    white-space: nowrap;
  }
  .affected-tooltip-time {
    font-size: 12px;
    color: var(--muted-text);
    .arrow {
      margin: 0 4px;
    }
  }
}
.updates {
  margin-top: 32px;
  h2 {
    margin-bottom: 16px;
    font-size: 16px;
    font-weight: 500;
    color: var(--text-color);
  }
}
.loading,
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 240px;
  margin-top: 24px;
  padding: 40px;
  background: var(--panel-bg);
}
.not-found {
  background: var(--panel-bg);
}
.outline-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--button-bg);
  color: var(--text-color);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    background: var(--hover-bg);
    border-color: var(--border-strong);
  }
}
</style>
