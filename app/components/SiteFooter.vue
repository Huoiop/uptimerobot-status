<!-- 页脚 -->
<template>
  <footer id="footer" class="site-container">
    <n-flex class="links" align="center" justify="center" :size="8">
      <button
        v-for="item in footerLinks"
        :key="item.key"
        class="foot-icon"
        :aria-label="item.key"
        @click="jumpLink(item.url)"
      >
        <Icon :name="`icon:${item.key}`" />
      </button>
      <button v-if="showLogout" class="foot-btn" @click="logout">
        <Icon name="icon:logout" />
        {{ $t("nav.logout") }}
      </button>
    </n-flex>
    <p class="powered">
      {{ $t("footer.basedOn") }}
      <a @click="jumpLink('https://uptimerobot.com/')">
        {{ $t("uptimeRobot") }}
      </a>
      · {{ $t("footer.checkFrequency") }}
      {{ $t("footer.fiveMinutes") }}
    </p>
    <p class="copy">
      HuoiopStatus v{{ version }} · Copyright &copy; 2020 - {{ year }}
      <a @click="jumpLink(siteAuthorUrl)">{{ siteAuthor }}</a>
      <template v-if="siteIcp">
        ·
        <a @click="jumpLink('https://beian.miit.gov.cn/')">{{ siteIcp }}</a>
      </template>
    </p>
  </footer>
</template>

<script setup lang="ts">
const { public: configPublic } = useRuntimeConfig();
const statusStore = useStatusStore();
const {
  siteIcp,
  version,
  siteGithub,
  siteHome,
  siteEmail,
  siteAuthor,
  siteAuthorUrl,
} = configPublic;

const year = new Date().getFullYear();

const linkData = computed(() => ({
  github: siteGithub,
  home: siteHome,
  email: siteEmail
    ? siteEmail.includes(":")
      ? siteEmail
      : `mailto:${siteEmail}`
    : "",
}));

// 隐藏未配置的链接
const footerLinks = computed(() =>
  Object.entries(linkData.value)
    .filter(([, url]) => Boolean(url))
    .map(([key, url]) => ({ key, url })),
);

const showLogout = computed(
  () => statusStore.loginStatus && statusStore.passwordRequired,
);

// 退出登录
const logout = () => {
  window.$dialog.warning({
    title: "退出登录",
    content: "确定要退出登录吗?",
    positiveText: "确定",
    negativeText: "取消",
    transformOrigin: "center",
    onPositiveClick: async () => {
      const { code } = await $fetch("/api/logout", {
        method: "POST",
      });
      if (code !== 200) {
        window.$message.error("退出登录失败");
        return;
      }
      window.$message.success("退出登录成功");
      statusStore.loginStatus = false;
      localStorage.removeItem("authToken");
    },
  });
};
</script>

<style lang="scss" scoped>
#footer {
  padding-top: 32px;
  padding-bottom: 48px;
  text-align: center;
}
.links {
  margin-bottom: 12px;
}
.foot-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: none;
  color: var(--muted-text);
  cursor: pointer;
  transition:
    color 0.2s,
    background-color 0.2s;
  svg {
    width: 16px;
    height: 16px;
  }
  &:hover {
    color: var(--text-color);
    background: var(--hover-bg);
  }
}
.foot-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--button-bg);
  color: var(--muted-text);
  font-size: 12px;
  cursor: pointer;
  svg {
    width: 14px;
    height: 14px;
  }
  &:hover {
    color: var(--text-color);
    background: var(--hover-bg);
  }
}
.powered,
.copy {
  font-size: 12px;
  line-height: 1.8;
  color: var(--muted-text);
  a {
    cursor: pointer;
    &:hover {
      color: var(--text-color);
    }
  }
}
</style>
