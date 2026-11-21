import type { SiteIncident, SiteStatusType } from "~~/types/main";

/**
 * 故障信息，去掉与错误码重复的前缀。
 * @param incident The incident to format.
 * @param fallback Text to use when the incident has no reason.
 */
export const getIncidentMessage = (
  incident?: SiteIncident,
  fallback = "",
): string => {
  if (!incident) return "";
  const reason = incident.reason?.trim();
  if (!reason) return fallback;
  if (incident.cause !== undefined && incident.cause !== null) {
    const code = String(incident.cause);
    if (reason.startsWith(code)) {
      return (
        reason
          .slice(code.length)
          .replace(/^[\s:：-]+/, "")
          .trim() || reason
      );
    }
  }
  return reason;
};

/**
 * 获取监控项最近一次故障
 */
export const getLastIncident = (
  site?: SiteStatusType,
): SiteIncident | undefined => {
  if (!site) return undefined;
  let last: SiteIncident | undefined;
  site.days.forEach((day) => {
    day.incidents?.forEach((incident) => {
      if (!last || incident.startedAt > last.startedAt) last = incident;
    });
  });
  return last;
};

/**
 * 故障标题：监控项（错误信息）
 */
export const getIncidentTitle = (
  incident?: SiteIncident,
  fallback = "",
): string => {
  if (!incident) return "";
  const name = incident.monitorName || "";
  const message = getIncidentMessage(incident, fallback);
  return message ? `${name}（${message}）` : name;
};
