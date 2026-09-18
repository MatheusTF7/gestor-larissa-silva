import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('@/pages/IndexPage.vue'), meta: { title: 'Início' } },
      { path: 'agenda', name: 'agenda', component: () => import('@/pages/AgendaPage.vue'), meta: { title: 'Agenda' } },
      { path: 'alunos', name: 'students', component: () => import('@/pages/StudentsPage.vue'), meta: { title: 'Alunos' } },
      { path: 'financeiro', name: 'finance', component: () => import('@/pages/FinancePage.vue'), meta: { title: 'Financeiro' } },
      { path: 'configuracoes', name: 'settings', component: () => import('@/pages/SettingsPage.vue'), meta: { title: 'Configurações' } },
    ],
  },
  { path: '/:catchAll(.*)*', component: () => import('@/pages/ErrorNotFound.vue') },
];

export default routes;
