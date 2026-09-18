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

        <section class="surface settings-section profile-section">
          <header>
            <span class="setting-icon grey"><q-icon name="storage" /></span>
            <div>
              <h2 class="section-title">Perfil de dados</h2>
              <p>Escolha entre uma base pronta para uso ou dados de demonstração.</p>
            </div>
          </header>
          <div class="profile-settings">
            <div class="profile-field">
              <div class="field-copy">
                <strong>Perfil atual</strong>
                <span>A troca remove todos os alunos, aulas e lançamentos existentes.</span>
              </div>
              <q-select
                :model-value="store.settings.dataProfile"
                outlined
                dense
                emit-value
                map-options
                :disable="store.settings.profileLocked"
                :options="profileOptions"
                @update:model-value="confirmProfileChange"
              />
            </div>
            <q-separator />
            <div class="profile-lock">
              <div class="field-copy">
                <strong>Travar modo de produção</strong>
                <span
                  >Impede a troca de perfil e protege os dados contra substituição acidental.</span
                >
              </div>
              <q-toggle
                v-model="store.settings.profileLocked"
                color="primary"
                :disable="store.settings.dataProfile !== 'production'"
                :label="store.settings.profileLocked ? 'Travado' : 'Destravado'"
              />
            </div>
            <div v-if="store.settings.profileLocked" class="profile-locked-note">
              <q-icon name="lock" />
              <span
                >Modo de produção protegido. Desative a trava para permitir trocas de perfil.</span
              >
            </div>
            <div class="data-summary">
              <span
                ><strong>{{ store.students.length }}</strong> alunos</span
              >
              <span
                ><strong>{{ store.lessons.length }}</strong> aulas registradas</span
              >
              <span
                ><strong>{{ store.transactions.length }}</strong> lançamentos</span
              >
            </div>
          </div>
        </section>

        <section class="surface settings-section backup-section">
          <header>
            <span class="setting-icon blue"><q-icon name="cloud_sync" /></span>
            <div>
              <h2 class="section-title">Backup e restauração</h2>
              <p>Exporte todos os dados ou restaure um arquivo salvo anteriormente.</p>
            </div>
          </header>
          <div class="backup-content">
            <div class="backup-copy">
              <q-icon name="verified_user" />
              <div>
                <strong>Backup completo em JSON</strong>
                <span>Inclui alunos, aulas, recorrências, financeiro e configurações.</span>
              </div>
            </div>
            <div class="backup-actions">
              <q-btn
                outline
                no-caps
                color="primary"
                icon="download"
                label="Exportar backup"
                @click="exportBackup"
              />
              <q-btn
                unelevated
                no-caps
                color="primary"
                icon="upload_file"
                label="Importar backup"
                :disable="store.settings.profileLocked"
                @click="selectBackupFile"
              />
              <input
                ref="backupInput"
                class="backup-file-input"
                type="file"
                accept="application/json,.json"
                @change="handleBackupFile"
              />
            </div>
            <div v-if="store.settings.profileLocked" class="backup-lock-warning">
              <q-icon name="lock" /> Desative a trava do modo de produção para importar dados.
            </div>
          </div>
        </section>
      </div>
    </main>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import type { DataProfile } from '@/models';
import { useAppStore } from '@/stores/app-store';
import { weekdays } from '@/utils/format';

const $q = useQuasar();
const store = useAppStore();
const categoryTab = ref<'income' | 'expense'>('income');
const newIncome = ref('');
const newExpense = ref('');
const backupInput = ref<HTMLInputElement | null>(null);
const durationOptions = [30, 40, 45, 50, 60, 75, 90].map((value) => ({
  label: `${value} minutos`,
  value,
}));
const profileOptions: Array<{ label: string; value: DataProfile }> = [
  { label: 'Pronto para uso', value: 'production' },
  { label: 'Demonstração com dados', value: 'demo' },
];
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
function confirmProfileChange(profile: DataProfile | null) {
  if (!profile || profile === store.settings.dataProfile) return;
  if (store.settings.profileLocked) {
    $q.notify({
      type: 'warning',
      message: 'Desative a trava de produção antes de trocar o perfil.',
    });
    return;
  }
  const targetLabel = profileOptions.find((option) => option.value === profile)?.label ?? profile;
  $q.dialog({
    title: `Trocar para “${targetLabel}”?`,
    message:
      'Todos os alunos, aulas, períodos financeiros e lançamentos atuais serão excluídos. Essa ação não pode ser desfeita.',
    cancel: { label: 'Manter perfil atual', flat: true },
    ok: { label: 'Trocar e apagar dados', color: 'negative', unelevated: true },
    persistent: true,
  }).onOk(() => {
    if (!store.switchDataProfile(profile)) return;
    $q.notify({ type: 'positive', message: `Perfil alterado para “${targetLabel}”.` });
  });
}
function exportBackup() {
  const content = JSON.stringify(store.createBackup(), null, 2);
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `larissa-silva-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  $q.notify({ type: 'positive', message: 'Backup exportado com sucesso.' });
}
function selectBackupFile() {
  if (store.settings.profileLocked) {
    $q.notify({ type: 'warning', message: 'Desative a trava de produção antes de importar.' });
    return;
  }
  backupInput.value?.click();
}
async function handleBackupFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  try {
    const payload = JSON.parse(await file.text()) as unknown;
    $q.dialog({
      title: 'Importar este backup?',
      message:
        'Todos os dados atuais serão substituídos pelo conteúdo do arquivo. Essa ação não pode ser desfeita.',
      cancel: { label: 'Cancelar', flat: true },
      ok: { label: 'Importar e substituir', color: 'negative', unelevated: true },
      persistent: true,
    }).onOk(() => {
      try {
        store.importBackup(payload);
        $q.notify({ type: 'positive', message: 'Backup importado com sucesso.' });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Não foi possível importar o backup.';
        $q.notify({ type: 'negative', message });
      }
    });
  } catch {
    $q.notify({ type: 'negative', message: 'O arquivo selecionado não contém um JSON válido.' });
  }
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
.single-setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 24px 22px;
  padding: 15px;
  border-radius: 12px;
  background: var(--studio-background);
}
.single-setting > div {
  display: flex;
  flex-direction: column;
}
.single-setting span {
  margin-top: 3px;
  color: var(--muted);
  font-size: 11px;
}
.profile-settings {
  display: grid;
  gap: 18px;
  padding: 22px 24px;
}
.profile-field,
.profile-lock {
  display: grid;
  grid-template-columns: 1fr 240px;
  align-items: center;
  gap: 18px;
}
.profile-lock .q-toggle {
  justify-self: end;
}
.profile-locked-note {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 13px;
  border-radius: 10px;
  background: var(--studio-primary-soft);
  color: var(--q-primary);
  font-size: 12px;
}
.data-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.data-summary span {
  display: flex;
  flex-direction: column;
  padding: 12px;
  border-radius: 10px;
  background: var(--studio-background);
  color: var(--muted);
  font-size: 11px;
}
.data-summary strong {
  color: var(--ink);
  font-size: 18px;
}
.backup-content {
  display: grid;
  gap: 16px;
  padding: 22px 24px;
}
.backup-copy {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  background: var(--studio-background);
}
.backup-copy > .q-icon {
  color: var(--q-positive);
  font-size: 25px;
}
.backup-copy > div {
  display: flex;
  flex-direction: column;
}
.backup-copy span {
  margin-top: 3px;
  color: var(--muted);
  font-size: 11px;
}
.backup-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
}
.backup-file-input {
  display: none;
}
.backup-lock-warning {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--q-warning);
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
  .profile-field,
  .profile-lock {
    grid-template-columns: 1fr;
  }
  .profile-lock .q-toggle {
    justify-self: start;
  }
  .data-summary {
    grid-template-columns: 1fr;
  }
  .backup-actions {
    grid-template-columns: 1fr;
  }
}
</style>
