<template>
  <q-page>
    <main class="page-wrap home-page">
      <section class="hero surface">
        <div>
          <div class="eyebrow">Visão geral</div>
          <h1 class="hero-title">Olá, Larissa.</h1>
          <p>
            {{ greeting }}. Você tem {{ todayItems.length }}
            {{ todayItems.length === 1 ? 'aula' : 'aulas' }} na agenda de hoje.
          </p>
        </div>
        <div class="hero-date">
          <strong>{{ dayNumber }}</strong
          ><span>{{ monthName }}</span>
        </div>
      </section>

      <section class="quick-grid" aria-label="Ações rápidas">
        <router-link
          v-for="action in quickActions"
          :key="action.label"
          :to="action.to"
          class="quick-action surface-flat"
        >
          <span :class="['quick-icon', action.tone]"><q-icon :name="action.icon" /></span>
          <span
            ><strong>{{ action.label }}</strong
            ><small>{{ action.caption }}</small></span
          >
          <q-icon name="arrow_forward" class="quick-arrow" />
        </router-link>
      </section>

      <div class="dashboard-grid">
        <section class="surface agenda-card">
          <header class="card-head">
            <div>
              <div class="eyebrow">Hoje</div>
              <h2 class="section-title">Próximas aulas</h2>
            </div>
            <q-btn
              flat
              no-caps
              color="primary"
              label="Ver agenda"
              icon-right="arrow_forward"
              to="/agenda"
            />
          </header>
          <div v-if="todayItems.length" class="lesson-list">
            <article v-for="item in todayItems.slice(0, 5)" :key="item.id" class="lesson-row">
              <div class="lesson-time">{{ item.time }}</div>
              <div class="lesson-line"></div>
              <div class="lesson-person">
                <strong>{{ item.studentName }}</strong
                ><span
                  >{{ item.duration }} min ·
                  {{ item.isRecurring ? 'Horário fixo' : 'Aula avulsa' }}</span
                >
              </div>
              <span :class="['pill', `status-${item.status}`]">{{ statusLabel(item.status) }}</span>
            </article>
          </div>
          <div v-else class="empty-state">
            <q-icon name="event_available" size="38px" />Nenhuma aula para hoje.
          </div>
        </section>

        <section class="surface finance-card">
          <header class="card-head">
            <div>
              <div class="eyebrow">{{ monthLabel(periodKey) }}</div>
              <h2 class="section-title">Financeiro</h2>
            </div>
            <q-btn
              flat
              round
              color="primary"
              icon="arrow_forward"
              to="/financeiro"
              aria-label="Abrir financeiro"
            />
          </header>
          <div class="balance-block">
            <span>Saldo atual</span><strong>{{ formatCurrency(summary.balance) }}</strong
            ><small>Saldo inicial de {{ formatCurrency(period.openingBalance) }}</small>
          </div>
          <div class="finance-pair">
            <div>
              <q-icon name="south_west" /><span>Entradas</span
              ><strong>{{ formatCurrency(summary.income) }}</strong>
            </div>
            <div class="expense">
              <q-icon name="north_east" /><span>Saídas</span
              ><strong>{{ formatCurrency(summary.expense) }}</strong>
            </div>
          </div>
        </section>
      </div>

      <section class="stats-grid">
        <div class="stat surface-flat">
          <q-icon name="groups" /><span>Alunos ativos</span
          ><strong>{{ store.activeStudents.length }}</strong>
        </div>
        <div class="stat surface-flat">
          <q-icon name="task_alt" /><span>Realizadas hoje</span
          ><strong>{{ completedToday }}</strong>
        </div>
        <div class="stat surface-flat">
          <q-icon name="event_busy" /><span>Faltas / canceladas</span
          ><strong>{{ missedToday }}</strong>
        </div>
      </section>
    </main>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore, currentPeriodKey, toISODate } from '@/stores/app-store';
import { formatCurrency, monthLabel, statusLabel } from '@/utils/format';

const store = useAppStore();
const now = new Date();
const today = toISODate(now);
const periodKey = currentPeriodKey(now);
const period = computed(() => store.ensurePeriod(periodKey));
const summary = computed(() => store.periodSummary(periodKey));
const todayItems = computed(() => store.agendaForDate(today));
const completedToday = computed(
  () => todayItems.value.filter((item) => item.status === 'completed').length,
);
const missedToday = computed(
  () => todayItems.value.filter((item) => ['absent', 'cancelled'].includes(item.status)).length,
);
const dayNumber = String(now.getDate()).padStart(2, '0');
const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(now).replace('.', '');
const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite';
const quickActions = [
  {
    label: 'Novo aluno',
    caption: 'Criar cadastro',
    icon: 'person_add',
    tone: 'green',
    to: '/alunos?novo=1',
  },
  {
    label: 'Nova aula',
    caption: 'Agendar horário',
    icon: 'add_alarm',
    tone: 'blue',
    to: '/agenda?nova=1',
  },
  {
    label: 'Nova entrada',
    caption: 'Registrar receita',
    icon: 'add_card',
    tone: 'mint',
    to: '/financeiro?tipo=income',
  },
  {
    label: 'Nova saída',
    caption: 'Registrar despesa',
    icon: 'receipt_long',
    tone: 'peach',
    to: '/financeiro?tipo=expense',
  },
];
</script>

<style scoped>
.home-page {
  display: grid;
  gap: 22px;
}
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  padding: 28px 32px;
  background: linear-gradient(120deg, var(--studio-surface) 60%, var(--studio-primary-soft));
}
.hero-title {
  margin: 0;
  font:
    700 34px/1.1 'Playfair Display',
    serif;
}
.hero p {
  margin: 8px 0 0;
  color: var(--muted);
}
.hero-date {
  display: grid;
  width: 84px;
  height: 84px;
  place-content: center;
  border: 1px solid var(--studio-border);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.65);
  text-align: center;
}
.hero-date strong {
  font:
    700 31px/1 'Playfair Display',
    serif;
}
.hero-date span {
  margin-top: 5px;
  color: var(--q-primary);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}
.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.quick-action {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  color: var(--ink);
  text-decoration: none;
  transition:
    transform 0.18s,
    box-shadow 0.18s;
}
.quick-action:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}
.quick-action > span:nth-child(2) {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.quick-action small {
  margin-top: 2px;
  color: var(--muted);
}
.quick-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  place-items: center;
  border-radius: 13px;
  font-size: 20px;
}
.quick-icon.green,
.quick-icon.mint {
  background: var(--green-soft);
  color: var(--q-primary);
}
.quick-icon.blue {
  background: #e8eef0;
  color: var(--q-info);
}
.quick-icon.peach {
  background: var(--orange-soft);
  color: var(--q-primary);
}
.quick-arrow {
  color: var(--studio-text-muted);
}
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(300px, 0.75fr);
  gap: 22px;
}
.agenda-card,
.finance-card {
  padding: 24px;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
}
.lesson-list {
  display: grid;
}
.lesson-row {
  display: flex;
  min-height: 67px;
  align-items: center;
  gap: 14px;
  border-bottom: 1px solid var(--studio-border);
}
.lesson-row:last-child {
  border: 0;
}
.lesson-time {
  width: 44px;
  font-weight: 700;
}
.lesson-line {
  width: 3px;
  height: 34px;
  border-radius: 3px;
  background: var(--q-accent);
}
.lesson-person {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.lesson-person span {
  margin-top: 3px;
  color: var(--muted);
  font-size: 12px;
}
.balance-block {
  display: flex;
  flex-direction: column;
  padding: 24px 0;
}
.balance-block span,
.balance-block small {
  color: var(--muted);
}
.balance-block strong {
  margin: 4px 0 7px;
  font:
    700 32px 'Playfair Display',
    serif;
}
.finance-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.finance-pair > div {
  display: grid;
  grid-template-columns: 26px 1fr;
  align-items: center;
  padding: 13px;
  border-radius: 13px;
  background: var(--green-soft);
  color: var(--q-primary);
}
.finance-pair .expense {
  background: var(--orange-soft);
  color: var(--q-negative);
}
.finance-pair span {
  font-size: 11px;
}
.finance-pair strong {
  grid-column: 2;
  font-size: 13px;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.stat {
  display: grid;
  grid-template-columns: 42px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 18px;
}
.stat .q-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--studio-primary-soft);
  color: var(--q-primary);
  font-size: 21px;
}
.stat span {
  color: var(--muted);
}
.stat strong {
  font:
    700 24px 'Playfair Display',
    serif;
}
@media (max-width: 900px) {
  .quick-grid {
    grid-template-columns: 1fr 1fr;
  }
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 599px) {
  .hero {
    padding: 22px;
  }
  .hero-title {
    font-size: 28px;
  }
  .hero-date {
    width: 68px;
    height: 68px;
  }
  .quick-grid {
    gap: 10px;
  }
  .quick-action {
    padding: 12px;
  }
  .quick-action small,
  .quick-arrow {
    display: none;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .agenda-card,
  .finance-card {
    padding: 18px;
  }
}
</style>
