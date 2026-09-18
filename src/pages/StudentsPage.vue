<template>
  <q-page>
    <main class="page-wrap">
      <header class="page-head">
        <div>
          <div class="eyebrow">Cadastros</div>
          <h1 class="page-title">Alunos</h1>
          <p class="page-subtitle">Gerencie alunos, horários fixos e histórico de aulas.</p>
        </div>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="person_add"
          label="Novo aluno"
          class="primary-btn"
          @click="openForm()"
        />
      </header>

      <section class="filters surface-flat">
        <q-input
          v-model="search"
          outlined
          dense
          clearable
          debounce="150"
          placeholder="Buscar por nome ou telefone"
          class="search-input"
          ><template #prepend><q-icon name="search" /></template
        ></q-input>
        <q-btn-toggle
          v-model="statusFilter"
          no-caps
          unelevated
          toggle-color="primary"
          color="white"
          text-color="grey-8"
          :options="statusOptions"
        />
        <q-select
          v-model="dayFilter"
          outlined
          dense
          emit-value
          map-options
          clearable
          label="Dia da semana"
          :options="dayOptions"
          class="day-filter"
        />
        <span class="result-count"
          >{{ filteredStudents.length }}
          {{ filteredStudents.length === 1 ? 'aluno' : 'alunos' }}</span
        >
      </section>

      <section v-if="filteredStudents.length" class="student-grid">
        <article v-for="student in filteredStudents" :key="student.id" class="student-card surface">
          <div class="student-top">
            <div class="initials">{{ initials(student.name) }}</div>
            <div class="student-name">
              <strong>{{ student.name }}</strong
              ><span>{{ student.phone || 'Telefone não informado' }}</span>
            </div>
            <q-btn flat round dense icon="more_horiz" aria-label="Mais ações">
              <q-menu auto-close
                ><q-list style="min-width: 170px">
                  <q-item clickable @click="openDetails(student)"
                    ><q-item-section avatar><q-icon name="visibility" /></q-item-section
                    ><q-item-section>Ver ficha</q-item-section></q-item
                  >
                  <q-item clickable @click="openForm(student)"
                    ><q-item-section avatar><q-icon name="edit" /></q-item-section
                    ><q-item-section>Editar</q-item-section></q-item
                  >
                  <q-item clickable @click="toggle(student)"
                    ><q-item-section avatar
                      ><q-icon
                        :name="student.active ? 'person_off' : 'person_add_alt'" /></q-item-section
                    ><q-item-section>{{
                      student.active ? 'Inativar' : 'Reativar'
                    }}</q-item-section></q-item
                  >
                </q-list></q-menu
              >
            </q-btn>
          </div>
          <div class="student-state">
            <span :class="['state-dot', { inactive: !student.active }]" />{{
              student.active ? 'Ativo' : 'Inativo'
            }}
          </div>
          <div class="schedule-list">
            <div
              v-for="schedule in student.schedules.slice(0, 3)"
              :key="schedule.id"
              class="schedule-row"
            >
              <q-icon name="calendar_today" /><span>{{ weekdayName(schedule.weekday) }}</span
              ><strong>{{ schedule.time }}</strong
              ><small>{{ schedule.duration }} min</small>
            </div>
            <div v-if="!student.schedules.length" class="no-schedule">
              <q-icon name="event_busy" /> Sem horário definido
            </div>
            <small v-if="student.schedules.length > 3" class="more-schedules"
              >+ {{ student.schedules.length - 3 }} horário(s)</small
            >
          </div>
          <div class="student-actions">
            <q-btn
              flat
              no-caps
              color="primary"
              icon="assignment_ind"
              label="Abrir ficha"
              @click="openDetails(student)"
            />
            <q-btn
              flat
              round
              color="grey-7"
              icon="edit"
              aria-label="Editar aluno"
              @click="openForm(student)"
            />
          </div>
        </article>
      </section>
      <section v-else class="surface empty-state">
        <q-icon name="person_search" size="46px" /><strong>Nenhum aluno encontrado</strong>
        <div>Ajuste os filtros ou cadastre um novo aluno.</div>
      </section>
    </main>

    <q-dialog v-model="formOpen" :position="$q.screen.lt.sm ? 'bottom' : 'standard'" persistent>
      <q-card class="form-dialog form-dialog--wide">
        <header class="dialog-head">
          <div>
            <div class="eyebrow">{{ form.id ? 'Editar cadastro' : 'Novo cadastro' }}</div>
            <h2 class="dialog-title">{{ form.id ? form.name : 'Adicionar aluno' }}</h2>
          </div>
          <q-space /><q-btn flat round icon="close" v-close-popup />
        </header>
        <q-form ref="studentForm" @submit="saveStudent">
          <q-card-section class="dialog-body">
            <div class="form-grid">
              <q-input
                v-model="form.name"
                outlined
                label="Nome completo *"
                :rules="[(v) => !!v.trim() || 'Informe o nome']"
              />
              <q-input
                v-model="form.phone"
                outlined
                label="Telefone / WhatsApp"
                mask="(##) #####-####"
                unmasked-value
              />
              <q-input
                v-model="form.birthday"
                outlined
                label="Data de nascimento"
                type="date"
                stack-label
              />
              <q-select
                v-model="form.active"
                outlined
                emit-value
                map-options
                label="Status"
                :options="[
                  { label: 'Ativo', value: true },
                  { label: 'Inativo', value: false },
                ]"
              />
              <q-input
                v-model="form.notes"
                outlined
                autogrow
                label="Observações"
                class="full-field"
              />
            </div>
            <div class="schedule-head">
              <div>
                <h3>Horários de aula</h3>
                <span>Um aluno pode ter vários horários semanais.</span>
              </div>
              <q-btn
                outline
                no-caps
                color="primary"
                icon="add"
                label="Adicionar horário"
                @click="addSchedule"
              />
            </div>
            <div v-if="form.schedules.length" class="schedule-editor">
              <div
                v-for="(schedule, index) in form.schedules"
                :key="schedule.id"
                class="schedule-edit-row"
              >
                <q-select
                  v-model="schedule.weekday"
                  outlined
                  dense
                  emit-value
                  map-options
                  label="Dia"
                  :options="dayOptions"
                />
                <q-input
                  v-model="schedule.time"
                  outlined
                  dense
                  type="time"
                  label="Horário"
                  stack-label
                />
                <q-input
                  v-model.number="schedule.duration"
                  outlined
                  dense
                  type="number"
                  min="15"
                  step="5"
                  label="Duração (min)"
                />
                <q-select
                  v-model="schedule.kind"
                  outlined
                  dense
                  emit-value
                  map-options
                  label="Tipo"
                  :options="[
                    { label: 'Fixo', value: 'fixed' },
                    { label: 'Avulso', value: 'single' },
                  ]"
                />
                <q-btn
                  flat
                  round
                  dense
                  color="negative"
                  icon="delete_outline"
                  aria-label="Remover horário"
                  @click="form.schedules.splice(index, 1)"
                />
              </div>
            </div>
            <div v-else class="schedule-empty">
              Nenhum horário adicionado. Você pode completar isso mais tarde.
            </div>
          </q-card-section>
          <q-card-actions align="right" class="dialog-actions"
            ><q-btn flat no-caps label="Cancelar" v-close-popup /><q-btn
              unelevated
              no-caps
              color="primary"
              label="Salvar aluno"
              type="submit"
              class="primary-btn"
          /></q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="detailsOpen" :position="$q.screen.lt.sm ? 'bottom' : 'standard'">
      <q-card v-if="selected" class="form-dialog form-dialog--wide">
        <header class="dialog-head">
          <div class="initials big">{{ initials(selected.name) }}</div>
          <div>
            <h2 class="dialog-title">{{ selected.name }}</h2>
            <span class="section-caption"
              >Aluno desde
              {{
                formatDate(selected.createdAt, { day: '2-digit', month: 'long', year: 'numeric' })
              }}</span
            >
          </div>
          <q-space /><q-btn flat round icon="close" v-close-popup />
        </header>
        <q-card-section class="dialog-body details-body">
          <div class="contact-strip">
            <div>
              <q-icon name="phone" /><span>{{ selected.phone || 'Não informado' }}</span>
            </div>
            <q-btn
              v-if="selected.phone"
              flat
              no-caps
              color="positive"
              icon="chat"
              label="WhatsApp"
              :href="phoneHref(selected.phone)"
              target="_blank"
            />
          </div>
          <div>
            <div class="schedule-head">
              <div>
                <h3>Agenda semanal</h3>
                <span>{{ selected.schedules.length }} horário(s) cadastrado(s)</span>
              </div>
            </div>
            <div class="detail-schedules">
              <div v-for="item in selected.schedules" :key="item.id">
                <span>{{ weekdayName(item.weekday) }}</span
                ><strong>{{ item.time }}</strong
                ><small
                  >{{ item.duration }} min · {{ item.kind === 'fixed' ? 'Fixo' : 'Avulso' }}</small
                >
              </div>
              <p v-if="!selected.schedules.length">Sem horários cadastrados.</p>
            </div>
          </div>
          <div>
            <div class="schedule-head">
              <div>
                <h3>Histórico de aulas</h3>
                <span>Ocorrências registradas</span>
              </div>
            </div>
            <div v-if="studentHistory.length" class="history-list">
              <div v-for="lesson in studentHistory" :key="lesson.id">
                <div class="history-date">
                  {{ formatDate(lesson.date, { day: '2-digit', month: 'short' })
                  }}<small>{{ lesson.time }}</small>
                </div>
                <span :class="['pill', `status-${lesson.status}`]">{{
                  statusLabel(lesson.status)
                }}</span>
                <p>{{ lesson.notes || 'Sem observações' }}</p>
              </div>
            </div>
            <div v-else class="schedule-empty">Nenhuma ocorrência registrada ainda.</div>
          </div>
          <div v-if="selected.notes" class="notes-box">
            <strong>Observações</strong>
            <p>{{ selected.notes }}</p>
          </div>
        </q-card-section>
        <q-card-actions align="between" class="dialog-actions"
          ><q-btn
            flat
            no-caps
            :color="selected.active ? 'negative' : 'positive'"
            :label="selected.active ? 'Inativar aluno' : 'Reativar aluno'"
            @click="toggle(selected)" /><q-btn
            unelevated
            no-caps
            color="primary"
            icon="edit"
            label="Editar cadastro"
            @click="
              detailsOpen = false;
              openForm(selected);
            "
        /></q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useQuasar, type QForm } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import type { Schedule, Student } from '@/models';
import { uid, useAppStore } from '@/stores/app-store';
import { cloneData } from '@/utils/clone';
import { formatDate, phoneHref, statusLabel, weekdays } from '@/utils/format';

const $q = useQuasar();
const store = useAppStore();
const route = useRoute();
const router = useRouter();
const search = ref('');
const statusFilter = ref<'all' | 'active' | 'inactive'>('active');
const dayFilter = ref<number | null>(null);
const formOpen = ref(false);
const detailsOpen = ref(false);
const selected = ref<Student | null>(null);
const studentForm = ref<QForm | null>(null);
const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Ativos', value: 'active' },
  { label: 'Inativos', value: 'inactive' },
];
const dayOptions = weekdays.map(({ value, label }) => ({ value, label }));
const blankForm = () => ({
  id: '',
  name: '',
  phone: '',
  birthday: '',
  notes: '',
  active: true,
  schedules: [] as Schedule[],
});
const form = reactive(blankForm());
const filteredStudents = computed(() =>
  store.students
    .filter((student) => {
      const term = search.value.toLocaleLowerCase('pt-BR');
      const matchesText =
        student.name.toLocaleLowerCase('pt-BR').includes(term) || student.phone.includes(term);
      const matchesStatus =
        statusFilter.value === 'all' ||
        (statusFilter.value === 'active' ? student.active : !student.active);
      const matchesDay =
        !dayFilter.value || student.schedules.some((item) => item.weekday === dayFilter.value);
      return matchesText && matchesStatus && matchesDay;
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
);
const studentHistory = computed(() =>
  selected.value
    ? store.lessons
        .filter((item) => item.studentId === selected.value!.id)
        .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
    : [],
);
const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((item) => item[0])
    .join('')
    .toUpperCase();
const weekdayName = (day: number) => weekdays.find((item) => item.value === day)?.label ?? '';
function openForm(student?: Student) {
  Object.assign(form, student ? cloneData(student) : blankForm());
  formOpen.value = true;
}
function addSchedule() {
  form.schedules.push({
    id: uid(),
    weekday: 1,
    time: store.settings.startTime,
    duration: store.settings.defaultDuration,
    kind: 'fixed',
    notes: '',
  });
}
function saveStudent() {
  const { id, ...payload } = cloneData(form);
  store.saveStudent({ ...payload, ...(id ? { id } : {}) });
  formOpen.value = false;
  $q.notify({ type: 'positive', message: 'Aluno salvo com sucesso.' });
  void router.replace({ query: {} });
}
function openDetails(student: Student) {
  selected.value = student;
  detailsOpen.value = true;
}
function toggle(student: Student) {
  store.toggleStudent(student.id);
  $q.notify({
    message: student.active ? 'Aluno reativado.' : 'Aluno inativado.',
    color: 'primary',
    icon: 'check',
  });
}
onMounted(() => {
  if (route.query.novo === '1') openForm();
});
</script>

<style scoped>
.filters {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 22px;
  padding: 14px;
}
.search-input {
  width: min(360px, 100%);
}
.day-filter {
  width: 180px;
}
.result-count {
  margin-left: auto;
  color: var(--muted);
  font-size: 12px;
}
.student-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}
.student-card {
  display: flex;
  min-height: 285px;
  flex-direction: column;
  padding: 20px;
}
.student-top {
  display: flex;
  align-items: center;
  gap: 12px;
}
.initials {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  place-items: center;
  border-radius: 14px;
  background: var(--green-soft);
  color: var(--q-primary);
  font-weight: 700;
}
.initials.big {
  width: 54px;
  height: 54px;
  flex-basis: 54px;
  border-radius: 17px;
  font-size: 17px;
}
.student-name {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.student-name strong {
  overflow: hidden;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.student-name span {
  margin-top: 3px;
  color: var(--muted);
  font-size: 12px;
}
.student-state {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 15px 0;
  color: var(--muted);
  font-size: 11px;
}
.state-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--positive);
}
.state-dot.inactive {
  background: var(--studio-text-muted);
}
.schedule-list {
  display: grid;
  gap: 7px;
}
.schedule-row {
  display: grid;
  grid-template-columns: 20px 1fr auto auto;
  align-items: center;
  gap: 7px;
  padding: 8px 9px;
  border-radius: 9px;
  background: var(--studio-background);
  font-size: 12px;
}
.schedule-row .q-icon {
  color: var(--q-primary);
}
.schedule-row small,
.no-schedule,
.more-schedules {
  color: var(--muted);
}
.no-schedule {
  padding: 14px 0;
}
.student-actions {
  display: flex;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 15px;
  border-top: 1px solid var(--line);
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 14px;
}
.full-field {
  grid-column: 1/-1;
}
.schedule-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 20px 0 12px;
}
.schedule-head h3 {
  margin: 0;
  font-size: 14px;
}
.schedule-head span {
  color: var(--muted);
  font-size: 11px;
}
.schedule-editor {
  display: grid;
  gap: 9px;
}
.schedule-edit-row {
  display: grid;
  grid-template-columns: 1.1fr 0.85fr 0.9fr 0.9fr 34px;
  align-items: center;
  gap: 8px;
}
.schedule-empty {
  padding: 18px;
  border: 1px dashed var(--studio-border);
  border-radius: 12px;
  color: var(--muted);
  text-align: center;
}
.details-body {
  display: grid;
  gap: 8px;
}
.contact-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  border-radius: 12px;
  background: var(--studio-background);
}
.contact-strip > div {
  display: flex;
  gap: 8px;
}
.detail-schedules {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.detail-schedules > div {
  display: flex;
  flex-direction: column;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 11px;
}
.detail-schedules span,
.detail-schedules small {
  color: var(--muted);
  font-size: 11px;
}
.detail-schedules strong {
  margin: 2px 0;
}
.history-list {
  display: grid;
  gap: 8px;
}
.history-list > div {
  display: grid;
  grid-template-columns: 72px 90px 1fr;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid var(--line);
}
.history-date {
  display: flex;
  flex-direction: column;
  font-weight: 600;
}
.history-date small {
  color: var(--muted);
  font-weight: 400;
}
.history-list p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}
.notes-box {
  margin-top: 12px;
  padding: 14px;
  border-radius: 12px;
  background: var(--orange-soft);
}
.notes-box p {
  margin: 5px 0 0;
  color: var(--studio-text);
}
@media (max-width: 1100px) {
  .student-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .filters {
    flex-wrap: wrap;
  }
  .result-count {
    width: 100%;
  }
}
@media (max-width: 700px) {
  .student-grid {
    grid-template-columns: 1fr;
  }
  .filters {
    align-items: stretch;
  }
  .search-input,
  .day-filter {
    width: 100%;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  .full-field {
    grid-column: auto;
  }
  .schedule-edit-row {
    grid-template-columns: 1fr 1fr 34px;
    padding: 10px;
    border: 1px solid var(--line);
    border-radius: 12px;
  }
  .schedule-edit-row > :nth-child(4) {
    grid-column: 1/3;
  }
  .detail-schedules {
    grid-template-columns: 1fr 1fr;
  }
  .history-list > div {
    grid-template-columns: 64px 82px 1fr;
  }
}
</style>
