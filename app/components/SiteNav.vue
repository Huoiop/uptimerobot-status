<!-- 顶部导航 -->
<template>
  <nav id="nav">
    <div class="site-container nav-content">
      <a class="brand" href="#" @click.prevent="openHome">
        <img v-if="siteLogo" :src="siteLogo" class="brand-logo" alt="" />
        <span class="brand-name">{{ siteTitle }}</span>
      </a>
      <div class="nav-actions">
        <button class="nav-btn" :disabled="refreshing" @click="refresh">
          <Icon v-if="refreshing" name="icon:refresh" class="spin" />
          {{ $t("nav.refresh") }}
        </button>
        <n-popselect
          v-model:value="statusStore.siteLang"
          :options="langData"
          trigger="click"
        >
          <button class="nav-btn icon" :aria-label="$t('nav.language')">
            <Icon name="icon:language" />
          </button>
        </n-popselect>
        <button
          class="nav-btn icon"
          :aria-label="$t('nav.theme')"
          @click="toggleTheme"
        >
          <Icon :name="themeIcon" />
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { Icon } from "#components";
import { langData } from "~/assets/data/text";

const config = useRuntimeConfig();
const statusStore = useStatusStore();
const colorMode = useColorMode();

const { siteTitle, siteLogo, siteHome, siteGithub } = config.public;

const refreshing = ref<boolean>(false);

// 模式图标
const themeIcon = computed(() => `icon:${colorMode.preference}-mode`);

// 打开站点主页
const openHome = () => {
  const url = siteHome || siteGithub;
  if (url) jumpLink(url);
};

// 刷新数据
const refresh = async () => {
  if (refreshing.value) return;
  refreshing.value = true;
  try {
    await getSiteData();
  } finally {
    refreshing.value = false;
  }
};

// 切换明暗模式
const toggleTheme = () => {
  const themeList = ["light", "dark", "system"];
  const themeValue =
    themeList[(themeList.indexOf(colorMode.preference) + 1) % 3];
  if (themeValue) colorMode.preference = themeValue;
};
</script>

<style lang="scss" scoped>
nav {
  padding-top: 32px;
}
.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
  cursor: pointer;
  .brand-logo {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    object-fit: contain;
  }
  .brand-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
}
.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--button-bg);
  color: var(--text-color);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    opacity 0.2s;
  &:hover {
    background: var(--hover-bg);
    border-color: var(--border-strong);
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
  &.icon {
    width: 36px;
    padding: 0;
  }
  svg {
    width: 16px;
    height: 16px;
  }
}
.spin {
  animation: nav-spin 1s linear infinite;
}
@keyframes nav-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 480px) {
  nav {
    padding-top: 24px;
  }
  .brand .brand-name {
    font-size: 16px;
  }
  .nav-btn {
    padding: 0 12px;
    font-size: 13px;
    &.icon {
      width: 36px;
      padding: 0;
    }
  }
}
</style>
