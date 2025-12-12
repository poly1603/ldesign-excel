import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/basic'
  },
  {
    path: '/basic',
    name: 'basic',
    component: () => import('../views/BasicView.vue'),
    meta: { title: '基础用法', icon: 'FileSpreadsheet' }
  },
  {
    path: '/toolbar',
    name: 'toolbar',
    component: () => import('../views/ToolbarView.vue'),
    meta: { title: '工具栏', icon: 'Settings2' }
  },
  {
    path: '/context-menu',
    name: 'context-menu',
    component: () => import('../views/ContextMenuView.vue'),
    meta: { title: '右键菜单', icon: 'Menu' }
  },
  {
    path: '/formula-bar',
    name: 'formula-bar',
    component: () => import('../views/FormulaBarView.vue'),
    meta: { title: '公式栏', icon: 'Calculator' }
  },
  {
    path: '/selection',
    name: 'selection',
    component: () => import('../views/SelectionView.vue'),
    meta: { title: '选区操作', icon: 'Grid3x3' }
  },
  {
    path: '/events',
    name: 'events',
    component: () => import('../views/EventsView.vue'),
    meta: { title: '事件监听', icon: 'MousePointer2' }
  },
  {
    path: '/export',
    name: 'export',
    component: () => import('../views/ExportView.vue'),
    meta: { title: '导出功能', icon: 'Download' }
  },
  {
    path: '/themes',
    name: 'themes',
    component: () => import('../views/ThemesView.vue'),
    meta: { title: '主题样式', icon: 'Palette' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
export { routes };
