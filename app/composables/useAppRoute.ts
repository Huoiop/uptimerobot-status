import { computed, ref } from "vue";

// 轻量路由：状态页 / 历史事件页 / 故障详情页
const path = ref<string>(import.meta.client ? window.location.pathname : "/");
const previousPath = ref<string>("");
let initialized = false;

export const useAppRoute = () => {
  // 跳转
  const navigate = (to: string) => {
    if (!import.meta.client) return;
    if (window.location.pathname === to) {
      window.scrollTo({ top: 0 });
      return;
    }
    previousPath.value = path.value;
    window.history.pushState({}, "", to);
    path.value = to;
    window.scrollTo({ top: 0 });
  };

  // 返回
  const back = () => {
    if (!import.meta.client) return;
    if (window.history.length > 1) window.history.back();
    else navigate("/");
  };

  // 初始化，监听浏览器前进/后退
  const init = () => {
    if (!import.meta.client || initialized) return;
    initialized = true;
    path.value = window.location.pathname;
    window.addEventListener("popstate", () => {
      previousPath.value = path.value;
      path.value = window.location.pathname;
      window.scrollTo({ top: 0 });
    });
  };

  // /incidents/:id
  const incidentId = computed(() => {
    const match = path.value.match(/^\/incidents\/([^/?#]+)\/?$/);
    return match?.[1] ? decodeURIComponent(match[1]) : undefined;
  });

  // /history
  const isHistory = computed(() => /^\/history\/?$/.test(path.value));

  return {
    path,
    previousPath,
    incidentId,
    isHistory,
    navigate,
    back,
    init,
  };
};
