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
          /><q-btn flat no-caps class="date-label"
            ><q-icon name="calendar_today" /><span>{{
              view === 'week' && $q.screen.lt.sm ? mobileDateLabel : currentLabel
            }}</span
            ><q-icon name="arrow_drop_down" />
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date
                v-model="selectedDate"
                mask="YYYY-MM-DD"
                minimal
                today-btn
                :first-day-of-week="0"
                color="primary"
              />
            </q-popup-proxy> </q-btn
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

      <section v-if="view === 'week' && $q.screen.lt.sm" class="mobile-week-view surface">
        <div
          class="mobile-day-strip"
          :style="{ gridTemplateColumns: `repeat(${weekDays.length}, 1fr)` }"
        >
          <button
            v-for="day in weekDays"
            :key="day.date"
            type="button"
            :class="{
              selected: day.date === mobileDay?.date,
              today: day.date === today,
            }"
            @click="selectedDate = day.date"
          >
            <span>{{ day.short }}</span>
            <strong>{{ day.day }}</strong>
            <small v-if="day.items.length">{{ day.items.length }}</small>
          </button>
        </div>

        <header class="mobile-day-head">
          <div>
            <span>{{ mobileDayWeekday }}</span>
            <strong>{{ mobileDateLabel }}</strong>
          </div>
          <q-btn
            v-if="selectedDate !== today"
            flat
            dense
            no-caps
            color="primary"
            label="Hoje"
            @click="goToday"
          />
        </header>

        <div v-if="mobileDay?.items.length" class="mobile-lesson-list">
          <button
            v-for="item in mobileDay.items"
            :key="item.id"
            type="button"
            class="mobile-lesson-card"
            @click="openEdit(item)"
          >
            <div class="mobile-lesson-time">
              <strong>{{ item.time }}</strong>
              <span>{{ item.duration }} min</span>
            </div>
            <div class="mobile-lesson-person">
              <strong>{{ item.studentName }}</strong>
              <span>{{ item.isRecurring ? 'Horário recorrente' : 'Aula avulsa' }}</span>
              <small v-if="item.notes">{{ item.notes }}</small>
            </div>
            <q-chip dense :class="['status-chip', `status-${item.status}`]">
              {{ statusLabel(item.status) }}
            </q-chip>
            <q-icon name="chevron_right" class="mobile-lesson-arrow" />
          </button>
        </div>
        <div v-else class="empty-state mobile-empty-state">
          <q-icon name="event_available" size="42px" />
          <strong>Dia livre</strong>
          <div>Não há aulas agendadas para esta data.</div>
          <q-btn
            class="q-mt-md"
            unelevated
            no-caps
            color="primary"
            icon="add"
            label="Agendar aula"
            @click="openNewLesson(mobileDay?.date ?? selectedDate)"
          />
        </div>
      </section>

      <section v-else-if="view === 'week'" class="week-board surface">
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
                    <div class="mini-person-head">
                      <span :class="['status-dot', item.status]"></span>
                      <strong>{{ item.studentName }}</strong>
                      <q-chip dense :class="['status-chip', `status-${item.status}`]">
                        {{ statusLabel(item.status) }}
                      </q-chip>
                    </div>
                    <small>
                      <q-icon name="schedule" /> {{ item.duration }} min ·
                      {{ item.isRecurring ? 'Recorrente' : 'Avulsa' }}
                    </small>
                    <small v-if="item.notes" class="mini-person-notes">
                      <q-icon name="notes" /> {{ item.notes }}
                    </small>
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
                      :active="status.value === item.status"
                      active-class="status-menu-active"
                      @click="setStatus(item, status.value)"
                      ><q-item-section avatar><q-icon :name="status.icon" /></q-item-section
                      ><q-item-section>{{ status.label }}</q-item-section
                      ><q-item-section v-if="status.value === item.status" side
                        ><q-icon name="check" color="primary" /></q-item-section></q-item
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

    <q-dialog v-model="lessonTypeOpen" :position="$q.screen.lt.sm ? 'bottom' : 'standard'">
      <q-card class="form-dialog lesson-type-dialog">
        <header class="dialog-head">
          <div>
            <div class="eyebrow">Nova aula</div>
            <h2 class="dialog-title">Como deseja agendar?</h2>
          </div>
          <q-space /><q-btn flat round icon="close" v-close-popup />
        </header>
        <q-card-section class="dialog-body lesson-type-options">
          <button type="button" @click="chooseLessonType('simple')">
            <span class="lesson-type-icon"><q-icon name="event" /></span>
            <div>
              <strong>Simples</strong>
              <span>Uma aula avulsa somente na data selecionada.</span>
            </div>
            <q-icon name="chevron_right" />
          </button>
          <button type="button" @click="chooseLessonType('scheduled')">
            <span class="lesson-type-icon scheduled"><q-icon name="event_repeat" /></span>
            <div>
              <strong>Agendada</strong>
              <span>Uma rotina recorrente em dias e período personalizados.</span>
            </div>
            <q-icon name="chevron_right" />
          </button>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog
      v-model="recurringOpen"
      :position="$q.screen.lt.sm ? 'bottom' : 'standard'"
      persistent
    >
      <q-card class="form-dialog form-dialog--wide">
        <header class="dialog-head">
          <div>
            <div class="eyebrow">Aula agendada</div>
            <h2 class="dialog-title">Criar rotina de aulas</h2>
          </div>
          <q-space /><q-btn flat round icon="close" v-close-popup />
        </header>
        <q-form @submit="saveRecurringSchedule">
          <q-card-section class="dialog-body recurring-form">
            <q-select
              v-model="recurringForm.studentId"
              outlined
              emit-value
              map-options
              use-input
              input-debounce="0"
              label="Aluno *"
              :options="studentOptions"
              :rules="[(v) => !!v || 'Selecione o aluno']"
            />

            <div class="recurring-section">
              <div class="field-label">
                <strong>Dias da semana *</strong>
                <span>Selecione todos os dias em que a aula deve se repetir.</span>
              </div>
              <div class="recurring-days">
                <button
                  v-for="day in weekdays"
                  :key="day.value"
                  type="button"
                  :class="{ active: recurringForm.weekdays.includes(day.value) }"
                  @click="toggleRecurringDay(day.value)"
                >
                  <span>{{ day.short }}</span>
                  <small>{{ day.label }}</small>
                </button>
              </div>
            </div>

            <div class="two-fields">
              <q-input
                v-model="recurringForm.startDate"
                outlined
                type="date"
                stack-label
                label="Início *"
                :rules="[(v) => !!v || 'Informe a data inicial']"
              />
              <q-input
                v-model="recurringForm.endDate"
                outlined
                type="date"
                stack-label
                label="Término *"
                :min="recurringForm.startDate"
                :rules="[
                  (v) => !!v || 'Informe a data final',
                  (v) =>
                    v >= recurringForm.startDate || 'A data final deve ser posterior ao início',
                ]"
              />
            </div>

            <div class="recurrence-presets">
              <span>Duração rápida:</span>
              <q-btn flat dense no-caps label="1 mês" @click="setRecurrenceMonths(1)" />
              <q-btn flat dense no-caps label="3 meses" @click="setRecurrenceMonths(3)" />
              <q-btn flat dense no-caps label="6 meses" @click="setRecurrenceMonths(6)" />
              <q-btn flat dense no-caps label="1 ano" @click="setRecurrenceMonths(12)" />
            </div>

            <div class="two-fields">
              <q-input
                v-model="recurringForm.time"
                outlined
                type="time"
                stack-label
                label="Horário *"
                :rules="[(v) => !!v || 'Informe o horário']"
              />
              <q-input
                v-model.number="recurringForm.duration"
                outlined
                type="number"
                min="15"
                step="5"
                label="Duração (min)"
              />
            </div>
            <q-input v-model="recurringForm.notes" outlined autogrow label="Observações" />
          </q-card-section>
          <q-card-actions class="dialog-actions" align="right">
            <q-btn flat no-caps label="Cancelar" v-close-popup />
            <q-btn
              unelevated
              no-caps
              color="primary"
              icon="event_repeat"
              label="Criar rotina"
              type="submit"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

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
              <strong>{{ item.studentName }}</strong>
              <span
                >{{ item.duration }} min · {{ item.isRecurring ? 'Recorrente' : 'Avulsa' }}</span
              >
            </div>
            <q-chip dense :class="['status-chip', `status-${item.status}`]">
              {{ statusLabel(item.status) }}
            </q-chip>
            <q-btn flat round icon="more_horiz"
              ><q-menu auto-close
                ><q-list
                  ><q-item
                    v-for="status in lessonStatuses"
                    :key="status.value"
                    clickable
                    :active="status.value === item.status"
                    active-class="status-menu-active"
                    @click="setStatus(item, status.value)"
                    ><q-item-section avatar><q-icon :name="status.icon" /></q-item-section
                    ><q-item-section>{{ status.label }}</q-item-section
                    ><q-item-section v-if="status.value === item.status" side
                      ><q-icon name="check" color="primary" /></q-item-section></q-item
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
            <div class="dialog-title-row">
              <h2 class="dialog-title">
                {{ editingItem ? editingItem.studentName : 'Agendar aula' }}
              </h2>
              <q-chip
                v-if="editingItem"
                :icon="statusIcon(lessonForm.status)"
                :class="['status-chip', `status-${lessonForm.status}`]"
              >
                {{ statusLabel(lessonForm.status) }}
              </q-chip>
            </div>
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
import { formatDate, lessonStatuses, statusLabel, weekdays } from '@/utils/format';

const $q = useQuasar();
const store = useAppStore();
const route = useRoute();
const router = useRouter();
const today = toISODate(new Date());
const selectedDate = ref(today);
const view = ref<'day' | 'week'>('week');
const showWeekends = ref(
  store.settings.workingDays.some((weekday) => weekday === 6 || weekday === 7),
);
const lessonTypeOpen = ref(false);
const recurringOpen = ref(false);
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
const pendingLesson = reactive({ date: today, time: '08:00' });
const recurringForm = reactive({
  studentId: '',
  weekdays: [] as number[],
  startDate: today,
  endDate: today,
  time: '08:00',
  duration: 60,
  notes: '',
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
const mobileDay = computed(
  () => weekDays.value.find((day) => day.date === selectedDate.value) ?? weekDays.value[0],
);
const mobileDateLabel = computed(() =>
  formatDate(mobileDay.value?.date ?? selectedDate.value, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }),
);
const mobileDayWeekday = computed(() =>
  formatDate(mobileDay.value?.date ?? selectedDate.value, { weekday: 'long' }),
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
const statusIcon = (status: LessonStatus) =>
  lessonStatuses.find((item) => item.value === status)?.icon ?? 'info';
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
  pendingLesson.date = date;
  pendingLesson.time = time;
  lessonTypeOpen.value = true;
}
function chooseLessonType(type: 'simple' | 'scheduled') {
  lessonTypeOpen.value = false;
  if (type === 'simple') {
    resetForm(pendingLesson.date, pendingLesson.time);
    formOpen.value = true;
    return;
  }
  const date = new Date(`${pendingLesson.date}T12:00:00`);
  const weekday = date.getDay() || 7;
  Object.assign(recurringForm, {
    studentId: '',
    weekdays: [weekday],
    startDate: pendingLesson.date,
    time: pendingLesson.time,
    duration: store.settings.defaultDuration,
    notes: '',
  });
  setRecurrenceMonths(3);
  recurringOpen.value = true;
}
function toggleRecurringDay(day: number) {
  recurringForm.weekdays = recurringForm.weekdays.includes(day)
    ? recurringForm.weekdays.filter((item) => item !== day)
    : [...recurringForm.weekdays, day].sort((a, b) => a - b);
}
function setRecurrenceMonths(months: number) {
  const endDate = new Date(`${recurringForm.startDate}T12:00:00`);
  const day = endDate.getDate();
  endDate.setDate(1);
  endDate.setMonth(endDate.getMonth() + months);
  const lastDayOfMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
  endDate.setDate(Math.min(day, lastDayOfMonth));
  recurringForm.endDate = toISODate(endDate);
}
function saveRecurringSchedule() {
  if (!recurringForm.weekdays.length) {
    $q.notify({ type: 'warning', message: 'Selecione ao menos um dia da semana.' });
    return;
  }
  if (recurringForm.endDate < recurringForm.startDate) {
    $q.notify({ type: 'warning', message: 'A data final deve ser posterior ao início.' });
    return;
  }
  const saved = store.saveRecurringSchedule({
    studentId: recurringForm.studentId,
    weekdays: recurringForm.weekdays,
    startDate: recurringForm.startDate,
    endDate: recurringForm.endDate,
    time: recurringForm.time,
    duration: recurringForm.duration,
    notes: recurringForm.notes,
  });
  if (!saved) {
    $q.notify({ type: 'negative', message: 'Não foi possível localizar o aluno selecionado.' });
    return;
  }
  recurringOpen.value = false;
  selectedDate.value = recurringForm.startDate;
  $q.notify({ type: 'positive', message: 'Rotina de aulas criada com sucesso.' });
  void router.replace({ query: {} });
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
.date-label .q-icon:last-child {
  margin-right: 0;
  margin-left: 3px;
}
.mobile-week-view {
  overflow: hidden;
}
.mobile-day-strip {
  display: grid;
  gap: 4px;
  padding: 10px;
  border-bottom: 1px solid var(--line);
  background: var(--studio-background);
}
.mobile-day-strip button {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 58px;
  place-items: center;
  padding: 6px 2px;
  border: 1px solid transparent;
  border-radius: 11px;
  background: transparent;
  color: var(--muted);
  font: inherit;
  cursor: pointer;
}
.mobile-day-strip button span {
  font-size: 9px;
  font-weight: 700;
}
.mobile-day-strip button strong {
  color: var(--ink);
  font-size: 17px;
}
.mobile-day-strip button small {
  position: absolute;
  top: 4px;
  right: 4px;
  display: grid;
  width: 15px;
  height: 15px;
  place-items: center;
  border-radius: 50%;
  background: var(--studio-primary-soft);
  color: var(--q-primary);
  font-size: 8px;
  font-weight: 700;
}
.mobile-day-strip button.today:not(.selected) {
  border-color: var(--q-accent);
}
.mobile-day-strip button.selected {
  border-color: var(--q-primary);
  background: var(--q-primary);
  color: white;
  box-shadow: 0 5px 12px rgba(184, 111, 78, 0.2);
}
.mobile-day-strip button.selected strong,
.mobile-day-strip button.selected small {
  color: white;
}
.mobile-day-strip button.selected small {
  background: rgba(255, 255, 255, 0.2);
}
.mobile-day-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 10px;
}
.mobile-day-head > div {
  display: flex;
  flex-direction: column;
  text-transform: capitalize;
}
.mobile-day-head span {
  color: var(--muted);
  font-size: 11px;
}
.mobile-day-head strong {
  font:
    700 18px 'Playfair Display',
    serif;
}
.mobile-lesson-list {
  display: grid;
  gap: 9px;
  padding: 6px 12px 16px;
}
.mobile-lesson-card {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) auto 18px;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 13px 10px;
  border: 1px solid var(--line);
  border-radius: 13px;
  background: var(--studio-surface);
  color: var(--ink);
  text-align: left;
  box-shadow: 0 4px 12px rgba(57, 42, 37, 0.04);
  cursor: pointer;
}
.mobile-lesson-time,
.mobile-lesson-person {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.mobile-lesson-time strong {
  color: var(--q-primary);
}
.mobile-lesson-time span,
.mobile-lesson-person span,
.mobile-lesson-person small {
  overflow: hidden;
  color: var(--muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mobile-lesson-person > strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mobile-lesson-person small {
  margin-top: 3px;
  font-style: italic;
}
.mobile-lesson-arrow {
  color: var(--muted);
}
.mobile-empty-state {
  padding-top: 28px;
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
  display: grid;
  gap: 4px;
  margin: 8px 0;
  padding-top: 8px;
  border-top: 1px solid var(--line);
  font-size: 12px;
}
.mini-person-head {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
}
.mini-person-head > strong {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mini-person small {
  overflow: hidden;
  color: var(--muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mini-person-notes {
  display: block;
  font-style: italic;
}
.status-chip {
  min-height: 22px;
  margin: 0;
  font-size: 10px;
  font-weight: 700;
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
.group-list .status-chip {
  flex: 0 0 auto;
}
.status-menu-active {
  background: var(--studio-primary-soft);
  color: var(--q-primary);
}
.dialog-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}
.lesson-type-options {
  display: grid;
  gap: 10px;
}
.lesson-type-options > button {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) auto;
  align-items: center;
  gap: 13px;
  width: 100%;
  padding: 15px;
  border: 1px solid var(--line);
  border-radius: 13px;
  background: var(--studio-surface);
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s;
}
.lesson-type-options > button:hover {
  border-color: var(--q-primary);
  background: var(--studio-background);
}
.lesson-type-options > button > div {
  display: flex;
  flex-direction: column;
}
.lesson-type-options > button > div span {
  margin-top: 3px;
  color: var(--muted);
  font-size: 11px;
}
.lesson-type-icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 12px;
  background: var(--studio-primary-soft);
  color: var(--q-primary);
  font-size: 22px;
}
.lesson-type-icon.scheduled {
  background: #e9efe9;
  color: var(--q-positive);
}
.recurring-form {
  display: grid;
  gap: 8px;
}
.recurring-section {
  display: grid;
  gap: 10px;
  margin-bottom: 10px;
}
.field-label {
  display: flex;
  flex-direction: column;
}
.field-label span {
  margin-top: 3px;
  color: var(--muted);
  font-size: 11px;
}
.recurring-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
.recurring-days button {
  display: flex;
  min-width: 0;
  min-height: 52px;
  align-items: center;
  justify-content: center;
  padding: 7px 3px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--studio-surface);
  color: var(--muted);
  font: inherit;
  cursor: pointer;
}
.recurring-days button span {
  font-size: 10px;
  font-weight: 700;
}
.recurring-days button small {
  display: none;
}
.recurring-days button.active {
  border-color: var(--q-primary);
  background: var(--studio-primary-soft);
  color: var(--q-primary);
}
.recurrence-presets {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px;
  margin: -5px 0 8px;
}
.recurrence-presets > span {
  margin-right: 4px;
  color: var(--muted);
  font-size: 11px;
}
.recurrence-presets .q-btn {
  border: 1px solid var(--line);
  color: var(--q-primary);
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
  .lesson-type-options {
    padding: 10px 18px 20px;
  }
  .recurring-days {
    gap: 4px;
  }
  .recurring-days button {
    min-height: 45px;
    border-radius: 8px;
  }
  .recurrence-presets {
    align-items: stretch;
  }
  .recurrence-presets > span {
    width: 100%;
  }
  .week-grid {
    min-width: 800px;
  }
}
</style>
