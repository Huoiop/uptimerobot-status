/**
 * 监控项类型展示信息
 * @param t i18n translate function
 */
export const getSiteTypeMap = (
  t: (key: string) => string,
): Record<string, { tag: string; text: string }> => ({
  HTTP: { tag: "HTTP", text: t("card.type.HTTP") },
  KEYWORD: { tag: "KEYWORD", text: t("card.type.KEYWORD") },
  PING: { tag: "PING", text: t("card.type.PING") },
  PORT: { tag: "PORT", text: t("card.type.PORT") },
  HEARTBEAT: { tag: "HEARTBEAT", text: t("card.type.HEARTBEAT") },
  DNS: { tag: "DNS", text: t("card.type.DNS") },
  API: { tag: "API", text: t("card.type.API") },
  UDP: { tag: "UDP", text: t("card.type.UDP") },
  VISUAL_COMPARISON: {
    tag: "VISUAL",
    text: t("card.type.VISUAL_COMPARISON"),
  },
  THIRD_PARTY_SERVICE: {
    tag: "3RD-PARTY",
    text: t("card.type.THIRD_PARTY_SERVICE"),
  },
});
