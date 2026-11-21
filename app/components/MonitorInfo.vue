<!-- 监控项详细信息 -->
<template>
  <div class="info-pop">
    <div class="info-row">
      <span>{{ $t("status.type") }}</span>
      <span>{{ typeMap[site.type]?.tag || site.type }}</span>
    </div>
    <div class="info-row">
      <span>{{ $t("status.interval") }}</span>
      <span>{{ formatInterval(site.interval) }}</span>
    </div>
    <div class="info-row">
      <span>{{ $t("status.availability") }}</span>
      <span>{{ site.percent }}%</span>
    </div>
    <div v-if="showTags && site.tags.length" class="info-tags">
      <span
        v-for="tag in site.tags"
        :key="tag.id ?? tag.name"
        class="tag-pill"
      >
        {{ tag.name }}
      </span>
    </div>
    <div v-if="lastIncident" class="info-last">
      <div class="info-label">
        {{ $t("status.lastIncident") }}
      </div>
      <div>
        {{ formatTime(lastIncident.startedAt, { showTime: true }) }}
        · {{ incidentMessage(lastIncident) }}
      </div>
    </div>
    <div v-if="typeMap[site.type]?.text" class="info-desc">
      {{ typeMap[site.type]?.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { getIncidentMessage, getLastIncident } from "~/utils/incident";
import { getSiteTypeMap } from "~/utils/siteType";
import type { SiteIncident, SiteStatusType } from "~~/types/main";

const props = withDefaults(
  defineProps<{
    site: SiteStatusType;
    showTags?: boolean;
  }>(),
  {
    showTags: true,
  },
);

const { t } = useI18n();

const typeMap = computed(() => getSiteTypeMap(t));
const lastIncident = computed(() => getLastIncident(props.site));

const incidentMessage = (incident?: SiteIncident) =>
  getIncidentMessage(incident, t("card.unknownReason"));
</script>

<style lang="scss" scoped>
.info-pop {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 260px;
  max-width: calc(100vw - 48px);
  font-size: 12px;
  .info-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    span:first-child {
      color: var(--muted-text);
    }
  }
  .info-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
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
  .info-last {
    padding-top: 6px;
    border-top: 1px solid var(--border-color);
    line-height: 1.6;
  }
  .info-label {
    color: var(--muted-text);
  }
  .info-desc {
    padding-top: 6px;
    border-top: 1px solid var(--border-color);
    color: var(--muted-text);
    line-height: 1.6;
  }
}
</style>
