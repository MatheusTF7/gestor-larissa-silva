<template>
  <q-page>
    <main class="page-wrap">
      <header class="page-head">
        <div>
          <div class="eyebrow">Controle mensal</div>
          <h1 class="page-title">Financeiro</h1>
          <p class="page-subtitle">Entradas, saídas e saldo sempre recalculados.</p>
        </div>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Novo lançamento"
          class="primary-btn"
          :disable="period.closed"
          @click="openTransaction()"
        />
      </header>

      <section class="month-toolbar surface-flat">
        <q-btn flat round icon="chevron_left" @click="moveMonth(-1)" aria-label="Mês anterior" />
        <div class="month-label">
          <q-icon name="calendar_month" /><strong>{{ monthLabel(periodKey) }}</strong>
        </div>
        <q-btn flat round icon="chevron_right" @click="moveMonth(1)" aria-label="Próximo mês" />
        <q-space /><span v-if="period.closed" class="closed-badge"
          ><q-icon name="lock" /> Mês fechado</span
        ><q-btn
          v-else
          flat
          no-caps
          color="primary"
          icon="lock_outline"
          label="Fechar mês"
          @click="confirmClose"
        />
      </section>

      <section class="summary-grid">
        <article class="summary-card surface">
          <div class="summary-icon neutral"><q-icon name="account_balance" /></div>
          <div>
            <span>Saldo inicial</span><strong>{{ formatCurrency(period.openingBalance) }}</strong>
          </div>
          <q-btn
            v-if="!period.closed"
            flat
            round
            dense
            icon="edit"
            aria-label="Editar saldo inicial"
            @click="
              balanceValue = period.openingBalance;
              balanceOpen = true;
            "
          />
        </article>
        <article class="summary-card surface income">
          <div class="summary-icon"><q-icon name="south_west" /></div>
          <div>
            <span>Total de entradas</span><strong>{{ formatCurrency(summary.income) }}</strong>
          </div>
          <small>{{ incomeCount }} lançamentos</small>
        </article>
        <article class="summary-card surface expense">
          <div class="summary-icon"><q-icon name="north_east" /></div>
          <div>
            <span>Total de saídas</span><strong>{{ formatCurrency(summary.expense) }}</strong>
          </div>
          <small>{{ expenseCount }} lançamentos</small>
        </article>
        <article class="summary-card surface balance">
          <div class="summary-icon"><q-icon name="savings" /></div>
          <div>
            <span>Saldo atual</span><strong>{{ formatCurrency(summary.balance) }}</strong>
          </div>
          <small>Disponível no período</small>
        </article>
      </section>

      <section class="transactions surface">
        <header class="transactions-head">
          <div>
            <h2 class="section-title">Movimentações</h2>
            <span class="section-caption"
              >{{ filteredTransactions.length }} registro(s) no período</span
            >
          </div>
          <div class="transaction-actions">
            <q-btn
              outline
              no-caps
              color="positive"
              icon="add"
              label="Entrada"
              :disable="period.closed"
              @click="openTransaction(undefined, 'income')"
            /><q-btn
              outline
              no-caps
              color="secondary"
              icon="remove"
              label="Saída"
              :disable="period.closed"
              @click="openTransaction(undefined, 'expense')"
            />
          </div>
        </header>
        <div class="transaction-filters">
          <q-input
            v-model="search"
            outlined
            dense
            clearable
            placeholder="Buscar descrição"
            debounce="150"
            ><template #prepend><q-icon name="search" /></template></q-input
          ><q-select
            v-model="typeFilter"
            outlined
            dense
            emit-value
            map-options
            label="Tipo"
            :options="[
              { label: 'Todos', value: 'all' },
              { label: 'Entradas', value: 'income' },
              { label: 'Saídas', value: 'expense' },
            ]"
          /><q-select
            v-model="categoryFilter"
            outlined
            dense
            clearable
            label="Categoria"
            :options="allCategories"
          />
        </div>
        <div v-if="filteredTransactions.length" class="transaction-table">
          <div class="table-head">
            <span>Data</span><span>Descrição</span><span>Categoria</span><span>Entrada</span
            ><span>Saída</span><span></span>
          </div>
          <div v-for="item in filteredTransactions" :key="item.id" class="table-row">
            <span class="tx-date">{{
              formatDate(item.date, { day: '2-digit', month: 'short' })
            }}</span>
            <div class="tx-description">
              <span :class="['tx-icon', item.type]"
                ><q-icon :name="item.type === 'income' ? 'south_west' : 'north_east'"
              /></span>
              <div>
                <strong>{{ item.description }}</strong
                ><small v-if="studentName(item.studentId)">{{ studentName(item.studentId) }}</small>
              </div>
            </div>
            <span class="category-tag">{{ item.category || 'Sem categoria' }}</span
            ><strong class="income-value">{{
              item.type === 'income' ? formatCurrency(item.amount) : '—'
            }}</strong
            ><strong class="expense-value">{{
              item.type === 'expense' ? formatCurrency(item.amount) : '—'
            }}</strong
            ><q-btn flat round dense icon="more_vert"
              ><q-menu auto-close
                ><q-list style="min-width: 150px"
                  ><q-item clickable @click="openTransaction(item)"
                    ><q-item-section avatar><q-icon name="edit" /></q-item-section
                    ><q-item-section>Editar</q-item-section></q-item
                  ><q-item clickable @click="showDetails(item)"
                    ><q-item-section avatar><q-icon name="visibility" /></q-item-section
                    ><q-item-section>Detalhes</q-item-section></q-item
                  ><q-item
                    clickable
                    class="text-negative"
                    :disable="period.closed"
                    @click="confirmRemove(item)"
                    ><q-item-section avatar><q-icon name="delete_outline" /></q-item-section
                    ><q-item-section>Excluir</q-item-section></q-item
                  ></q-list
                ></q-menu
              ></q-btn
            >
          </div>
        </div>
        <div v-else class="empty-state">
          <q-icon name="receipt_long" size="44px" /><strong>Nenhuma movimentação</strong>
          <div>Registre uma entrada ou saída para começar.</div>
        </div>
      </section>
    </main>

    <q-dialog v-model="formOpen" :position="$q.screen.lt.sm ? 'bottom' : 'standard'" persistent
      ><q-card class="form-dialog"
        ><header class="dialog-head">
          <div>
            <div class="eyebrow">
              {{ transactionForm.id ? 'Editar lançamento' : 'Novo lançamento' }}
            </div>
            <h2 class="dialog-title">
              {{ transactionForm.type === 'income' ? 'Registrar entrada' : 'Registrar saída' }}
            </h2>
          </div>
          <q-space /><q-btn flat round icon="close" v-close-popup />
        </header>
        <q-form @submit="saveTransaction"
          ><q-card-section class="dialog-body"
            ><div class="transaction-form">
              <q-btn-toggle
                v-model="transactionForm.type"
                spread
                no-caps
                unelevated
                toggle-color="primary"
                color="grey-2"
                text-color="grey-8"
                :options="[
                  { label: 'Entrada', value: 'income', icon: 'south_west' },
                  { label: 'Saída', value: 'expense', icon: 'north_east' },
                ]"
              /><q-input
                v-model="transactionForm.description"
                outlined
                label="Descrição *"
                :rules="[(v) => !!v.trim() || 'Informe a descrição']"
              />
              <div class="two-fields">
                <q-input
                  v-model.number="transactionForm.amount"
                  outlined
                  type="number"
                  min="0.01"
                  step="0.01"
                  prefix="R$"
                  label="Valor *"
                  :rules="[(v) => Number(v) > 0 || 'Informe um valor maior que zero']"
                /><q-input
                  v-model="transactionForm.date"
                  outlined
                  type="date"
                  stack-label
                  label="Data *"
                  :rules="[dateInPeriod]"
                />
              </div>
              <q-select
                v-model="transactionForm.category"
                outlined
                clearable
                label="Categoria"
                :options="categoryOptions"
              /><q-select
                v-if="transactionForm.type === 'income'"
                v-model="transactionForm.studentId"
                outlined
                clearable
                emit-value
                map-options
                label="Vincular a um aluno (opcional)"
                :options="studentOptions"
              /><q-input
                v-model="transactionForm.notes"
                outlined
                autogrow
                label="Observações"
              /></div></q-card-section
          ><q-card-actions class="dialog-actions" align="right"
            ><q-btn flat no-caps label="Cancelar" v-close-popup /><q-btn
              unelevated
              no-caps
              color="primary"
              label="Salvar lançamento"
              type="submit" /></q-card-actions></q-form></q-card
    ></q-dialog>

    <q-dialog v-model="balanceOpen"
      ><q-card class="form-dialog" style="max-width: 430px"
        ><header class="dialog-head">
          <h2 class="dialog-title">Saldo inicial</h2>
          <q-space /><q-btn flat round icon="close" v-close-popup />
        </header>
        <q-card-section class="dialog-body"
          ><p class="section-caption q-mt-none">
            Defina o valor disponível no início de {{ monthLabel(periodKey) }}.
          </p>
          <q-input
            v-model.number="balanceValue"
            autofocus
            outlined
            type="number"
            step="0.01"
            prefix="R$"
            label="Valor" /></q-card-section
        ><q-card-actions class="dialog-actions" align="right"
          ><q-btn flat no-caps label="Cancelar" v-close-popup /><q-btn
            unelevated
            no-caps
            color="primary"
            label="Salvar"
            @click="saveBalance" /></q-card-actions></q-card
    ></q-dialog>

    <q-dialog v-model="detailsOpen"
      ><q-card v-if="detailItem" class="form-dialog" style="max-width: 480px"
        ><header class="dialog-head">
          <div>
            <div class="eyebrow">Detalhes</div>
            <h2 class="dialog-title">{{ detailItem.description }}</h2>
          </div>
          <q-space /><q-btn flat round icon="close" v-close-popup />
        </header>
        <q-card-section class="dialog-body detail-grid"
          ><div>
            <span>Tipo</span
            ><strong>{{ detailItem.type === 'income' ? 'Entrada' : 'Saída' }}</strong>
          </div>
          <div>
            <span>Valor</span><strong>{{ formatCurrency(detailItem.amount) }}</strong>
          </div>
          <div>
            <span>Data</span
            ><strong>{{
              formatDate(detailItem.date, { day: '2-digit', month: 'long', year: 'numeric' })
            }}</strong>
          </div>
          <div>
            <span>Categoria</span><strong>{{ detailItem.category || 'Sem categoria' }}</strong>
          </div>
          <div v-if="studentName(detailItem.studentId)">
            <span>Aluno</span><strong>{{ studentName(detailItem.studentId) }}</strong>
          </div>
          <div v-if="detailItem.notes" class="detail-notes">
            <span>Observações</span>
            <p>{{ detailItem.notes }}</p>
          </div></q-card-section
        ></q-card
      ></q-dialog
    >
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import type { Transaction, TransactionType } from '@/models';
import { currentPeriodKey, useAppStore } from '@/stores/app-store';
import { formatCurrency, formatDate, monthLabel } from '@/utils/format';

const $q = useQuasar();
const store = useAppStore();
const route = useRoute();
const router = useRouter();
const periodKey = ref(currentPeriodKey());
const search = ref('');
const typeFilter = ref<'all' | TransactionType>('all');
const categoryFilter = ref<string | null>(null);
const formOpen = ref(false);
const balanceOpen = ref(false);
const balanceValue = ref(0);
const detailsOpen = ref(false);
const detailItem = ref<Transaction | null>(null);
const period = computed(() => store.ensurePeriod(periodKey.value));
const summary = computed(() => store.periodSummary(periodKey.value));
const periodTransactions = computed(() =>
  store.transactions.filter((item) => item.periodKey === periodKey.value),
);
const incomeCount = computed(
  () => periodTransactions.value.filter((i) => i.type === 'income').length,
);
const expenseCount = computed(
  () => periodTransactions.value.filter((i) => i.type === 'expense').length,
);
const allCategories = computed(() =>
  [...new Set([...store.settings.categories.income, ...store.settings.categories.expense])].sort(),
);
const categoryOptions = computed(() => store.settings.categories[transactionForm.type]);
const studentOptions = computed(() =>
  store.activeStudents
    .map((s) => ({ label: s.name, value: s.id }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
);
const filteredTransactions = computed(() =>
  periodTransactions.value
    .filter((item) => {
      const term = search.value.toLocaleLowerCase('pt-BR');
      return (
        item.description.toLocaleLowerCase('pt-BR').includes(term) &&
        (typeFilter.value === 'all' || item.type === typeFilter.value) &&
        (!categoryFilter.value || item.category === categoryFilter.value)
      );
    })
    .sort((a, b) => `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`)),
);
const blankTransaction = (type: TransactionType = 'income') => ({
  id: '',
  periodKey: periodKey.value,
  date: `${periodKey.value}-${String(Math.min(new Date().getDate(), 28)).padStart(2, '0')}`,
  description: '',
  type,
  amount: 0,
  category: '',
  notes: '',
  studentId: undefined as string | undefined,
});
const transactionForm = reactive(blankTransaction());
function moveMonth(offset: number) {
  const [year, month] = periodKey.value.split('-').map(Number);
  periodKey.value = currentPeriodKey(new Date(year!, month! - 1 + offset, 1));
}
function openTransaction(item?: Transaction, type: TransactionType = 'income') {
  Object.assign(transactionForm, item ? structuredClone(item) : blankTransaction(type));
  formOpen.value = true;
}
function dateInPeriod(value: string) {
  return value?.startsWith(periodKey.value) || `Escolha uma data de ${monthLabel(periodKey.value)}`;
}
function saveTransaction() {
  const { id, studentId, ...payload } = transactionForm;
  store.saveTransaction({
    ...payload,
    periodKey: periodKey.value,
    ...(id ? { id } : {}),
    ...(studentId ? { studentId } : {}),
  });
  formOpen.value = false;
  $q.notify({ type: 'positive', message: 'Lançamento salvo com sucesso.' });
  void router.replace({ query: {} });
}
function saveBalance() {
  store.updateOpeningBalance(periodKey.value, balanceValue.value);
  balanceOpen.value = false;
  $q.notify({ type: 'positive', message: 'Saldo inicial atualizado.' });
}
function studentName(id?: string) {
  return id ? store.students.find((s) => s.id === id)?.name : '';
}
function showDetails(item: Transaction) {
  detailItem.value = item;
  detailsOpen.value = true;
}
function confirmRemove(item: Transaction) {
  $q.dialog({
    title: 'Excluir lançamento?',
    message: `“${item.description}” será removido e o saldo será recalculado.`,
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Excluir', color: 'negative', unelevated: true },
    persistent: true,
  }).onOk(() => {
    store.removeTransaction(item.id);
    $q.notify({ message: 'Lançamento excluído.', color: 'primary', icon: 'check' });
  });
}
function confirmClose() {
  $q.dialog({
    title: 'Fechar este mês?',
    message: `O saldo final de ${formatCurrency(summary.value.balance)} será levado ao próximo mês.`,
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Fechar mês', color: 'primary', unelevated: true },
    persistent: true,
  }).onOk(() => {
    periodKey.value = store.closePeriod(periodKey.value);
    $q.notify({ type: 'positive', message: 'Mês fechado. O próximo período está pronto.' });
  });
}
onMounted(() => {
  const type = route.query.tipo;
  if (type === 'income' || type === 'expense') openTransaction(undefined, type);
});
</script>

<style scoped>
.month-toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
  padding: 9px 14px;
}
.month-label {
  display: flex;
  min-width: 220px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 0;
  background: transparent;
  color: var(--ink);
  text-transform: capitalize;
  cursor: pointer;
}
.closed-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 11px;
  border-radius: 10px;
  background: var(--studio-background);
  color: var(--muted);
  font-size: 12px;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}
.summary-card {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 18px;
}
.summary-card > div:nth-child(2) {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.summary-card span,
.summary-card small {
  color: var(--muted);
  font-size: 11px;
}
.summary-card strong {
  margin-top: 4px;
  font:
    700 19px 'Playfair Display',
    serif;
}
.summary-icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 13px;
  background: var(--green-soft);
  color: var(--positive);
  font-size: 21px;
}
.summary-icon.neutral {
  background: var(--studio-background);
  color: var(--studio-text-muted);
}
.summary-card.expense .summary-icon {
  background: var(--orange-soft);
  color: var(--q-primary);
}
.summary-card.balance {
  background: var(--q-dark);
  color: #fff;
}
.summary-card.balance span,
.summary-card.balance small {
  color: var(--studio-primary-soft);
}
.summary-card.balance .summary-icon {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}
.transactions {
  overflow: hidden;
}
.transactions-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 24px;
  border-bottom: 1px solid var(--line);
}
.transaction-actions {
  display: flex;
  gap: 8px;
}
.transaction-filters {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 160px 190px;
  gap: 10px;
  padding: 14px 24px;
  background: var(--studio-background);
}
.transaction-table {
  width: 100%;
  overflow-x: auto;
}
.table-head,
.table-row {
  display: grid;
  min-width: 850px;
  grid-template-columns: 90px minmax(250px, 1.6fr) 150px 140px 140px 38px;
  align-items: center;
  gap: 8px;
  padding: 0 22px;
}
.table-head {
  height: 42px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.table-row {
  min-height: 67px;
  border-top: 1px solid var(--line);
  font-size: 12px;
}
.tx-date {
  color: var(--muted);
  text-transform: capitalize;
}
.tx-description {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}
.tx-description > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.tx-description strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tx-description small {
  color: var(--muted);
}
.tx-icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  place-items: center;
  border-radius: 10px;
  background: var(--green-soft);
  color: var(--positive);
}
.tx-icon.expense {
  background: var(--orange-soft);
  color: var(--q-primary);
}
.category-tag {
  width: max-content;
  padding: 4px 8px;
  border-radius: 8px;
  background: var(--studio-background);
  color: var(--muted);
}
.income-value {
  color: var(--positive);
}
.expense-value {
  color: var(--q-negative);
}
.transaction-form {
  display: grid;
  gap: 5px;
}
.two-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.detail-grid > div {
  display: flex;
  flex-direction: column;
}
.detail-grid span {
  color: var(--muted);
  font-size: 11px;
}
.detail-grid strong {
  margin-top: 4px;
}
.detail-notes {
  grid-column: 1/-1;
}
.detail-notes p {
  margin: 4px 0;
  padding: 12px;
  border-radius: 10px;
  background: var(--studio-background);
}
@media (max-width: 1100px) {
  .summary-grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 700px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
  .summary-card {
    padding: 15px;
  }
  .transactions-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 13px;
  }
  .transaction-actions {
    width: 100%;
  }
  .transaction-actions > .q-btn {
    flex: 1;
  }
  .transaction-filters {
    grid-template-columns: 1fr;
    padding: 12px 16px;
  }
  .month-toolbar {
    padding: 7px;
  }
  .month-label {
    min-width: 150px;
  }
  .month-toolbar > .q-btn:last-child {
    font-size: 0;
  }
  .month-toolbar > .q-btn:last-child .q-icon {
    font-size: 20px;
  }
  .two-fields {
    grid-template-columns: 1fr;
  }
}
</style>
