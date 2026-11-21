// site status
export type SiteType = "loading" | "warn" | "error" | "unknown" | "normal";

// 单次故障
export interface SiteIncident {
  id?: string;
  // Ongoing / Resolved
  status?: string;
  // 错误码
  cause?: number | null;
  // 错误信息
  reason?: string;
  // 所属监控项
  monitorName?: string;
  // 所属监控项标签
  tags?: SiteTag[];
  // 开始时间（秒）
  startedAt: number;
  // 结束时间（秒），进行中为空
  resolvedAt?: number;
  // 持续时长（秒）
  duration: number;
}

export interface SiteDaysStatus {
  // 日期
  date?: number;
  // 日期文本（按服务端日期边界生成）
  dateText?: string;
  // 当日是否有监控数据
  hasData?: boolean;
  // 百分比
  percent: number;
  // 状态
  down: {
    // 次数
    times: number;
    // 时长
    duration: number;
  };
  // 当日故障明细
  incidents?: SiteIncident[];
}

// 监控项标签
export interface SiteTag {
  id?: number;
  name: string;
  color?: string;
}

export interface SiteStatusType extends SiteDaysStatus {
  id: number;
  name: string;
  // 0 - 暂停 / 1 - 还未检查 / 2 - 正常 / 8 - 好像寄了 / 9 - 寄了
  status: 0 | 1 | 2 | 8 | 9;
  // HTTP / KEYWORD / PING / PORT / HEARTBEAT / DNS / API / UDP ...
  type: string;
  // 检查间隔（ 秒 ）
  interval: number;
  // 标签
  tags: SiteTag[];
  // 详细数据
  days: SiteDaysStatus[];
  // 当前进行中的故障
  currentIncident?: SiteIncident;
  // 站点链接
  url?: string;
}

// UptimeRobot v3 monitor
export interface UptimeRobotV3Monitor {
  id: number;
  friendlyName?: string | null;
  status?: string;
  type?: string;
  interval?: number;
  url?: string | null;
  createDateTime?: string;
  tags?: (SiteTag | string)[];
  lastIncident?: {
    id?: string;
    status?: string;
    cause?: number | null;
    reason?: string | null;
    startedAt?: string;
    duration?: number | null;
  } | null;
}

// UptimeRobot v3 incident
export interface UptimeRobotV3Incident {
  id?: string;
  status?: string;
  type?: string;
  cause?: number | null;
  reason?: string | null;
  monitor?: {
    id?: number;
    friendlyName?: string | null;
  };
  startedAt?: string;
  resolvedAt?: string | null;
  duration?: number | null;
}

// monitors result
export interface MonitorsDataResult {
  // 总状态
  status: {
    // 站点总数
    count: number;
    // 正常
    ok: number;
    // 异常
    error: number;
    // 未知
    unknown: number;
  };
  // 总数据
  data: SiteStatusType[];
  // 更新时间
  timestamp: number;
}

export interface MonitorsResult {
  code: number;
  message: string;
  source: "cache" | "api";
  data: MonitorsDataResult | undefined;
}

// site lang
export type SiteLangType = "zh-CN" | "ja-JP" | "ko-KR" | "en";
