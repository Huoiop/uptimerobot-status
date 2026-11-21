<!-- 故障事件时间线 -->
<template>
  <div class="incident-timeline">
    <n-text v-if="!events.length" depth="3" class="empty">
      {{ emptyText || $t("status.emptyHistory") }}
    </n-text>
    <div v-else class="event-timeline">
      <div
        v-for="event in events"
        :key="event.key"
        :class="['event', { clickable }]"
        :role="clickable ? 'button' : undefined"
        :tabindex="clickable ? 0 : undefined"
        @click="selectEvent(event)"
        @keydown.enter="selectEvent(event)"
      >
        <span class="dot" :class="event.type" />
        <div class="event-title-row">
          <div class="event-title">{{ event.title }}</div>
          <span v-if="showMonitor && event.monitorName" class="event-monitor">
            {{ event.monitorName }}
          </span>
          <template v-if="showMonitor">
            <span
              v-for="tag in event.tags || []"
              :key="tag.id ?? tag.name"
              class="event-tag"
            >
              {{ tag.name }}
            </span>
          </template>
        </div>
        <div class="event-time">
          <n-text depth="3">{{ formatEventTime(event.time) }}</n-text>
          <n-text v-if="event.ongoing" depth="3">
            {{ $t("card.ongoing") }}
          </n-text>
          <n-text v-if="event.duration" depth="3">
            {{ formatDuration(event.duration) }}
          </n-text>
        </div>
        <div v-if="event.description" class="event-desc">
          {{ event.description }}
        </div>
        <div v-if="event.message" class="event-detail">
          <n-tag
            v-if="event.cause"
            :bordered="false"
            size="small"
            round
            type="error"
            class="cause-tag"
          >
            {{ event.cause }}
          </n-tag>
          <n-text>{{ event.message }}</n-text>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SiteIncident, SiteTag } from "~~/types/main";

interface TimelineEvent {
  key: string;
  incidentId?: string;
  type: "error" | "success";
  title: string;
  time: number;
  description: string;
  monitorName?: string;
  tags?: SiteTag[];
  cause?: number | null;
  message?: string;
  duration?: number;
  ongoing?: boolean;
}

const props = withDefaults(
  defineProps<{
    incidents?: SiteIncident[];
    showMonitor?: boolean;
    emptyText?: string;
    clickable?: boolean;
  }>(),
  {
    incidents: () => [],
    showMonitor: false,
    emptyText: "",
    clickable: false,
  },
);

const emit = defineEmits<{
  select: [id: string];
}>();

const selectEvent = (event: TimelineEvent) => {
  if (props.clickable && event.incidentId) emit("select", event.incidentId);
};

const { t, locale } = useI18n();

// 按当前语言格式化故障时间
const formatEventTime = (time: number) => {
  if (!time) return "-";
  try {
    return new Intl.DateTimeFormat(locale.value, {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(time * 1000));
  } catch {
    return formatTime(time, { showTime: true });
  }
};

// 生成开始 / 恢复事件，最新事件在前
const events = computed<TimelineEvent[]>(() => {
  const list: TimelineEvent[] = [];
  props.incidents.forEach((incident, index) => {
    const ongoing = !incident.resolvedAt;
    list.push({
      key: `${incident.id ?? index}-start`,
      incidentId: incident.id,
      type: "error",
      title: ongoing ? t("card.investigating") : t("card.started"),
      time: incident.startedAt,
      description: ongoing ? t("card.investigatingDesc") : "",
      monitorName: incident.monitorName,
      tags: incident.tags,
      cause: incident.cause,
      message: getIncidentMessage(incident, t("card.unknownReason")),
      duration: ongoing ? incident.duration : undefined,
      ongoing,
    });
    if (incident.resolvedAt) {
      list.push({
        key: `${incident.id ?? index}-resolved`,
        incidentId: incident.id,
        type: "success",
        title: t("card.resolved"),
        time: incident.resolvedAt,
        description: t("card.resolvedDesc"),
        monitorName: incident.monitorName,
        tags: incident.tags,
        duration: incident.duration,
      });
    }
  });
  return list.sort((a, b) => b.time - a.time);
});
</script>

<style lang="scss" scoped>
.incident-timeline {
  .empty {
    font-size: 13px;
  }
}
.event-timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-left: 18px;
  &::before {
    content: "";
    position: absolute;
    left: 5px;
    top: 10px;
    bottom: 10px;
    width: 1px;
    background: var(--timeline-line);
  }
}
.event {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  &.clickable {
    cursor: pointer;
    &:focus-visible {
      outline: 2px solid var(--accent-color);
      outline-offset: 2px;
      border-radius: 4px;
    }
  }
  .dot {
    position: absolute;
    left: -16.5px;
    top: 6px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    box-shadow: 0 0 0 2px var(--popup-bg);
    &.error {
      background: var(--error-color);
    }
    &.success {
      background: var(--normal-color);
    }
  }
  .event-title-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    min-width: 0;
    min-height: 20px;
    .event-title {
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
    }
  }
  .event-monitor {
    max-width: 55%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 1px 6px;
    border: 1px solid var(--border-color);
    border-radius: 999px;
    color: var(--muted-text);
    font-size: 11px;
  }
  .event-tag {
    padding: 1px 6px;
    border: 1px solid var(--border-color);
    border-radius: 999px;
    color: var(--muted-text);
    font-size: 11px;
    white-space: nowrap;
  }
  .event-time {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }
  .event-desc {
    font-size: 12px;
    line-height: 1.6;
  }
  .event-detail {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
    font-size: 12px;
    line-height: 1.5;
    word-break: break-word;
  }
  .cause-tag {
    --n-height: 20px;
  }
}
</style>
