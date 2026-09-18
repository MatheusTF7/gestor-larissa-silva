<template>
  <q-page>
    <main class="page-wrap settings-page">
      <header class="page-head">
        <div>
          <div class="eyebrow">Personalização</div>
          <h1 class="page-title">Configurações</h1>
          <p class="page-subtitle">Ajuste a agenda e as categorias ao seu jeito de trabalhar.</p>
        </div>
        <span class="saved-state"><q-icon name="cloud_done" /> Salvo automaticamente</span>
      </header>

      <div class="settings-grid">
        <section class="surface settings-section">
          <header>
            <span class="setting-icon"><q-icon name="schedule" /></span>
            <div>
              <h2 class="section-title">Agenda e atendimento</h2>
              <p>Definições usadas ao criar novos horários.</p>
            </div>
          </header>
          <div class="settings-form">
            <div class="field-copy">
              <strong>Duração padrão da aula</strong
              ><span>Preenchida automaticamente em novos agendamentos.</span>
            </div>
            <q-select
              v-model="store.settings.defaultDuration"
              outlined
              dense
              emit-value
              map-options
              :options="durationOptions"
              suffix="min"
            />
            <q-separator />
            <div class="field-copy">
              <strong>Horário de atendimento</strong><span>Intervalo habitual da sua agenda.</span>
            </div>
            <div class="time-range">
              <q-input
                v-model="store.settings.startTime"
                outlined
                dense
                type="time"
                stack-label
                label="Início"
              /><span>até</span
              ><q-input
                v-model="store.settings.endTime"
                outlined
                dense
                type="time"
                stack-label
                label="Fim"
              />
            </div>
            <q-separator />
            <div class="field-copy">
              <strong>Dias de atendimento</strong><span>Os dias aparecem na visão semanal.</span>
            </div>
            <div class="day-chips">
              <button
                v-for="day in weekdays"
                :key="day.value"
                type="button"
                :class="{ active: store.settings.workingDays.includes(day.value) }"
                @click="toggleDay(day.value)"
              >
                {{ day.short }}
              </button>
            </div>
            <q-separator />
            <div class="field-copy">
              <strong>Capacidade por horário</strong
              ><span>Você será avisado ao atingir este limite.</span>
            </div>
            <q-input
              v-model.number="store.settings.maxCapacity"
              outlined
              dense
              type="number"
              min="1"
              max="30"
              suffix="alunos"
            />
          </div>
        </section>

        <section class="surface settings-section">
          <header>
            <span class="setting-icon orange"><q-icon name="category" /></span>
            <div>
              <h2 class="section-title">Categorias financeiras</h2>
              <p>Organize receitas e despesas nos seus lançamentos.</p>
            </div>
          </header>
          <q-tabs
            v-model="categoryTab"
            dense
            no-caps
            align="left"
            active-color="primary"
            indicator-color="primary"
            class="category-tabs"
            ><q-tab name="income" label="Entradas" /><q-tab name="expense" label="Saídas"
          /></q-tabs>
          <q-tab-panels v-model="categoryTab" animated class="category-panels"
            ><q-tab-panel name="income"
              ><div class="category-list">
                <div v-for="category in store.settings.categories.income" :key="category">
                  <span>{{ category }}</span
                  ><q-btn
                    flat
                    round
                    dense
                    icon="close"
                    aria-label="Remover categoria"
                    @click="removeCategory('income', category)"
                  />
                </div>
              </div>
              <div class="add-category">
                <q-input
                  v-model="newIncome"
                  outlined
                  dense
                  placeholder="Nova categoria"
                  @keyup.enter="addCategory('income')"
                /><q-btn
                  unelevated
                  color="primary"
                  icon="add"
                  @click="addCategory('income')"
                /></div></q-tab-panel
            ><q-tab-panel name="expense"
              ><div class="category-list">
                <div v-for="category in store.settings.categories.expense" :key="category">
                  <span>{{ category }}</span
                  ><q-btn
                    flat
                    round
                    dense
                    icon="close"
                    aria-label="Remover categoria"
                    @click="removeCategory('expense', category)"
                  />
                </div>
              </div>
              <div class="add-category">
                <q-input
                  v-model="newExpense"
                  outlined
                  dense
                  placeholder="Nova categoria"
                  @keyup.enter="addCategory('expense')"
                /><q-btn
                  unelevated
                  color="primary"
                  icon="add"
                  @click="addCategory('expense')"
                /></div></q-tab-panel
          ></q-tab-panels>
        </section>

        <section class="surface settings-section compact">
          <header>
            <span class="setting-icon blue"><q-icon name="payments" /></span>
            <div>
              <h2 class="section-title">Moeda</h2>
              <p>Formato usado em todos os valores.</p>
            </div>
          </header>
          <div class="single-setting">
            <div><strong>Real brasileiro</strong><span>BRL · R$</span></div>
            <q-icon name="check_circle" color="positive" size="24px" />
          </div>
        </section>

        <section class="surface settings-section compact">
          <header>
            <span class="setting-icon grey"><q-icon name="storage" /></span>
            <div>
              <h2 class="section-title">Dados do aplicativo</h2>
              <p>As informações ficam salvas neste dispositivo.</p>
            </div>
          </header>
          <div class="data-actions">
            <div>
              <strong>{{ store.students.length }} alunos</strong
              ><span>{{ store.transactions.length }} lançamentos financeiros</span>
            </div>
            <q-btn
              outline
              no-caps
              color="negative"
              icon="restart_alt"
              label="Restaurar demonstração"
              @click="confirmReset"
            />
          </div>
        </section>
      </div>
    </main>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useAppStore } from '@/stores/app-store';
import { weekdays } from '@/utils/format';

const $q = useQuasar();
const store = useAppStore();
const categoryTab = ref<'income' | 'expense'>('income');
const newIncome = ref('');
const newExpense = ref('');
const durationOptions = [30, 40, 45, 50, 60, 75, 90].map((value) => ({
  label: `${value} minutos`,
  value,
}));
function toggleDay(day: number) {
  const days = store.settings.workingDays;
  if (days.includes(day)) {
    if (days.length === 1) {
      $q.notify({ type: 'warning', message: 'Mantenha ao menos um dia de atendimento.' });
      return;
    }
    store.settings.workingDays = days.filter((item) => item !== day);
  } else store.settings.workingDays = [...days, day].sort();
}
function addCategory(type: 'income' | 'expense') {
  const source = type === 'income' ? newIncome : newExpense;
  const value = source.value.trim();
  if (!value) return;
  store.addCategory(type, value);
  source.value = '';
  $q.notify({ message: 'Categoria adicionada.', color: 'primary', icon: 'check' });
}
function removeCategory(type: 'income' | 'expense', category: string) {
  const inUse = store.transactions.some((item) => item.type === type && item.category === category);
  if (inUse) {
    $q.dialog({
      title: 'Remover categoria?',
      message:
        'Há lançamentos usando esta categoria. Eles serão mantidos, mas a categoria não aparecerá em novos registros.',
      cancel: true,
      persistent: true,
    }).onOk(() => store.removeCategory(type, category));
  } else store.removeCategory(type, category);
}
function confirmReset() {
  $q.dialog({
    title: 'Restaurar dados de demonstração?',
    message: 'Os dados atuais deste dispositivo serão substituídos pelos exemplos iniciais.',
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Restaurar', color: 'negative', unelevated: true },
    persistent: true,
  }).onOk(() => {
    store.resetDemo();
    $q.notify({ type: 'positive', message: 'Dados de demonstração restaurados.' });
  });
}
</script>

<style scoped>
.saved-state {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--positive);
  font-size: 12px;
}
.settings-grid {
  display: grid;
  grid-template-columns: 1.25fr 0.85fr;
  gap: 20px;
  align-items: start;
}
.settings-section {
  overflow: hidden;
}
.settings-section > header {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 22px 24px;
  border-bottom: 1px solid var(--line);
}
.settings-section header p {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 12px;
}
.setting-icon {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  place-items: center;
  border-radius: 13px;
  background: var(--green-soft);
  color: var(--q-primary);
  font-size: 21px;
}
.setting-icon.orange {
  background: var(--orange-soft);
  color: var(--q-primary);
}
.setting-icon.blue {
  background: #e8eef0;
  color: var(--q-info);
}
.setting-icon.grey {
  background: var(--studio-background);
  color: var(--studio-text-muted);
}
.settings-form {
  display: grid;
  grid-template-columns: 1fr 260px;
  align-items: center;
  gap: 17px;
  padding: 22px 24px;
}
.settings-form > .q-separator {
  grid-column: 1/-1;
}
.field-copy {
  display: flex;
  flex-direction: column;
}
.field-copy span {
  margin-top: 3px;
  color: var(--muted);
  font-size: 11px;
}
.time-range {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
}
.time-range > span {
  color: var(--muted);
  font-size: 11px;
}
.day-chips {
  display: flex;
  gap: 5px;
}
.day-chips button {
  width: 34px;
  height: 34px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: #fff;
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}
.day-chips button.active {
  border-color: var(--q-primary);
  background: var(--green-soft);
  color: var(--q-primary);
}
.category-tabs {
  padding: 0 18px;
  border-bottom: 1px solid var(--line);
}
.category-panels {
  background: transparent;
}
.category-list {
  display: grid;
  gap: 7px;
}
.category-list > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 39px;
  padding-left: 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  font-size: 12px;
}
.add-category {
  display: grid;
  grid-template-columns: 1fr 40px;
  gap: 7px;
  margin-top: 12px;
}
.compact > header {
  border-bottom: 0;
}
.single-setting,
.data-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 24px 22px;
  padding: 15px;
  border-radius: 12px;
  background: var(--studio-background);
}
.single-setting > div,
.data-actions > div {
  display: flex;
  flex-direction: column;
}
.single-setting span,
.data-actions span {
  margin-top: 3px;
  color: var(--muted);
  font-size: 11px;
}
@media (max-width: 1000px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 599px) {
  .saved-state {
    display: none;
  }
  .settings-form {
    grid-template-columns: 1fr;
    padding: 18px;
  }
  .settings-form > .q-separator {
    grid-column: auto;
  }
  .field-copy {
    margin-top: 5px;
  }
  .data-actions {
    align-items: flex-start;
    flex-direction: column;
    gap: 13px;
  }
  .data-actions > .q-btn {
    width: 100%;
  }
}
</style>
