<template>
  <q-page>
    <main class="page-wrap">
      <header class="page-head">
        <div>
          <div class="eyebrow">Organização semanal</div>
          <h1 class="page-title">Agenda</h1>
          <p class="page-subtitle">Acompanhe horários fixos e registre cada ocorrência.</p>
        </div>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Nova aula"
          class="primary-btn"
          @click="openNewLesson()"
        />
      </header>

      <section class="agenda-toolbar surface-flat">
        <div class="date-nav">
          <q-btn
            flat
            round
            icon="chevron_left"
            aria-label="Anterior"
            @click="moveDate(view === 'week' ? -7 : -1)"
          /><q-btn flat no-caps class="date-label" @click="goToday"
            ><q-icon name="calendar_today" /><span>{{ currentLabel }}</span></q-btn
          ><q-btn
            flat
            round
            icon="chevron_right"
            aria-label="Próximo"
            @click="moveDate(view === 'week' ? 7 : 1)"
          />
        </div>
        <div class="agenda-view-options">
          <q-toggle
            v-if="view === 'week'"
            v-model="showWeekends"
            dense
            color="primary"
            label="Fim de semana"
          />
          <q-btn-toggle
            v-model="view"
            no-caps
            unelevated
            toggle-color="primary"
            color="white"
            text-color="grey-8"
            :options="[
              { label: 'Dia', value: 'day' },
              { label: 'Semana', value: 'week' },
            ]"
          />
        </div>
      </section>

      <section v-if="view === 'week'" class="week-board surface">
        <div class="week-scroll">
          <div
            class="week-grid"
            :style="{
              gridTemplateColumns: `repeat(${weekDays.length}, 1fr)`,
              minWidth: `${Math.max(weekDays.length * 180, 600)}px`,
            }"
          >
            <div
              v-for="day in weekDays"
              :key="day.date"
              :class="['day-column', { today: day.date === today }]"
            >
              <header>
                <span>{{ day.short }}</span
                ><strong>{{ day.day }}</strong
                ><small
                  >{{ day.items.length }} {{ day.items.length === 1 ? 'aula' : 'aulas' }}</small
                >
              </header>
              <div class="day-items">
                <button
                  v-for="group in groupByTime(day.items)"
                  :key="group.time"
                  type="button"
                  class="time-card"
                  @click="openGroup(group.items)"
                >
                  <div class="time-card-head">
                    <strong>{{ group.time }}</strong
                    ><span v-if="group.items.length > 1"
                      ><q-icon name="group" /> {{ group.items.length }}</span
                    >
                  </div>
                  <div v-for="item in group.items.slice(0, 3)" :key="item.id" class="mini-person">
                    <span :class="['status-dot', item.status]"></span
                    ><span>{{ item.studentName }}</span>
                  </div>
                  <small v-if="group.items.length > 3"
                    >+ {{ group.items.length - 3 }} aluno(s)</small
                  >
                </button>
                <button type="button" class="add-slot" @click="openNewLesson(day.date)">
                  <q-icon name="add" /> Adicionar aula
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-else class="day-view surface">
        <header class="day-view-head">
          <div>
            <span>{{ formatDate(selectedDate, { weekday: 'long' }) }}</span
            ><strong>{{
              formatDate(selectedDate, { day: '2-digit', month: 'long', year: 'numeric' })
            }}</strong>
          </div>
          <div class="day-summary">
            <span
              ><b>{{ dayItems.filter((i) => i.status === 'completed').length }}</b> realizadas</span
            ><span
              ><b>{{ dayItems.length }}</b> total</span
            >
          </div>
        </header>
        <div v-if="dayItems.length" class="timeline">
          <article v-for="item in dayItems" :key="item.id" class="timeline-item">
            <time
              >{{ item.time }}<small>{{ item.duration }} min</small></time
            >
            <div :class="['timeline-marker', item.status]"></div>
            <div class="timeline-card surface-flat">
              <div class="timeline-person">
                <div class="student-avatar">{{ initials(item.studentName) }}</div>
                <div>
                  <strong>{{ item.studentName }}</strong
                  ><span
                    >{{ item.isRecurring ? 'Horário recorrente' : 'Aula avulsa'
                    }}<template v-if="item.notes"> · {{ item.notes }}</template></span
                  >
                </div>
              </div>
              <span :class="['pill', `status-${item.status}`]">{{ statusLabel(item.status) }}</span
              ><q-btn flat round dense icon="more_vert" aria-label="Ações"
                ><q-menu auto-close
                  ><q-list style="min-width: 190px"
                    ><q-item
                      v-for="status in lessonStatuses"
                      :key="status.value"
                      clickable
                      @click="setStatus(item, status.value)"
                      ><q-item-section avatar><q-icon :name="status.icon" /></q-item-section
                      ><q-item-section>{{ status.label }}</q-item-section></q-item
                    ><q-separator /><q-item clickable @click="openEdit(item)"
                      ><q-item-section avatar><q-icon name="edit_calendar" /></q-item-section
                      ><q-item-section>Alterar / remarcar</q-item-section></q-item
                    ></q-list
                  ></q-menu
                ></q-btn
              >
            </div>
          </article>
        </div>
        <div v-else class="empty-state">
          <q-icon name="event_available" size="46px" /><strong>Dia livre</strong>
          <div>Não há aulas agendadas para esta data.</div>
          <q-btn
            class="q-mt-md"
            outline
            no-caps
            color="primary"
            label="Agendar aula"
            @click="openNewLesson(selectedDate)"
          />
        </div>
      </section>
    </main>

    <q-dialog v-model="groupOpen" :position="$q.screen.lt.sm ? 'bottom' : 'standard'">
      <q-card class="form-dialog"
        ><header class="dialog-head">
          <div>
            <div class="eyebrow">{{ groupItems[0]?.time }}</div>
            <h2 class="dialog-title">Alunos neste horário</h2>
          </div>
          <q-space /><q-btn flat round icon="close" v-close-popup />
        </header>
        <q-card-section class="dialog-body group-list"
          ><div v-for="item in groupItems" :key="item.id">
            <div class="student-avatar">{{ initials(item.studentName) }}</div>
            <div>
              <strong>{{ item.studentName }}</strong
              ><span>{{ item.duration }} min · {{ statusLabel(item.status) }}</span>
            </div>
            <q-btn flat round icon="more_horiz"
              ><q-menu auto-close
                ><q-list
                  ><q-item
                    v-for="status in lessonStatuses"
                    :key="status.value"
                    clickable
                    @click="setStatus(item, status.value)"
                    ><q-item-section>{{ status.label }}</q-item-section></q-item
                  ><q-item clickable @click="openEdit(item)"
                    ><q-item-section>Alterar aula</q-item-section></q-item
                  ></q-list
                ></q-menu
              ></q-btn
            >
          </div></q-card-section
        ><q-card-actions class="dialog-actions" align="right"
          ><q-btn
            unelevated
            no-caps
            color="primary"
            icon="person_add"
            label="Adicionar aluno"
            @click="
              groupOpen = false;
              openNewLesson(groupItems[0]?.date, groupItems[0]?.time);
            " /></q-card-actions
      ></q-card>
    </q-dialog>

    <q-dialog v-model="formOpen" :position="$q.screen.lt.sm ? 'bottom' : 'standard'" persistent>
      <q-card class="form-dialog"
        ><header class="dialog-head">
          <div>
            <div class="eyebrow">{{ editingItem ? 'Alterar ocorrência' : 'Nova ocorrência' }}</div>
            <h2 class="dialog-title">
              {{ editingItem ? editingItem.studentName : 'Agendar aula' }}
            </h2>
          </div>
          <q-space /><q-btn flat round icon="close" v-close-popup />
        </header>
        <q-form @submit="saveLesson"
          ><q-card-section class="dialog-body"
            ><div class="lesson-form">
              <q-select
                v-model="lessonForm.studentId"
                outlined
                emit-value
                map-options
                use-input
                input-debounce="0"
                label="Aluno *"
                :options="studentOptions"
                :rules="[(v) => !!v || 'Selecione o aluno']"
              />
              <div class="two-fields">
                <q-input
                  v-model="lessonForm.date"
                  outlined
                  type="date"
                  stack-label
                  label="Data *"
                  :rules="[(v) => !!v || 'Informe a data']"
                /><q-input
                  v-model="lessonForm.time"
                  outlined
                  type="time"
                  stack-label
                  label="Horário *"
                  :rules="[(v) => !!v || 'Informe o horário']"
                />
              </div>
              <div class="two-fields">
                <q-input
                  v-model.number="lessonForm.duration"
                  outlined
                  type="number"
                  min="15"
                  step="5"
                  label="Duração (min)"
                /><q-select
                  v-model="lessonForm.status"
                  outlined
                  emit-value
                  map-options
                  label="Status"
                  :options="lessonStatuses"
                  option-value="value"
                  option-label="label"
                />
              </div>
              <q-input v-model="lessonForm.notes" outlined autogrow label="Observações" />
              <div
                v-if="conflictCount"
                :class="['conflict-alert', { full: conflictCount >= store.settings.maxCapacity }]"
              >
                <q-icon name="groups" />
                <div>
                  <strong
                    >{{ conflictCount }}
                    {{ conflictCount === 1 ? 'aluno já está' : 'alunos já estão' }} neste
                    horário</strong
                  ><span>Capacidade configurada: {{ store.settings.maxCapacity }} aluno(s).</span>
                </div>
              </div>
            </div></q-card-section
          ><q-card-actions class="dialog-actions" align="right"
            ><q-btn flat no-caps label="Cancelar" v-close-popup /><q-btn
              unelevated
              no-caps
              color="primary"
              label="Salvar aula"
              type="submit" /></q-card-actions
        ></q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import type { AgendaItem, LessonStatus } from '@/models';
import { toISODate, useAppStore } from '@/stores/app-store';
import { formatDate, lessonStatuses, statusLabel } from '@/utils/format';

const $q = useQuasar();
const store = useAppStore();
const route = useRoute();
const router = useRouter();
const today = toISODate(new Date());
const selectedDate = ref(today);
const view = ref<'day' | 'week'>('week');
const showWeekends = ref(store.settings.workingDays.some((weekday) => weekday === 6 || weekday === 7));
const formOpen = ref(false);
const groupOpen = ref(false);
const groupItems = ref<AgendaItem[]>([]);
const editingItem = ref<AgendaItem | null>(null);
const lessonForm = reactive<{
  id: string;
  studentId: string;
  scheduleId: string | undefined;
  date: string;
  time: string;
  duration: number;
  status: LessonStatus;
  notes: string;
  originalDate: string | undefined;
}>({
  id: '',
  studentId: '',
  scheduleId: undefined,
  date: today,
  time: '08:00',
  duration: 60,
  status: 'scheduled',
  notes: '',
  originalDate: undefined,
});
const studentOptions = computed(() =>
  store.activeStudents
    .map((s) => ({ label: s.name, value: s.id }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
);
const dayItems = computed(() => store.agendaForDate(selectedDate.value));
const weekStart = computed(() => {
  const date = new Date(`${selectedDate.value}T12:00:00`);
  date.setDate(date.getDate() - date.getDay());
  return date;
});
const visibleWeekdays = computed(() => {
  const workingDays = store.settings.workingDays.filter((weekday) => weekday >= 1 && weekday <= 5);
  const weekdays = workingDays.length ? workingDays : [1, 2, 3, 4, 5];
  return showWeekends.value ? [7, ...weekdays, 6] : weekdays;
});
const weekDays = computed(() =>
  visibleWeekdays.value.map((weekday) => {
    const date = new Date(weekStart.value);
    date.setDate(date.getDate() + (weekday === 7 ? 0 : weekday));
    const iso = toISODate(date);
    return {
      date: iso,
      day: date.getDate(),
      short: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
        .format(date)
        .replace('.', '')
        .toUpperCase(),
      items: store.agendaForDate(iso),
    };
  }),
);
const currentLabel = computed(() =>
  view.value === 'day'
    ? formatDate(selectedDate.value, { day: '2-digit', month: 'long', year: 'numeric' })
    : `${formatDate(weekDays.value[0]?.date ?? selectedDate.value, { day: '2-digit', month: 'short' })} — ${formatDate(weekDays.value.at(-1)?.date ?? selectedDate.value, { day: '2-digit', month: 'short', year: 'numeric' })}`,
);
const conflictCount = computed(
  () =>
    store
      .agendaForDate(lessonForm.date)
      .filter((item) => item.time === lessonForm.time && item.studentId !== lessonForm.studentId)
      .length,
);
const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((x) => x[0])
    .join('')
    .toUpperCase();
function groupByTime(items: AgendaItem[]) {
  const groups = new Map<string, AgendaItem[]>();
  items.forEach((item) => groups.set(item.time, [...(groups.get(item.time) ?? []), item]));
  return [...groups].map(([time, list]) => ({ time, items: list }));
}
function moveDate(days: number) {
  const date = new Date(`${selectedDate.value}T12:00:00`);
  date.setDate(date.getDate() + days);
  selectedDate.value = toISODate(date);
}
function goToday() {
  selectedDate.value = today;
}
function openGroup(items: AgendaItem[]) {
  groupItems.value = items;
  groupOpen.value = true;
}
function resetForm(date = today, time = '08:00') {
  Object.assign(lessonForm, {
    id: '',
    studentId: '',
    scheduleId: undefined,
    date,
    time,
    duration: store.settings.defaultDuration,
    status: 'scheduled',
    notes: '',
    originalDate: undefined,
  });
  editingItem.value = null;
}
function openNewLesson(date = selectedDate.value, time = '08:00') {
  resetForm(date, time);
  formOpen.value = true;
}
function openEdit(item: AgendaItem) {
  editingItem.value = item;
  const persisted = store.lessons.find((x) => x.id === item.id);
  Object.assign(lessonForm, {
    id: persisted?.id ?? '',
    studentId: item.studentId,
    scheduleId: item.scheduleId,
    date: item.date,
    time: item.time,
    duration: item.duration,
    status: item.status,
    notes: item.notes,
    originalDate: persisted?.originalDate ?? item.date,
  });
  groupOpen.value = false;
  formOpen.value = true;
}
function saveLesson() {
  const wasMoved = Boolean(editingItem.value && lessonForm.date !== editingItem.value.date);
  const payload = {
    studentId: lessonForm.studentId,
    date: lessonForm.date,
    time: lessonForm.time,
    duration: lessonForm.duration,
    status: lessonForm.status,
    notes: lessonForm.notes,
    ...(lessonForm.id ? { id: lessonForm.id } : {}),
    ...(lessonForm.scheduleId ? { scheduleId: lessonForm.scheduleId } : {}),
    ...(wasMoved
      ? { originalDate: lessonForm.originalDate ?? editingItem.value!.date }
      : lessonForm.originalDate
        ? { originalDate: lessonForm.originalDate }
        : {}),
  };
  store.saveLesson(payload);
  formOpen.value = false;
  selectedDate.value = lessonForm.date;
  $q.notify({
    type: 'positive',
    message: wasMoved ? 'Aula remarcada com sucesso.' : 'Aula salva com sucesso.',
  });
  void router.replace({ query: {} });
}
function setStatus(item: AgendaItem, status: LessonStatus) {
  store.setLessonStatus(item, status);
  groupOpen.value = false;
  $q.notify({
    color: 'primary',
    icon: 'check',
    message: `Aula marcada como ${statusLabel(status).toLowerCase()}.`,
  });
}
onMounted(() => {
  if (route.query.nova === '1') openNewLesson();
});
</script>

<style scoped>
.agenda-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 18px;
  padding: 10px 14px;
}
.date-nav {
  display: flex;
  align-items: center;
}
.agenda-view-options {
  display: flex;
  align-items: center;
  gap: 14px;
}
.date-label {
  min-width: 260px;
}
.date-label .q-icon {
  margin-right: 9px;
}
.week-board {
  overflow: hidden;
}
.week-scroll {
  overflow-x: auto;
}
.week-grid {
  display: grid;
  min-width: 900px;
  grid-template-columns: repeat(5, 1fr);
}
.day-column {
  min-height: 560px;
  border-right: 1px solid var(--line);
}
.day-column:last-child {
  border: 0;
}
.day-column > header {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  padding: 18px;
  border-bottom: 1px solid var(--line);
}
.day-column > header span {
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
}
.day-column > header strong {
  grid-row: 1/3;
  grid-column: 2;
  font:
    700 28px 'Playfair Display',
    serif;
}
.day-column > header small {
  color: var(--muted);
}
.day-column.today > header {
  background: var(--green-soft);
  color: var(--q-primary);
}
.day-items {
  display: grid;
  gap: 10px;
  padding: 12px;
}
.time-card,
.add-slot {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fff;
  text-align: left;
  cursor: pointer;
}
.time-card {
  padding: 12px;
  box-shadow: 0 5px 14px rgba(50, 60, 55, 0.04);
}
.time-card:hover {
  border-color: var(--q-accent);
}
.time-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 9px;
}
.time-card-head > span {
  padding: 2px 6px;
  border-radius: 8px;
  background: var(--studio-background);
  color: var(--muted);
  font-size: 10px;
}
.mini-person {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 6px 0;
  font-size: 12px;
}
.status-dot {
  width: 7px;
  height: 7px;
  flex: 0 0 7px;
  border-radius: 50%;
  background: var(--q-info);
}
.status-dot.completed,
.timeline-marker.completed {
  background: var(--positive);
}
.status-dot.absent,
.status-dot.cancelled,
.timeline-marker.absent,
.timeline-marker.cancelled {
  background: var(--negative);
}
.status-dot.rescheduled,
.timeline-marker.rescheduled {
  background: var(--warning);
}
.time-card > small {
  color: var(--muted);
}
.add-slot {
  padding: 10px;
  border-style: dashed;
  background: transparent;
  color: var(--muted);
  text-align: center;
}
.add-slot:hover {
  color: var(--q-primary);
}
.day-view {
  overflow: hidden;
}
.day-view-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 26px;
  border-bottom: 1px solid var(--line);
}
.day-view-head > div:first-child {
  display: flex;
  flex-direction: column;
  text-transform: capitalize;
}
.day-view-head span {
  color: var(--muted);
}
.day-view-head strong {
  font:
    700 21px 'Playfair Display',
    serif;
}
.day-summary {
  display: flex;
  gap: 20px;
}
.day-summary b {
  color: var(--ink);
}
.timeline {
  padding: 14px 26px 26px;
}
.timeline-item {
  display: grid;
  grid-template-columns: 65px 18px 1fr;
  min-height: 86px;
}
.timeline-item time {
  display: flex;
  flex-direction: column;
  padding-top: 18px;
  font-weight: 700;
}
.timeline-item time small {
  color: var(--muted);
  font-size: 10px;
  font-weight: 400;
}
.timeline-marker {
  position: relative;
  width: 10px;
  height: 10px;
  margin-top: 23px;
  border-radius: 50%;
  background: var(--q-info);
}
.timeline-marker:after {
  position: absolute;
  top: 10px;
  left: 4px;
  width: 2px;
  height: 76px;
  background: var(--studio-border);
  content: '';
}
.timeline-item:last-child .timeline-marker:after {
  display: none;
}
.timeline-card {
  display: flex;
  align-items: center;
  gap: 13px;
  margin: 6px 0;
  padding: 13px 15px;
}
.timeline-person {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 11px;
}
.timeline-person > div:last-child {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.timeline-person span {
  overflow: hidden;
  color: var(--muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.student-avatar {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  border-radius: 12px;
  background: var(--green-soft);
  color: var(--q-primary);
  font-size: 11px;
  font-weight: 700;
}
.group-list {
  display: grid;
  gap: 8px;
}
.group-list > div {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px;
  border-bottom: 1px solid var(--line);
}
.group-list > div > div:nth-child(2) {
  display: flex;
  flex: 1;
  flex-direction: column;
}
.group-list span {
  color: var(--muted);
  font-size: 11px;
}
.lesson-form {
  display: grid;
  gap: 5px;
}
.two-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.conflict-alert {
  display: flex;
  gap: 10px;
  padding: 12px;
  border-radius: 11px;
  background: #fbf0dd;
  color: #875f27;
}
.conflict-alert.full {
  background: var(--red-soft);
  color: var(--q-negative);
}
.conflict-alert div {
  display: flex;
  flex-direction: column;
}
.conflict-alert span {
  font-size: 11px;
}
@media (max-width: 599px) {
  .agenda-toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .date-nav {
    justify-content: center;
  }
  .agenda-view-options {
    justify-content: space-between;
  }
  .date-label {
    min-width: 190px;
  }
  .day-view-head {
    align-items: flex-start;
    padding: 18px;
    flex-direction: column;
    gap: 12px;
  }
  .timeline {
    padding: 10px 12px 20px;
  }
  .timeline-item {
    grid-template-columns: 53px 15px 1fr;
  }
  .timeline-card {
    gap: 7px;
    padding: 11px;
  }
  .timeline-card > .pill {
    display: none;
  }
  .day-summary {
    font-size: 12px;
  }
  .two-fields {
    grid-template-columns: 1fr;
  }
  .week-grid {
    min-width: 800px;
  }
}
</style>
