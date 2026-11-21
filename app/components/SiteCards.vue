<!-- 站点状态 -->
<template>
  <div v-if="result" class="status-main site-container">
    <!-- 系统状态 -->
    <section class="panel">
      <div class="panel-head">
        <h2>{{ $t("status.system") }}</h2>
        <span class="panel-range">{{ rangeLabel }}</span>
      </div>
      <div class="panel-body">
        <div class="monitor-list">
          <div v-for="site in sites" :key="site.id" class="monitor">
            <div class="monitor-main">
              <div class="monitor-left">
                <StatusIcon :type="siteStatusType(site)" :size="16" />
                <span class="monitor-name">{{ site.name }}</span>
                <span
                  v-for="tag in site.tags"
                  :key="tag.id ?? tag.name"
                  class="tag-pill"
                >
                  {{ tag.name }}
                </span>
                <n-popover
                  v-if="!noHover"
                  trigger="hover"
                  placement="top"
                >
                  <template #trigger>
                    <button class="info-btn" aria-label="info">
                      <Icon name="icon:info" />
                    </button>
                  </template>
                  <MonitorInfo :site="site" />
                </n-popover>
                <button
                  v-else
                  class="info-btn"
                  aria-label="info"
                  @click="openInfo(site)"
                >
                  <Icon name="icon:info" />
                </button>
                <span
                  v-if="
                    (site.status === 8 || site.status === 9) &&
                    site.currentIncident
                  "
                  class="current-incident"
                >
                  <span v-if="site.currentIncident.cause" class="incident-code">
                    {{ site.currentIncident.cause }}
                  </span>
                  <span class="incident-msg">
                    {{ incidentMessage(site.currentIncident) }}
                  </span>
                </span>
              </div>
              <div class="monitor-percent">
                {{ site.percent }}% {{ $t("status.availability") }}
              </div>
            </div>
            <div class="monitor-bars">
              <button
                v-for="day in site.days"
                :key="day.dateText || day.date"
                :class="['bar', getBarStatus(day)]"
                @click="openDay(site, day)"
                @mouseenter="showBarTooltip($event, site, day)"
                @mouseleave="hideBarTooltip"
                @focus="showBarTooltip($event, site, day)"
                @blur="hideBarTooltip"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 事件日历 -->
    <section class="panel">
      <div class="panel-head">
        <h2>{{ $t("status.calendar") }}</h2>
        <div class="month-nav">
          <button
            class="month-btn"
            :disabled="!canPrev"
            :aria-label="$t('status.prevMonth')"
            @click="prevMonth"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <span class="month-label">{{ monthLabel }}</span>
          <button
            class="month-btn"
            :disabled="!canNext"
            :aria-label="$t('status.nextMonth')"
            @click="nextMonth"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
      <div class="panel-body calendar-body">
        <div class="weekdays">
          <span v-for="(weekday, index) in weekdays" :key="index">
            {{ weekday }}
          </span>
        </div>
        <div class="calendar-grid">
          <n-popover
            v-for="cell in calendarCells"
            :key="cell.key"
            trigger="hover"
            placement="bottom-start"
            :disabled="!cell.hasIncident || noHover || dayModal"
            :show-arrow="false"
          >
            <template #trigger>
              <button
                :class="[
                  'calendar-day',
                  {
                    outside: !cell.inMonth,
                    today: cell.isToday,
                    incident: cell.hasIncident,
                    error: cell.severity === 'error',
                    warn: cell.severity === 'warn',
                  },
                ]"
                @click="openCalendarDay(cell)"
              >
                <span class="day-number">{{ cell.day }}</span>
              </button>
            </template>
            <div class="calendar-pop">
              <div class="calendar-pop-date">
                {{ formatFullDate(cell.dateText) }}
              </div>
              <div
                v-for="incident in cell.incidents"
                :key="incident.id || incident.startedAt"
                :class="[
                  'calendar-pop-event',
                  { clickable: Boolean(incident.id) },
                ]"
                @click="openIncidentById(incident.id)"
              >
                <span
                  class="dot"
                  :class="
                    incident.resolvedAt ? 'resolved-incident' : 'ongoing'
                  "
                />
                <div class="calendar-pop-text">
                  <div class="calendar-pop-title-row">
                    <span class="calendar-pop-title">
                      {{
                        getIncidentTitle(incident, $t("card.unknownReason"))
                      }}
                    </span>
                    <span
                      v-for="tag in incident.tags || []"
                      :key="tag.id ?? tag.name"
                      class="tag-pill"
                    >
                      {{ tag.name }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </n-popover>
        </div>
      </div>
    </section>

    <!-- 事件历史 -->
    <div class="history-row">
      <button class="outline-btn" @click="navigate('/history')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M8 2v4M16 2v4M3 9h18" />
        </svg>
        {{ $t("status.viewHistory") }}
      </button>
    </div>

    <!-- 日期详情 -->
    <n-modal
      v-model:show="dayModal"
      preset="card"
      :title="dayModalTitle"
      :style="{ width: 'min(660px, calc(100vw - 32px))' }"
      :content-style="{ maxHeight: '65vh', overflowY: 'auto' }"
    >
      <div v-if="selected" class="modal-summary">
        <div class="summary-head">
          <n-text depth="3">
            {{ selected.siteName || $t("status.allMonitors") }}
          </n-text>
          <template v-if="selected.siteName">
            <span
              v-for="tag in selected.incidents[0]?.tags || []"
              :key="tag.id ?? tag.name"
              class="tag-pill"
            >
              {{ tag.name }}
            </span>
          </template>
        </div>
        <div v-if="selectedSummary.hasData" class="summary-stats">
          <span>
            {{ $t("status.availability") }} {{ selectedSummary.availability }}%
          </span>
          <span>
            {{
              $t("card.failureCount", { count: selectedSummary.count })
            }}
          </span>
          <span>
            {{
              $t("card.totalDuration", {
                duration: formatDuration(selectedSummary.duration),
              })
            }}
          </span>
        </div>
      </div>
      <div v-if="selected && !selected.incidents.length" class="no-incident">
        <StatusIcon
          :type="selectedSummary.hasData ? 'normal' : 'unknown'"
          :size="18"
        />
        <n-text>
          {{
            selectedSummary.hasData
              ? $t("status.dayNoIncident")
              : $t("card.unknownData")
          }}
        </n-text>
      </div>
      <IncidentTimeline
        v-else
        :incidents="selected?.incidents || []"
        :show-monitor="!selected?.siteName"
        clickable
        @select="openIncidentById"
      />
    </n-modal>

    <!-- 监控项详细信息（移动端） -->
    <n-modal
      v-model:show="infoModal"
      preset="card"
      :style="{ width: 'min(460px, calc(100vw - 32px))' }"
      :content-style="{ maxHeight: '70vh', overflowY: 'auto' }"
    >
      <template #header>
        <div class="info-modal-title">
          <span>{{ infoSite?.name || $t("status.type") }}</span>
          <span
            v-for="tag in infoSite?.tags || []"
            :key="tag.id ?? tag.name"
            class="tag-pill"
          >
            {{ tag.name }}
          </span>
        </div>
      </template>
      <MonitorInfo v-if="infoSite" :site="infoSite" :show-tags="false" />
    </n-modal>

    <!-- 立柱悬浮提示 -->
    <Teleport to="body">
      <div
        v-if="hoveredBar"
        class="bar-tooltip"
        :style="tooltipStyle"
        @mouseenter="cancelHideTooltip"
        @mouseleave="scheduleHideTooltip"
      >
        <div class="bar-tooltip-date">
          {{ formatFullDate(hoveredBar.day.dateText) }}
        </div>
        <div v-if="!hoveredBar.day.hasData" class="bar-tooltip-empty">
          {{ $t("card.unknownData") }}
        </div>
        <div
          v-else-if="hoveredBar.day.incidents?.length"
          class="bar-tooltip-events"
        >
          <div
            v-for="incident in hoveredBar.day.incidents || []"
            :key="incident.id || incident.startedAt"
            :class="[
              'bar-tooltip-event',
              { clickable: Boolean(incident.id) },
            ]"
            :role="incident.id ? 'button' : undefined"
            :tabindex="incident.id ? 0 : undefined"
            @click="openIncidentById(incident.id)"
            @keydown.enter="openIncidentById(incident.id)"
          >
            <span
              class="dot"
              :class="incident.resolvedAt ? 'resolved-incident' : 'ongoing'"
            />
            <div class="event-text">
              <span class="event-monitor-row">
                <span class="event-monitor">{{ incident.monitorName }}</span>
                <span
                  v-for="tag in incident.tags || []"
                  :key="tag.id ?? tag.name"
                  class="event-tag"
                >
                  {{ tag.name }}
                </span>
              </span>
              <span class="event-reason">
                <span v-if="incident.cause" class="event-code">
                  {{ incident.cause }}
                </span>
                {{ incidentMessage(incident) }}
              </span>
            </div>
          </div>
        </div>
        <div v-else class="bar-tooltip-empty">
          {{ $t("status.noEvents") }}
        </div>
      </div>
    </Teleport>
  </div>

  <!-- 加载 / 错误 -->
  <div v-else class="status-main site-container">
    <section class="panel loading-panel">
      <n-spin v-if="loading" size="large" />
      <div v-else class="error-state">
        <n-text depth="3">{{ $t("card.errorText") }}</n-text>
        <button class="outline-btn" @click="retry">
          {{ $t("meta.refresh") }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
import dayjs from "dayjs";
import MonitorInfo from "~/components/MonitorInfo.vue";
import { useAppRoute } from "~/composables/useAppRoute";
import { getIncidentMessage, getIncidentTitle } from "~/utils/incident";
import type {
  SiteDaysStatus,
  SiteIncident,
  SiteStatusType,
  SiteType,
} from "~~/types/main";

interface SelectedDay {
  dateText: string;
  incidents: SiteIncident[];
  siteName?: string;
  percent?: number;
  hasData?: boolean;
  duration?: number;
  stats?: {
    percents: number[];
    down: number;
    times: number;
    hasSevere: boolean;
  };
}

const { t, locale } = useI18n();
const statusStore = useStatusStore();
const noHover = useMediaQuery("(hover: none), (max-width: 640px)");

// 数据
const result = computed(() => statusStore.siteData);
const sites = computed(() => result.value?.data ?? []);
const loading = computed(
  () => !result.value && statusStore.siteStatus === "loading",
);

// 监控项状态
const siteStatusMap = computed<Record<number, { text: string; type: SiteType }>>(
  () => ({
    0: { text: t("card.status.stop"), type: "unknown" },
    1: { text: t("card.status.unknown"), type: "unknown" },
    2: { text: t("card.status.normal"), type: "normal" },
    8: { text: t("card.status.error"), type: "warn" },
    9: { text: t("card.status.down"), type: "error" },
  }),
);

const siteStatusType = (site: SiteStatusType): SiteType =>
  siteStatusMap.value[site.status]?.type || "unknown";

const getBarStatus = (day: SiteDaysStatus): SiteType => {
  if (!day.hasData) return "unknown";
  if (day.percent >= 100) return "normal";
  if (day.percent >= 50) return "warn";
  return "error";
};

const { navigate } = useAppRoute();

// 打开故障详情页
const openIncidentById = (id?: string) => {
  if (id) navigate(`/incidents/${encodeURIComponent(id)}`);
};

// 立柱悬浮提示
interface HoveredBar {
  site: SiteStatusType;
  day: SiteDaysStatus;
  x: number;
  top: number;
  bottom: number;
  placeAbove: boolean;
}

const hoveredBar = ref<HoveredBar | null>(null);
let hideTimer: ReturnType<typeof setTimeout> | undefined;

const cancelHideTooltip = () => {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = undefined;
  }
};

const scheduleHideTooltip = () => {
  cancelHideTooltip();
  hideTimer = setTimeout(() => {
    hoveredBar.value = null;
    hideTimer = undefined;
  }, 200);
};

const showBarTooltip = (
  event: Event,
  site: SiteStatusType,
  day: SiteDaysStatus,
) => {
  if (noHover.value) return;
  cancelHideTooltip();
  const target = event.currentTarget as HTMLElement | null;
  if (!target) return;
  const rect = target.getBoundingClientRect();
  hoveredBar.value = {
    site,
    day,
    x: rect.left + rect.width / 2,
    top: rect.top,
    bottom: rect.bottom,
    placeAbove: rect.bottom + 180 > window.innerHeight,
  };
};

const hideBarTooltip = () => {
  scheduleHideTooltip();
};

const tooltipStyle = computed(() => {
  const bar = hoveredBar.value;
  if (!bar) return {};
  const width = Math.min(320, window.innerWidth - 24);
  const half = width / 2;
  const x = Math.min(
    Math.max(bar.x, half + 12),
    window.innerWidth - half - 12,
  );
  return {
    left: `${x}px`,
    top: `${bar.placeAbove ? bar.top - 8 : bar.bottom + 8}px`,
    transform: bar.placeAbove
      ? "translate(-50%, -100%)"
      : "translate(-50%, 0)",
    maxWidth: `${width}px`,
  };
});

const clearHoveredBar = () => {
  cancelHideTooltip();
  hoveredBar.value = null;
};

const incidentMessage = (incident?: SiteIncident) =>
  getIncidentMessage(incident, t("card.unknownReason"));

// 日期文本
const allDateTexts = computed(() =>
  sites.value
    .flatMap((site) => site.days)
    .map((day) => day.dateText)
    .filter((text): text is string => Boolean(text))
    .sort(),
);
const oldestDateText = computed(() => allDateTexts.value[0]);
const latestDateText = computed(
  () => allDateTexts.value[allDateTexts.value.length - 1],
);

const formatFullDate = (dateText?: string) => {
  if (!dateText) return "";
  try {
    return new Intl.DateTimeFormat(locale.value, {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }).format(new Date(`${dateText}T00:00:00`));
  } catch {
    return dateText;
  }
};

const formatMonth = (dateText?: string) => {
  if (!dateText) return "";
  try {
    return new Intl.DateTimeFormat(locale.value, {
      year: "numeric",
      month: "long",
    }).format(new Date(`${dateText}T00:00:00`));
  } catch {
    return dateText.slice(0, 7);
  }
};

const rangeLabel = computed(() => {
  if (!oldestDateText.value || !latestDateText.value) return "";
  const start = formatMonth(oldestDateText.value);
  const end = formatMonth(latestDateText.value);
  return start === end ? start : `${start} - ${end}`;
});

// 按日期汇总故障
const incidentKey = (incident: SiteIncident, fallback = "") =>
  incident.id ??
  `${incident.monitorName || fallback}-${incident.startedAt}-${incident.cause ?? ""}`;

const incidentsByDate = computed(() => {
  const map = new Map<string, SiteIncident[]>();
  sites.value.forEach((site) => {
    site.days.forEach((day) => {
      if (!day.incidents?.length || !day.dateText) return;
      const list = map.get(day.dateText) ?? [];
      const seen = new Set(list.map((incident) => incidentKey(incident)));
      day.incidents.forEach((incident) => {
        const key = incidentKey(incident, site.name);
        if (seen.has(key)) return;
        seen.add(key);
        list.push(incident);
      });
      map.set(day.dateText, list);
    });
  });
  return map;
});

// 按日期汇总统计
const statsByDate = computed(() => {
  const map = new Map<
    string,
    { percents: number[]; down: number; times: number; hasSevere: boolean }
  >();
  sites.value.forEach((site) => {
    site.days.forEach((day) => {
      if (!day.dateText) return;
      const stats = map.get(day.dateText) ?? {
        percents: [],
        down: 0,
        times: 0,
        hasSevere: false,
      };
      if (day.hasData) {
        stats.percents.push(day.percent);
        if (day.percent < 50) stats.hasSevere = true;
      }
      stats.down += day.down?.duration ?? 0;
      stats.times += day.down?.times ?? 0;
      map.set(day.dateText, stats);
    });
  });
  return map;
});

// 日历
const calendarMonth = ref<dayjs.Dayjs | null>(null);
const currentMonth = computed(() => {
  if (calendarMonth.value) return calendarMonth.value;
  const base = latestDateText.value || dayjs().format("YYYY-MM-DD");
  return dayjs(base).startOf("month");
});
const minMonth = computed(() => {
  const base = oldestDateText.value || latestDateText.value;
  return base ? dayjs(base).startOf("month") : currentMonth.value;
});
const maxMonth = computed(() => {
  const base = latestDateText.value || oldestDateText.value;
  return base ? dayjs(base).startOf("month") : currentMonth.value;
});
const canPrev = computed(
  () => currentMonth.value.format("YYYY-MM") > minMonth.value.format("YYYY-MM"),
);
const canNext = computed(
  () => currentMonth.value.format("YYYY-MM") < maxMonth.value.format("YYYY-MM"),
);
const prevMonth = () => {
  if (canPrev.value) {
    calendarMonth.value = currentMonth.value
      .subtract(1, "month")
      .startOf("month");
  }
};
const nextMonth = () => {
  if (canNext.value) {
    calendarMonth.value = currentMonth.value.add(1, "month").startOf("month");
  }
};
const monthLabel = computed(() =>
  formatMonth(currentMonth.value.format("YYYY-MM-DD")),
);

const weekdays = computed(() => {
  try {
    const formatter = new Intl.DateTimeFormat(locale.value, {
      weekday: "narrow",
    });
    return Array.from({ length: 7 }, (_, index) =>
      formatter.format(new Date(2023, 0, 2 + index)),
    );
  } catch {
    return ["一", "二", "三", "四", "五", "六", "日"];
  }
});

const calendarCells = computed(() => {
  const month = currentMonth.value;
  const startOffset = (month.day() + 6) % 7;
  const gridStart = month.subtract(startOffset, "day");
  return Array.from({ length: 42 }, (_, index) => {
    const date = gridStart.add(index, "day");
    const dateText = date.format("YYYY-MM-DD");
    const incidents = incidentsByDate.value.get(dateText) ?? [];
    const stats = statsByDate.value.get(dateText);
    const hasIncident = incidents.length > 0;
    return {
      key: dateText,
      dateText,
      day: date.date(),
      inMonth: date.format("YYYY-MM") === month.format("YYYY-MM"),
      isToday: dateText === latestDateText.value,
      incidents,
      hasIncident,
      severity: hasIncident
        ? stats?.hasSevere
          ? "error"
          : "warn"
        : undefined,
    };
  });
});

// 弹窗
const dayModal = ref(false);
const selected = ref<SelectedDay>();
const infoModal = ref(false);
const infoSite = ref<SiteStatusType | null>(null);

const openInfo = (site: SiteStatusType) => {
  infoSite.value = site;
  infoModal.value = true;
};

const dayModalTitle = computed(() => formatFullDate(selected.value?.dateText));

const openDay = (site: SiteStatusType, day: SiteDaysStatus) => {
  if (!day.dateText) return;
  clearHoveredBar();
  selected.value = {
    dateText: day.dateText,
    incidents: day.incidents ?? [],
    siteName: site.name,
    percent: day.percent,
    hasData: day.hasData,
    duration: day.down?.duration ?? 0,
  };
  dayModal.value = true;
};

const openCalendarDay = (cell: {
  dateText: string;
  incidents: SiteIncident[];
}) => {
  clearHoveredBar();
  selected.value = {
    dateText: cell.dateText,
    incidents: cell.incidents,
    stats: statsByDate.value.get(cell.dateText),
  };
  dayModal.value = true;
};

const selectedSummary = computed(() => {
  const value = selected.value;
  if (!value) return { availability: 0, duration: 0, count: 0, hasData: false };
  const stats = value.stats;
  const percents = stats?.percents ?? [];
  const availability =
    value.percent ??
    (percents.length
      ? percents.reduce((sum, percent) => sum + percent, 0) / percents.length
      : 0);
  return {
    availability: formatNumber(availability),
    duration: value.duration ?? stats?.down ?? 0,
    count: value.incidents.length,
    hasData:
      value.percent !== undefined
        ? value.hasData !== false
        : percents.length > 0,
  };
});

// 重试
const retry = async () => {
  await getSiteData();
};

onMounted(getSiteData);

onMounted(() => {
  window.addEventListener("scroll", clearHoveredBar, true);
  window.addEventListener("resize", clearHoveredBar);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", clearHoveredBar, true);
  window.removeEventListener("resize", clearHoveredBar);
  clearHoveredBar();
});
</script>

<style lang="scss" scoped>
.status-main {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-top: 24px;
  padding-bottom: 24px;
  > .panel,
  > .history-row {
    animation: panel-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  > .panel:nth-of-type(2) {
    animation-delay: 0.06s;
  }
  > .history-row {
    animation-delay: 0.12s;
  }
}
.panel {
  padding: 4px;
  border-radius: 12px;
  background: var(--panel-bg);
  overflow: hidden;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  h2 {
    font-size: 16px;
    font-weight: 500;
    color: var(--text-color);
  }
  .panel-range {
    font-size: 14px;
    color: var(--muted-text);
    white-space: nowrap;
  }
}
.panel-body {
  border-radius: 8px;
  background: var(--panel-inner-bg);
  overflow: hidden;
}
.monitor-list {
  .monitor + .monitor {
    border-top: 1px solid var(--border-color);
  }
}
.monitor {
  padding: 16px;
}
.monitor-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.monitor-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
  .monitor-name {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color);
  }
}
.monitor-percent {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--muted-text);
  white-space: nowrap;
}
.info-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: none;
  color: var(--muted-text);
  cursor: pointer;
  svg {
    width: 14px;
    height: 14px;
  }
  &:hover {
    color: var(--text-color);
  }
}
.tag-pill {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  color: var(--muted-text);
  font-size: 11px;
  line-height: 18px;
  white-space: nowrap;
}
.current-incident {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  .incident-code,
  .incident-msg {
    display: inline-flex;
    align-items: center;
    padding: 1px 7px;
    border-radius: 999px;
    font-size: 11px;
    line-height: 18px;
  }
  .incident-code {
    background: rgba(239, 68, 68, 0.15);
    color: var(--error-color);
    font-weight: 600;
  }
  .incident-msg {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: var(--error-color);
  }
}
.monitor-bars {
  display: flex;
  gap: 2px;
  height: 16px;
  margin-top: 12px;
}
.bar {
  flex: 1;
  min-width: 2px;
  height: 16px;
  padding: 0;
  border: 0;
  border-radius: 2px;
  background: var(--bar-empty);
  cursor: pointer;
  transition:
    filter 0.15s,
    transform 0.15s;
  &:hover {
    filter: brightness(1.25);
    transform: scaleY(1.08);
  }
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
    background: var(--bar-empty);
  }
}
.month-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  .month-label {
    font-size: 14px;
    color: var(--muted-text);
    white-space: nowrap;
  }
}
.month-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--muted-text);
  cursor: pointer;
  svg {
    width: 16px;
    height: 16px;
  }
  &:hover:not(:disabled) {
    background: var(--hover-bg);
    color: var(--text-color);
  }
  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
}
.calendar-body {
  padding: 12px 12px 8px;
}
.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding-bottom: 12px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
  span {
    text-align: center;
    font-size: 12px;
    color: var(--muted-text);
  }
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 4px;
}
.calendar-day {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  transition: background-color 0.15s;
  &:hover {
    background: var(--hover-bg);
  }
  .day-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 999px;
    font-size: 14px;
    color: var(--text-color);
    transition:
      background-color 0.15s,
      box-shadow 0.15s;
  }
  &.outside .day-number {
    color: var(--muted-text);
    opacity: 0.5;
  }
  &.today .day-number {
    box-shadow: inset 0 0 0 1px var(--border-strong);
  }
  &.incident.warn .day-number {
    box-shadow: inset 0 0 0 1px var(--warn-color);
    color: var(--warn-color);
  }
  &.incident.error .day-number {
    box-shadow: inset 0 0 0 1px var(--error-color);
    color: var(--error-color);
  }
}
.calendar-pop {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 240px;
  max-width: 320px;
  .calendar-pop-date {
    font-size: 14px;
    line-height: 20px;
    color: var(--text-color);
  }
  .calendar-pop-event {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 6px;
    margin: 0 -6px;
    border-radius: 6px;
    .dot {
      flex-shrink: 0;
      width: 8px;
      height: 8px;
      margin-top: 7px;
      border-radius: 50%;
      &.resolved-incident {
        background: var(--warn-color);
      }
      &.ongoing {
        background: var(--error-color);
      }
    }
    &.clickable {
      cursor: pointer;
      transition: background-color 0.15s;
      &:hover {
        background: var(--hover-bg);
      }
    }
  }
  .calendar-pop-text {
    min-width: 0;
  }
  .calendar-pop-title-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
  }
  .calendar-pop-title {
    font-size: 14px;
    line-height: 1.5;
    color: var(--text-color);
  }
}
.history-row {
  display: flex;
  justify-content: center;
}
.outline-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 36px;
  padding: 0 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--button-bg);
  color: var(--text-color);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s;
  svg {
    width: 16px;
    height: 16px;
  }
  &:hover {
    background: var(--hover-bg);
    border-color: var(--border-strong);
  }
}
.info-modal-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
}
.modal-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  .summary-head {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 13px;
  }
  .summary-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    font-size: 12px;
    color: var(--muted-text);
  }
}
.no-incident {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 13px;
}
.loading-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  padding: 40px;
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
}
.bar-tooltip {
  position: fixed;
  z-index: 3000;
  width: min(320px, calc(100vw - 24px));
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--tooltip-bg);
  box-shadow: 0 8px 24px var(--tooltip-shadow);
  pointer-events: auto;
  .bar-tooltip-date {
    font-size: 14px;
    line-height: 20px;
    color: var(--text-color);
  }
  .bar-tooltip-empty {
    margin-top: 4px;
    font-size: 12px;
    color: var(--muted-text);
  }
  .bar-tooltip-events {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 6px;
  }
  .bar-tooltip-event {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 4px 6px;
    margin: 0 -6px;
    border-radius: 6px;
    font-size: 12px;
    line-height: 1.6;
    .dot {
      flex-shrink: 0;
      width: 6px;
      height: 6px;
      margin-top: 6px;
      border-radius: 50%;
      &.resolved-incident {
        background: var(--warn-color);
      }
      &.ongoing {
        background: var(--error-color);
      }
    }
    &.clickable {
      cursor: pointer;
      transition: background-color 0.15s;
      &:hover {
        background: var(--hover-bg);
      }
    }
    .event-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .event-monitor-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
    }
    .event-monitor {
      color: var(--muted-text);
    }
    .event-reason {
      color: var(--text-color);
      word-break: break-word;
    }
    .event-code {
      margin-right: 2px;
      font-weight: 600;
    }
    .event-tag {
      padding: 1px 6px;
      border: 1px solid var(--border-color);
      border-radius: 999px;
      color: var(--muted-text);
      font-size: 11px;
      line-height: 18px;
      white-space: nowrap;
    }
  }
}
@media (max-width: 640px) {
  .monitor-bars {
    display: none;
  }
  .monitor-main {
    align-items: flex-start;
  }
  .monitor-percent {
    font-size: 12px;
  }
}
</style>
