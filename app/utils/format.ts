import dayjs from "dayjs";
import { formatNumber } from "./helper";
import type {
  MonitorsDataResult,
  SiteDaysStatus,
  SiteIncident,
  SiteStatusType,
  SiteTag,
  UptimeRobotV3Incident,
  UptimeRobotV3Monitor,
} from "~~/types/main";

// UptimeRobot v3 状态 -> 站点状态
const statusMap: Record<string, SiteStatusType["status"]> = {
  PAUSED: 0,
  STARTED: 1,
  UP: 2,
  LOOKS_DOWN: 8,
  DOWN: 9,
};

// 处理标签，兼容标签对象与纯字符串
const formatTags = (tags: (SiteTag | string)[] | undefined): SiteTag[] => {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag): SiteTag | undefined => {
      if (typeof tag === "string") return { name: tag };
      return tag?.name
        ? { id: tag.id, name: tag.name, color: tag.color }
        : undefined;
    })
    .filter((tag): tag is SiteTag => Boolean(tag?.name));
};

// 处理单次故障
const formatIncident = (
  incident: UptimeRobotV3Incident,
  nowUnix: number,
): SiteIncident | undefined => {
  const started = incident.startedAt ? dayjs(incident.startedAt) : undefined;
  if (!started?.isValid()) return undefined;
  const resolved = incident.resolvedAt ? dayjs(incident.resolvedAt) : undefined;
  const startedAt = started.unix();
  const resolvedAt = resolved?.isValid() ? resolved.unix() : undefined;
  return {
    id: incident.id,
    status: incident.status,
    cause: incident.cause,
    reason: incident.reason?.trim() || undefined,
    startedAt,
    resolvedAt,
    duration: Math.max(0, (resolvedAt ?? nowUnix) - startedAt),
  };
};

/**
 * Format site data.
 * @param monitors The UptimeRobot v3 monitors.
 * @param incidents The UptimeRobot v3 incidents.
 * @param dates The date range to format.
 * @returns The formatted site data.
 */
export const formatSiteData = (
  monitors: UptimeRobotV3Monitor[] | undefined,
  incidents: UptimeRobotV3Incident[] | undefined,
  dates: dayjs.Dayjs[],
): MonitorsDataResult | undefined => {
  if (!monitors) return undefined;
  const { public: configPublic } = useRuntimeConfig();
  const { showLink } = configPublic;
  // 按监控项分组停机事件
  const incidentsByMonitor = new Map<number, UptimeRobotV3Incident[]>();
  incidents?.forEach((incident) => {
    const monitorId = incident?.monitor?.id;
    if (incident?.type !== "Downtime" || monitorId === undefined) return;
    const list = incidentsByMonitor.get(monitorId);
    if (list) list.push(incident);
    else incidentsByMonitor.set(monitorId, [incident]);
  });
  const now = dayjs();
  const nowUnix = now.unix();
  const monitorNames = new Map(
    monitors.map((monitor) => [
      monitor.id,
      monitor.friendlyName || "未命名站点",
    ]),
  );
  const monitorTags = new Map(
    monitors.map((monitor) => [monitor.id, formatTags(monitor.tags)]),
  );
  // 当前进行中的故障
  const ongoingIncidents = new Map<number, SiteIncident>();
  incidents?.forEach((incident) => {
    const monitorId = incident?.monitor?.id;
    if (incident?.type !== "Downtime" || monitorId === undefined) return;
    if (incident.status !== "Ongoing" && incident.resolvedAt) return;
    if (ongoingIncidents.has(monitorId)) return;
    const item = formatIncident(incident, nowUnix);
    if (item) {
      item.monitorName = monitorNames.get(monitorId);
      item.tags = monitorTags.get(monitorId) ?? [];
      ongoingIncidents.set(monitorId, item);
    }
  });
  // 每日时间范围（最新的一天在前）
  const dayList = dates.map((date) => ({
    start: date.unix(),
    end: date.add(1, "day").unix(),
  }));
  const dayIndex = new Map(dayList.map((day, index) => [day.start, index]));
  const rangeStartMs = (dayList[dayList.length - 1]?.start ?? 0) * 1000;
  const rangeEndMs = (dayList[0]?.end ?? 0) * 1000;

  // 解析站点数据
  const formatData = monitors.map((site): SiteStatusType => {
    const created = site.createDateTime ? dayjs(site.createDateTime) : undefined;
    const createdUnix = created?.isValid() ? created.unix() : 0;
    const siteTags = formatTags(site?.tags);
    const downtime = dayList.map(() => ({
      ms: 0,
      times: 0,
      incidents: [] as SiteIncident[],
    }));
    // 将停机事件按天拆分（v3 没有 custom_uptime_ranges，只能根据 incidents 计算）
    incidentsByMonitor.get(site.id)?.forEach((incident) => {
      const started = incident.startedAt ? dayjs(incident.startedAt) : undefined;
      if (!started?.isValid()) return;
      const incidentData = formatIncident(incident, nowUnix);
      if (incidentData) {
        incidentData.monitorName = site.friendlyName || "未命名站点";
        incidentData.tags = siteTags;
      }
      const startMs = Math.max(started.valueOf(), rangeStartMs);
      const endMs = Math.min(
        incident.resolvedAt ? dayjs(incident.resolvedAt).valueOf() : now.valueOf(),
        rangeEndMs,
      );
      if (!Number.isFinite(endMs) || endMs <= startMs) return;
      // 从事件开始的那一天遍历到事件结束
      for (
        let day = dayjs.unix(Math.floor(startMs / 1000)).startOf("day");
        day.valueOf() < endMs;
        day = day.add(1, "day")
      ) {
        const index = dayIndex.get(day.unix());
        const currentDay = index === undefined ? undefined : dayList[index];
        const currentDowntime = index === undefined ? undefined : downtime[index];
        if (!currentDay || !currentDowntime) continue;
        const dayStartMs = currentDay.start * 1000;
        const dayEndMs = currentDay.end * 1000;
        const overlapStart = Math.max(startMs, dayStartMs);
        const overlapEnd = Math.min(endMs, dayEndMs);
        if (overlapEnd <= overlapStart) continue;
        currentDowntime.ms += overlapEnd - overlapStart;
        // 记录当日故障明细
        if (incidentData) currentDowntime.incidents.push(incidentData);
        // 故障次数按事件开始日期统计
        if (started.valueOf() >= dayStartMs && started.valueOf() < dayEndMs) {
          currentDowntime.times += 1;
        }
      }
    });

    // 解析每日数据
    const dailyData: SiteDaysStatus[] = dayList.map((day, index) => {
      // 监控项创建前 / 未来的日期无数据
      const activeStart = Math.max(day.start, createdUnix);
      const activeEnd = Math.min(day.end, nowUnix);
      const activeSeconds = Math.max(0, activeEnd - activeStart);
      const duration =
        activeSeconds > 0
          ? Math.min(
              Math.round((downtime[index]?.ms ?? 0) / 1000),
              Math.floor(activeSeconds),
            )
          : 0;
      return {
        date: day.start,
        dateText: dayjs.unix(day.start).format("YYYY-MM-DD"),
        hasData: activeSeconds > 0,
        percent:
          activeSeconds > 0
            ? formatNumber(((activeSeconds - duration) / activeSeconds) * 100)
            : 0,
        down: {
          times: activeSeconds > 0 ? (downtime[index]?.times ?? 0) : 0,
          duration,
        },
        incidents:
          activeSeconds > 0 && downtime[index]?.incidents.length
            ? [...(downtime[index]?.incidents ?? [])].sort(
                (a, b) => b.startedAt - a.startedAt,
              )
            : undefined,
      };
    });

    // 获取总数据
    const total = { times: 0, duration: 0 };
    let totalActive = 0;
    dayList.forEach((day, index) => {
      const activeStart = Math.max(day.start, createdUnix);
      const activeEnd = Math.min(day.end, nowUnix);
      const activeSeconds = Math.max(0, activeEnd - activeStart);
      if (activeSeconds <= 0) return;
      totalActive += activeSeconds;
      total.duration += Math.min(
        Math.round((downtime[index]?.ms ?? 0) / 1000),
        Math.floor(activeSeconds),
      );
      total.times += downtime[index]?.times ?? 0;
    });
    const percent =
      totalActive > 0
        ? formatNumber(
            Math.max(0, ((totalActive - total.duration) / totalActive) * 100),
          )
        : 0;

    // 当前进行中的故障（优先 incidents，缺失时回退到 lastIncident）
    let currentIncident = ongoingIncidents.get(site.id);
    const lastIncident = site.lastIncident;
    if (
      !currentIncident &&
      lastIncident?.status === "Ongoing" &&
      lastIncident.startedAt
    ) {
      const started = dayjs(lastIncident.startedAt);
      if (started.isValid()) {
        currentIncident = {
          id: lastIncident.id,
          status: lastIncident.status,
          cause: lastIncident.cause,
          reason: lastIncident.reason?.trim() || undefined,
          monitorName: site.friendlyName || "未命名站点",
          tags: siteTags,
          startedAt: started.unix(),
          duration: Math.max(0, nowUnix - started.unix()),
        };
      }
    }

    return {
      id: site.id,
      name: site?.friendlyName || "未命名站点",
      url: showLink ? (site?.url ?? undefined) : undefined,
      status: statusMap[site?.status ?? ""] ?? 8,
      type: site?.type || "HTTP",
      interval: site?.interval ?? 0,
      tags: formatTags(site?.tags),
      percent,
      days: dailyData.reverse(),
      currentIncident,
      down: total,
    };
  });
  return {
    status: formatData.reduce(
      (acc, site) => {
        if (site.status === 2) acc.ok++;
        else if (site.status === 8 || site.status === 9) acc.error++;
        else if (site.status === 0 || site.status === 1) acc.unknown++;
        return acc;
      },
      { count: formatData.length, ok: 0, error: 0, unknown: 0 },
    ),
    data: formatData,
    timestamp: Date.now(),
  };
};
