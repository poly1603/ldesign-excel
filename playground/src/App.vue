<template>
  <div class="app-layout">
    <!-- 左侧菜单 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <FileSpreadsheet class="logo-icon" :size="28" />
        <div class="logo-text">
          <span class="logo-title">Excel Viewer</span>
          <span class="logo-subtitle">Playground</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title">功能演示</div>
          <router-link
            v-for="route in menuRoutes"
            :key="route.path"
            :to="route.path"
            class="nav-item"
            :class="{ active: currentRoute === route.name }"
          >
            <component :is="getIcon(route.meta?.icon)" :size="18" />
            <span>{{ route.meta?.title }}</span>
          </router-link>
        </div>
      </nav>

      <div class="sidebar-footer">
        <a href="https://github.com" target="_blank" class="footer-link">
          <Github :size="16" />
          <span>GitHub</span>
        </a>
        <a href="#" class="footer-link">
          <BookOpen :size="16" />
          <span>文档</span>
        </a>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { routes } from './router';
import {
  FileSpreadsheet,
  Settings2,
  Menu,
  Calculator,
  Grid3x3,
  MousePointer2,
  Download,
  Palette,
  Github,
  BookOpen
} from 'lucide-vue-next';

const route = useRoute();
const currentRoute = computed(() => route.name);

// 过滤出菜单路由
const menuRoutes = computed(() => routes.filter(r => r.meta?.title));

// 根据图标名获取组件
const iconMap: Record<string, any> = {
  FileSpreadsheet,
  Settings2,
  Menu,
  Calculator,
  Grid3x3,
  MousePointer2,
  Download,
  Palette
};

const getIcon = (name?: string) => {
  return name ? iconMap[name] || FileSpreadsheet : FileSpreadsheet;
};
</script>

<style>
:root {
  --primary-color: #217346;
  --primary-hover: #1a5c38;
  --sidebar-bg: #1e1e2d;
  --sidebar-hover: #2a2a3d;
  --sidebar-active: #3a3a4d;
  --border-color: #e5e7eb;
  --text-color: #1f2937;
  --text-secondary: #6b7280;
  --bg-color: #f9fafb;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  overflow: hidden;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--text-color);
  background: var(--bg-color);
}

.app-layout {
  display: flex;
  height: 100%;
}

/* 侧边栏 */
.sidebar {
  width: 240px;
  background: var(--sidebar-bg);
  color: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-icon {
  color: #10b981;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-title {
  font-size: 16px;
  font-weight: 600;
}

.logo-subtitle {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.sidebar-nav {
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
}

.nav-section {
  padding: 0 12px;
}

.nav-section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  padding: 8px 12px;
  letter-spacing: 0.5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 14px;
  margin-bottom: 2px;
  transition: all 0.15s;
}

.nav-item:hover {
  background: var(--sidebar-hover);
  color: #fff;
}

.nav-item.active {
  background: var(--primary-color);
  color: #fff;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 16px;
}

.footer-link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-size: 13px;
  transition: color 0.15s;
}

.footer-link:hover {
  color: #fff;
}

/* 主内容区 */
.main-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
