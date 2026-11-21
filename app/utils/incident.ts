import type { SiteIncident } from "~~/types/main";

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
