/**
 * Jump to a link.
 * @param url The link to jump to. Empty values are ignored.
 */
export const jumpLink = (url?: string) => {
  if (url) window.open(url, "_blank");
};

/**
 * Format a number.
 * @param num The number to format.
 * @returns The formatted number.
 */
export const formatNumber = (num: number) => Math.floor(num * 100) / 100;

/**
 * Sleep for a certain amount of time.
 * @param ms The amount of time to sleep in milliseconds.
 */
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Get site data.
 */
export const getSiteData = async () => {
  const statusStore = useStatusStore();
  try {
    // 已有数据时不切换 loading，避免刷新导致页面闪烁
    if (!statusStore.siteData) statusStore.siteStatus = "loading";
    const result = await $fetch("/api/getMonitors", { method: "POST" });
    if (result.code !== 200 || !result.data) {
      throw new Error("Error to get site data");
    }
    // 更改数据
    const { status } = result.data;
    statusStore.$patch({
      siteData: result.data,
      siteStatus:
        status.error > 0
          ? status.ok > 0
            ? "warn"
            : "error"
          : status.ok > 0
            ? "normal"
            : "unknown",
    });
  } catch (error) {
    console.error("error to get site data", error);
    if (!statusStore.siteData) statusStore.siteStatus = "unknown";
    window.$message.error("站点数据获取失败，请重试");
  }
};
