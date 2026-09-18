<template>
  <q-layout view="hHh Lpr lFf" class="app-shell">
    <q-header class="app-header">
      <q-toolbar class="header-toolbar">
        <q-btn v-if="$q.screen.lt.md" flat round dense icon="menu" aria-label="Abrir menu" @click="drawerOpen = true" />
        <div class="brand-mark">M</div>
        <div class="brand-copy"><strong>Movva</strong><span>Gestão de aulas</span></div>
        <q-space />
        <div class="header-date gt-sm">{{ todayLabel }}</div>
        <q-btn round flat icon="notifications_none" aria-label="Notificações"><q-badge color="negative" floating rounded /></q-btn>
        <q-avatar size="36px" class="avatar">LM</q-avatar>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawerOpen" :show-if-above="$q.screen.gt.sm" :width="244" class="app-drawer">
      <div class="drawer-content">
        <nav class="nav-list" aria-label="Navegação principal">
          <q-item v-for="item in navigation" :key="item.to" v-ripple clickable :to="item.to" exact
            active-class="nav-item--active" class="nav-item">
            <q-item-section avatar><q-icon :name="item.icon" size="21px" /></q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
          </q-item>
        </nav>
        <div class="drawer-tip">
          <q-icon name="auto_awesome" size="22px" />
          <div><strong>Seu dia, organizado.</strong><span>Dados salvos neste dispositivo.</span></div>
        </div>
        <div class="profile-row">
          <q-avatar size="38px" class="avatar">LM</q-avatar>
          <div><strong>Larissa Martins</strong><span>Profissional</span></div>
          <q-icon name="more_horiz" />
        </div>
      </div>
    </q-drawer>

    <q-page-container><router-view /></q-page-container>

    <q-footer v-if="$q.screen.lt.md" class="mobile-footer">
      <q-tabs dense no-caps indicator-color="transparent" active-color="primary" class="mobile-tabs">
        <q-route-tab v-for="item in navigation" :key="item.to" :to="item.to" exact :icon="item.icon" :label="item.shortLabel" />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const drawerOpen = ref(false);
const navigation = [
  { to: '/', label: 'Início', shortLabel: 'Início', icon: 'grid_view' },
  { to: '/agenda', label: 'Agenda', shortLabel: 'Agenda', icon: 'calendar_month' },
  { to: '/alunos', label: 'Alunos', shortLabel: 'Alunos', icon: 'group' },
  { to: '/financeiro', label: 'Financeiro', shortLabel: 'Finanças', icon: 'account_balance_wallet' },
  { to: '/configuracoes', label: 'Configurações', shortLabel: 'Ajustes', icon: 'tune' },
];
const todayLabel = computed(() =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()),
);
</script>
