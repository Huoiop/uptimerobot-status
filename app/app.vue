<template>
  <GlobalProvider>
    <div id="app-shell">
      <SiteNav />
      <SiteHeader
        v-if="
          !incidentId && !isHistory && siteLoaded && statusStore.loginStatus
        "
      />
      <!-- 主内容 -->
      <main v-if="siteLoaded" id="main">
        <!-- 密码验证 -->
        <SiteLogin v-if="!statusStore.loginStatus" />
        <!-- 故障详情 -->
        <IncidentDetail v-else-if="incidentId" :incident-id="incidentId" />
        <!-- 历史事件 -->
        <IncidentHistory v-else-if="isHistory" />
        <!-- 站点状态 -->
        <SiteCards v-else />
      </main>
      <SiteFooter />
      <!-- 回到顶部 -->
      <n-back-top :visibility-height="400" />
    </div>
  </GlobalProvider>
</template>

<script setup lang="ts">
import IncidentDetail from "~/components/IncidentDetail.vue";
import IncidentHistory from "~/components/IncidentHistory.vue";
import { useAppRoute } from "~/composables/useAppRoute";

const config = useRuntimeConfig();
const statusStore = useStatusStore();
const { t, setLocale } = useI18n();
const { incidentId, isHistory, init: initRoute } = useAppRoute();

// 加载状态
const siteLoaded = ref<boolean>(false);

// 错误状态
const isErrorStatus = computed(
  () => statusStore.siteStatus === "error" || statusStore.siteStatus === "warn",
);

// 页面标题
useHead({
  title: computed(() => {
    const { siteTitle } = config.public;
    if (incidentId.value) return `${t("status.incidentTitle")} · ${siteTitle}`;
    if (isHistory.value) return `${t("status.historyTitle")} · ${siteTitle}`;
    const error = statusStore.siteData?.status?.error || 0;
    const unknown = statusStore.siteData?.status?.unknown || 0;
    return isErrorStatus.value
      ? `( ${error + unknown} ) ${siteTitle}`
      : siteTitle;
  }),
});

// 站点图标
useFavicon(
  computed(() => (isErrorStatus.value ? "/favicon-error.ico" : "/favicon.ico")),
);

// 验证状态
const checkSite = async () => {
  try {
    const result = await $fetch("/api/check", { method: "POST" });
    // 站点是否启用了密码
    statusStore.passwordRequired = result.passwordRequired ?? false;
    // 更改登录状态
    statusStore.loginStatus = result.code === 200;
  } catch (error) {
    console.error("error in checkSite", error);
  } finally {
    siteLoaded.value = true;
  }
};

// 更改站点语言
const setSiteLang = (lang: string) => {
  setLocale(lang);
  useHead({ htmlAttrs: { lang } });
};

// 语言更改
watch(() => statusStore.siteLang, setSiteLang);

onBeforeMount(checkSite);

onMounted(() => {
  setSiteLang(statusStore.siteLang);
  initRoute();
});
</script>
