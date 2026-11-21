// https://uptimerobot.com/api/v3/
import dayjs from "dayjs";
import type {
  MonitorsDataResult,
  MonitorsResult,
  UptimeRobotV3Incident,
  UptimeRobotV3Monitor,
} from "~~/types/main";
import { getCache, setCache } from "~/utils/cache-server";
import { formatSiteData } from "~/utils/format";

interface V3Page<T> {
  data?: T[];
  nextLink?: string | null;
}

// 停机事件额外向前多取几天，避免跨统计范围起点的长事件丢失
const INCIDENT_BUFFER_SECONDS = 7 * 24 * 60 * 60;

const getApiBase = (apiUrl: string) =>
  apiUrl.endsWith("/") ? apiUrl : `${apiUrl}/`;

/**
 * 分页请求 v3 接口
 */
const fetchPages = async <T>(
  apiBase: string,
  apiKey: string,
  path: string,
  params: Record<string, string>,
): Promise<T[]> => {
  const items: T[] = [];
  const query = new URLSearchParams(params);
  let url = `${apiBase}${path}?${query.toString()}`;
  // 分页上限，避免接口异常时死循环
  for (let page = 0; page < 20; page++) {
    const result = await $fetch<V3Page<T>>(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    if (result?.data?.length) items.push(...result.data);
    if (!result?.nextLink) break;
    // 沿用当前 API 地址，兼容反向代理
    const cursor = new URL(result.nextLink).searchParams.get("cursor");
    if (!cursor) break;
    query.set("cursor", cursor);
    url = `${apiBase}${path}?${query.toString()}`;
  }
  return items;
};

const getRanges = ():
  | {
      dates: dayjs.Dayjs[];
      start: number;
      end: number;
    }
  | undefined => {
  try {
    const dates = [];
    const config = useRuntimeConfig();
    const days = config.public.countDays;
    const today = dayjs(new Date().setHours(0, 0, 0, 0));
    // 生成日期范围数组
    for (let d = 0; d < days; d++) dates.push(today.subtract(d, "day"));
    const start = dates[dates.length - 1]?.unix() ?? 0;
    const end = dates[0]?.add(1, "day").unix() ?? 0;
    return { dates, start, end };
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

/**
 * 获取站点数据
 */
export default defineEventHandler(async (event): Promise<MonitorsResult> => {
  try {
    const config = useRuntimeConfig();
    const { apiUrl, apiKey, sitePassword, siteSecretKey } = config;
    if (!apiUrl || !apiKey) {
      throw new Error("Missing API url or API key");
    }
    // 若登录-验证 token
    if (sitePassword && siteSecretKey) {
      const token = getCookie(event, "authToken");
      if (!token) throw new Error("Please log in first");
      // 验证 Token
      const isLogin = await verifyJwt(token);
      if (!isLogin) throw new Error("Invalid or expired token");
    }
    // 缓存键
    const cacheKey = "site-data";
    // 检查缓存
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      return {
        code: 200,
        message: "success",
        source: "cache",
        data: cachedData as MonitorsDataResult,
      };
    }
    const rangesData = getRanges();
    if (!rangesData) throw new Error("Missing");
    const { dates, start, end } = rangesData;
    const apiBase = getApiBase(apiUrl);
    // 同时获取监控项与停机事件
    const [monitors, incidents] = await Promise.all([
      fetchPages<UptimeRobotV3Monitor>(apiBase, apiKey, "monitors", {
        limit: "200",
      }),
      fetchPages<UptimeRobotV3Incident>(apiBase, apiKey, "incidents", {
        limit: "200",
        started_after: dayjs
          .unix(Math.max(1, start - INCIDENT_BUFFER_SECONDS))
          .toISOString(),
        started_before: dayjs.unix(end).toISOString(),
      }),
    ]);
    // 处理数据
    const data = formatSiteData(monitors, incidents, dates);
    // 缓存数据
    setCache(cacheKey, data, 1000 * 60);
    return {
      code: 200,
      message: "success",
      source: "api",
      data,
    };
  } catch (error) {
    setResponseStatus(event, 500);
    return {
      code: 500,
      message: error instanceof Error ? error.message : "Unknown error",
      source: "api",
      data: undefined,
    };
  }
});
