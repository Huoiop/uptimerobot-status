<!-- 历史事件页 -->
<template>
  <div class="history-page site-container">
    <button class="back-link" @click="navigate('/')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m15 18-6-6 6-6" />
      </svg>
      {{ $t("status.backToStatus", { site: siteTitle }) }}
    </button>

    <div class="history-header">
      <h1>{{ $t("status.historyTitle") }}</h1>
      <div class="month-nav">
        <button
          class="month-btn"
          :disabled="!canPrev"
          :aria-label="$t('status.prevMonth')"
          @click="scrollMonth(1)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <span class="range">{{ rangeLabel }}</span>
        <button
          class="month-btn"
          :disabled="!canNext"
          :aria-label="$t('status.nextMonth')"
          @click="scrollMonth(-1)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>

    <template v-if="groups.length">
      <section
        v-for="group in groups"
        :id="`history-month-${group.key}`"
        :key="group.key"
        class="history-month"
      >
        <div class="month-head">
          <h2>{{ group.label }}</h2>
          <span>
            {{ $t("status.incidentsCount", { count: group.count }) }}
          </span>
        </div>
        <div class="month-events">
          <div
            v-for="date in group.dates"
            :key="date.key"
            class="history-card"
          >
            <div class="history-date">{{ date.label }}</div>
            <div class="history-event-list">
              <button
                v-for="item in date.items"
                :key="item.incident.id || item.incident.startedAt"
                type="button"
                class="history-event"
                @click="openIncident(item.incident.id)"
              >
                <div class="event-main">
                  <div class="event-title-row">
                    <span
                      class="dot"
                      :class="item.ongoing ? 'ongoing' : 'resolved-incident'"
                    />
                    <div class="event-title-wrap">
                      <span class="event-title">{{ item.title }}</span>
                      <span
                        v-for="tag in item.incident.tags || []"
                        :key="tag.id ?? tag.name"
                        class="tag-pill"
                      >
                        {{ tag.name }}
                      </span>
                    </div>
                  </div>
                  <div class="event-sub">
                    <span>{{ item.statusText }}</span>
                    <span class="sep">·</span>
                    <span>{{ item.durationText }}</span>
                    <span class="sep">·</span>
                    <span>
                      {{
                        $t("status.affectedMonitor", {
                          monitor: item.incident.monitorName,
                        })
                      }}
                    </span>
                  </div>
                </div>
                <svg
                  class="chevron"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </template>

    <div v-else-if="loading" class="history-empty">
      <n-spin size="large" />
    </div>
    <div v-else class="history-empty">
      <n-text depth="3">{{ $t("status.emptyHistory") }}</n-text>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { useAppRoute } from "~/composables/useAppRoute";
import { getIncidentTitle } from "~/utils/incident";
import type { SiteIncident } from "~~/types/main";

interface HistoryItem {
  incident: SiteIncident;
  dateLabel: string;
  title: string;
  statusText: string;
  durationText: string;
  ongoing: boolean;
}

interface HistoryDateGroup {
  key: string;
  label: string;
  items: HistoryItem[];
}

interface HistoryGroup {
  key: string;
  label: string;
  count: number;
  dates: HistoryDateGroup[];
}

const { t, locale } = useI18n();
const statusStore = useStatusStore();
const { navigate } = useAppRoute();
const { siteTitle } = useRuntimeConfig().public;

const loading = ref(!statusStore.siteData);

const allIncidents = computed(() => {
  const map = new Map<string, SiteIncident>();
  statusStore.siteData?.data?.forEach((site) => {
    site.days.forEach((day) => {
      day.incidents?.forEach((incident) => {
        const key =
          incident.id ??
          `${incident.monitorName || site.name}-${incident.startedAt}`;
        if (!map.has(key)) map.set(key, incident);
      });
    });
  });
  return [...map.values()].sort((a, b) => b.startedAt - a.startedAt);
});

const formatMonthKey = (key: string) => {
  try {
    return new Intl.DateTimeFormat(locale.value, {
      year: "numeric",
      month: "long",
    }).format(new Date(`${key}-01T00:00:00`));
  } catch {
    return key;
  }
};

const formatDateLabel = (time: number) => {
  const date = new Date(time * 1000);
  try {
    const datePart = new Intl.DateTimeFormat(locale.value, {
      month: "long",
      day: "numeric",
    }).format(date);
    const weekday = new Intl.DateTimeFormat(locale.value, {
      weekday: "short",
    }).format(date);
    return `${datePart} ${weekday}`;
  } catch {
    return formatTime(time);
  }
};

const groups = computed<HistoryGroup[]>(() => {
  const monthMap = new Map<string, Map<string, HistoryItem[]>>();
  allIncidents.value.forEach((incident) => {
    const date = dayjs(incident.startedAt * 1000);
    const monthKey = date.format("YYYY-MM");
    const dateKey = date.format("YYYY-MM-DD");
    const duration = incident.resolvedAt
      ? incident.duration
      : Math.max(0, Math.floor(Date.now() / 1000) - incident.startedAt);
    const item: HistoryItem = {
      incident,
      dateLabel: formatDateLabel(incident.startedAt),
      title: getIncidentTitle(incident, t("card.unknownReason")),
      statusText: incident.resolvedAt
        ? t("card.resolved")
        : t("card.investigating"),
      durationText: incident.resolvedAt
        ? t("status.lasted", { duration: formatDuration(duration) })
        : t("status.ongoingFor", { duration: formatDuration(duration) }),
      ongoing: !incident.resolvedAt,
    };
    let dateMap = monthMap.get(monthKey);
    if (!dateMap) {
      dateMap = new Map<string, HistoryItem[]>();
      monthMap.set(monthKey, dateMap);
    }
    const list = dateMap.get(dateKey) ?? [];
    list.push(item);
    dateMap.set(dateKey, list);
  });
  return [...monthMap.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([monthKey, dateMap]) => {
      const dates = [...dateMap.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([dateKey, items]) => ({
          key: dateKey,
          label:
            items[0]?.dateLabel ||
            formatDateLabel(
              new Date(`${dateKey}T00:00:00`).getTime() / 1000,
            ),
          items,
        }));
      return {
        key: monthKey,
        label: formatMonthKey(monthKey),
        count: dates.reduce((sum, date) => sum + date.items.length, 0),
        dates,
      };
    });
});

const rangeLabel = computed(() => {
  const list = groups.value;
  if (!list.length) return "";
  const newest = list[0]!.key;
  const oldest = list[list.length - 1]!.key;
  return `${formatMonthKey(oldest)} - ${formatMonthKey(newest)}`;
});

const activeIndex = ref(0);
const canPrev = computed(() => activeIndex.value < groups.value.length - 1);
const canNext = computed(() => activeIndex.value > 0);

const scrollMonth = (delta: number) => {
  const next = Math.min(
    Math.max(activeIndex.value + delta, 0),
    groups.value.length - 1,
  );
  activeIndex.value = next;
  const group = groups.value[next];
  if (!group) return;
  document
    .getElementById(`history-month-${group.key}`)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const openIncident = (id?: string) => {
  if (id) navigate(`/incidents/${encodeURIComponent(id)}`);
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
.history-page {
  padding-top: 24px;
  padding-bottom: 40px;
  animation: page-in 0.35s ease both;
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
.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 28px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
  h1 {
    font-size: 18px;
    font-weight: 500;
    color: var(--text-color);
  }
}
.month-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  .range {
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
.history-month {
  margin-top: 32px;
  scroll-margin-top: 24px;
  animation: panel-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
  &:nth-of-type(2) {
    animation-delay: 0.06s;
  }
  &:nth-of-type(3) {
    animation-delay: 0.12s;
  }
}
.month-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  h2 {
    font-size: 16px;
    font-weight: 500;
    color: var(--text-color);
  }
  span {
    font-size: 14px;
    color: var(--muted-text);
  }
}
.month-events {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.history-event-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.history-card {
  padding: 4px;
  border-radius: 12px;
  background: var(--panel-bg);
}
.history-date {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}
.history-event {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 16px;
  border: 0;
  border-radius: 8px;
  background: var(--panel-inner-bg);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s;
  &:hover {
    background: var(--hover-bg);
  }
}
.event-main {
  flex: 1;
  min-width: 0;
}
.event-title-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  .dot {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    margin-top: 8px;
    border-radius: 50%;
    &.resolved-incident {
      background: var(--warn-color);
    }
    &.ongoing {
      background: var(--error-color);
    }
  }
  .event-title-wrap {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    min-width: 0;
  }
  .event-title {
    font-size: 16px;
    font-weight: 500;
    line-height: 1.5;
    color: var(--text-color);
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
}
.event-sub {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
  padding-left: 16px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--muted-text);
  .sep {
    opacity: 0.6;
  }
}
.chevron {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: var(--muted-text);
}
.history-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  margin-top: 24px;
  padding: 40px;
  border-radius: 12px;
  background: var(--panel-bg);
}
@media (max-width: 640px) {
  .history-header {
    flex-wrap: wrap;
  }
  .event-title {
    font-size: 14px;
  }
}
</style>
