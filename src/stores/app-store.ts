import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { uid as quasarUid } from 'quasar';
import type {
  AgendaItem,
  AppData,
  DataProfile,
  FinancialPeriod,
  Lesson,
  Settings,
  Student,
  Transaction,
} from '@/models';
import { cloneData } from '@/utils/clone';

const STORAGE_KEY = 'larissa-silva-app-data-v1';
const LEGACY_STORAGE_KEY = 'movva-app-data-v1';
const BACKUP_VERSION = 1;

export const uid = quasarUid;

export const toISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const currentPeriodKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const offsetDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toISODate(date);
};

const defaultSettings: Settings = {
  dataProfile: 'production',
  profileLocked: false,
  defaultDuration: 60,
  startTime: '07:00',
  endTime: '20:00',
  workingDays: [1, 2, 3, 4, 5],
  maxCapacity: 4,
  currency: 'BRL',
  categories: {
    income: ['Mensalidade', 'Aula avulsa', 'Pacote de aulas', 'Outro recebimento'],
    expense: ['Material', 'Equipamento', 'Transporte', 'Manutenção', 'Outras despesas'],
  },
};

function demoData(): AppData {
  const now = new Date();
  const weekday = now.getDay() || 7;
  const month = currentPeriodKey(now);
  const today = toISODate(now);
  const students: Student[] = [
    {
      id: 'student-ana',
      name: 'Ana Carolina',
      phone: '(11) 99842-1030',
      birthday: '1993-04-12',
      notes: 'Prefere treinos de mobilidade.',
      active: true,
      createdAt: offsetDate(-90),
      schedules: [
        { id: 'sch-ana-1', weekday, time: '08:00', duration: 60, kind: 'fixed', notes: '' },
        {
          id: 'sch-ana-2',
          weekday: weekday === 3 ? 5 : 3,
          time: '08:00',
          duration: 60,
          kind: 'fixed',
          notes: '',
        },
      ],
    },
    {
      id: 'student-bruno',
      name: 'Bruno Mendes',
      phone: '(11) 99105-2287',
      birthday: '1988-11-03',
      notes: 'Acompanhamento de fortalecimento de joelho.',
      active: true,
      createdAt: offsetDate(-64),
      schedules: [
        {
          id: 'sch-bruno-1',
          weekday,
          time: '09:30',
          duration: 60,
          kind: 'fixed',
          notes: 'Evitar impacto.',
        },
      ],
    },
    {
      id: 'student-camila',
      name: 'Camila Ferreira',
      phone: '(11) 98771-4432',
      birthday: '',
      notes: '',
      active: true,
      createdAt: offsetDate(-38),
      schedules: [
        { id: 'sch-camila-1', weekday, time: '17:00', duration: 50, kind: 'fixed', notes: '' },
      ],
    },
    {
      id: 'student-diego',
      name: 'Diego Nunes',
      phone: '(11) 99920-6670',
      birthday: '',
      notes: 'Aluno em pausa por viagem.',
      active: false,
      createdAt: offsetDate(-140),
      schedules: [],
    },
  ];

  return {
    students,
    lessons: [
      {
        id: 'lesson-today-ana',
        studentId: 'student-ana',
        scheduleId: 'sch-ana-1',
        date: today,
        time: '08:00',
        duration: 60,
        status: 'completed',
        notes: 'Boa evolução na mobilidade.',
        createdAt: today,
      },
      {
        id: 'lesson-prev-bruno',
        studentId: 'student-bruno',
        date: offsetDate(-7),
        time: '09:30',
        duration: 60,
        status: 'absent',
        notes: 'Avisou após o horário.',
        createdAt: offsetDate(-7),
      },
    ],
    periods: [{ key: month, openingBalance: 1200, closed: false }],
    transactions: [
      {
        id: 'tx-1',
        periodKey: month,
        date: `${month}-03`,
        description: 'Mensalidade — Ana Carolina',
        type: 'income',
        amount: 480,
        category: 'Mensalidade',
        studentId: 'student-ana',
        notes: '',
        createdAt: `${month}-03`,
      },
      {
        id: 'tx-2',
        periodKey: month,
        date: `${month}-05`,
        description: 'Mensalidade — Bruno Mendes',
        type: 'income',
        amount: 480,
        category: 'Mensalidade',
        studentId: 'student-bruno',
        notes: '',
        createdAt: `${month}-05`,
      },
      {
        id: 'tx-3',
        periodKey: month,
        date: `${month}-07`,
        description: 'Compra de faixas elásticas',
        type: 'expense',
        amount: 189.9,
        category: 'Material',
        notes: 'Kit com 5 resistências',
        createdAt: `${month}-07`,
      },
    ],
    settings: { ...cloneData(defaultSettings), dataProfile: 'demo' },
  };
}

function productionData(): AppData {
  return {
    students: [],
    lessons: [],
    periods: [],
    transactions: [],
    settings: cloneData(defaultSettings),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseBackup(payload: unknown): AppData {
  if (!isRecord(payload)) throw new Error('O arquivo não contém um backup válido.');
  const source = isRecord(payload.data) ? payload.data : payload;
  const requiredArrays = ['students', 'lessons', 'periods', 'transactions'] as const;
  requiredArrays.forEach((key) => {
    if (!Array.isArray(source[key])) throw new Error(`O backup não contém a coleção “${key}”.`);
  });
  if (!isRecord(source.settings)) throw new Error('O backup não contém as configurações.');
  const importedSettings = source.settings;
  if (!isRecord(importedSettings.categories)) {
    throw new Error('As categorias do backup são inválidas.');
  }
  if (
    !Array.isArray(importedSettings.categories.income) ||
    !Array.isArray(importedSettings.categories.expense)
  ) {
    throw new Error('As categorias financeiras do backup são inválidas.');
  }

  const dataProfile =
    importedSettings.dataProfile === 'demo' || importedSettings.dataProfile === 'production'
      ? importedSettings.dataProfile
      : 'production';

  return cloneData({
    students: source.students,
    lessons: source.lessons,
    periods: source.periods,
    transactions: source.transactions,
    settings: {
      ...defaultSettings,
      ...importedSettings,
      dataProfile,
      profileLocked: Boolean(importedSettings.profileLocked),
      categories: {
        income: importedSettings.categories.income,
        expense: importedSettings.categories.expense,
      },
    },
  }) as AppData;
}

function loadData(): AppData {
  if (typeof localStorage === 'undefined') return productionData();
  try {
    const saved = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!saved) return productionData();
    const parsed = JSON.parse(saved) as Partial<AppData>;
    const inferredProfile: DataProfile =
      parsed.settings?.dataProfile ??
      (parsed.students?.some((student) => student.id === 'student-ana') ? 'demo' : 'production');
    return {
      students: parsed.students ?? [],
      lessons: parsed.lessons ?? [],
      periods: parsed.periods ?? [],
      transactions: parsed.transactions ?? [],
      settings: { ...defaultSettings, ...parsed.settings, dataProfile: inferredProfile },
    };
  } catch {
    return productionData();
  }
}

export const useAppStore = defineStore('app', () => {
  const initial = loadData();
  const students = ref<Student[]>(initial.students);
  const lessons = ref<Lesson[]>(initial.lessons);
  const periods = ref<FinancialPeriod[]>(initial.periods);
  const transactions = ref<Transaction[]>(initial.transactions);
  const settings = ref<Settings>(initial.settings);

  const activeStudents = computed(() => students.value.filter((student) => student.active));

  watch(
    [students, lessons, periods, transactions, settings],
    () => {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          students: students.value,
          lessons: lessons.value,
          periods: periods.value,
          transactions: transactions.value,
          settings: settings.value,
        }),
      );
    },
    { deep: true },
  );

  function saveStudent(payload: Omit<Student, 'id' | 'createdAt'> & { id?: string }) {
    if (payload.id) {
      const index = students.value.findIndex((student) => student.id === payload.id);
      if (index >= 0) students.value[index] = { ...students.value[index]!, ...payload };
      return payload.id;
    }
    const id = uid();
    students.value.push({ ...payload, id, createdAt: toISODate(new Date()) });
    return id;
  }

  function toggleStudent(id: string) {
    const student = students.value.find((item) => item.id === id);
    if (student) student.active = !student.active;
  }

  function saveRecurringSchedule(payload: {
    studentId: string;
    weekdays: number[];
    startDate: string;
    endDate: string;
    time: string;
    duration: number;
    notes: string;
  }) {
    const student = students.value.find((item) => item.id === payload.studentId);
    if (!student) return false;
    const recurrenceId = uid();
    payload.weekdays.forEach((weekday) => {
      student.schedules.push({
        id: uid(),
        recurrenceId,
        weekday,
        time: payload.time,
        duration: payload.duration,
        kind: 'fixed',
        notes: payload.notes,
        startDate: payload.startDate,
        endDate: payload.endDate,
      });
    });
    return true;
  }

  function saveLesson(payload: Omit<Lesson, 'id' | 'createdAt'> & { id?: string }) {
    if (payload.id) {
      const index = lessons.value.findIndex((lesson) => lesson.id === payload.id);
      if (index >= 0) lessons.value[index] = { ...lessons.value[index]!, ...payload };
      return payload.id;
    }
    const id = uid();
    lessons.value.push({ ...payload, id, createdAt: toISODate(new Date()) });
    return id;
  }

  function setLessonStatus(item: AgendaItem, status: Lesson['status'], notes = '') {
    const existing = lessons.value.find(
      (lesson) =>
        lesson.date === item.date &&
        lesson.studentId === item.studentId &&
        lesson.time === item.time,
    );
    saveLesson({
      ...(existing ? { id: existing.id } : {}),
      studentId: item.studentId,
      ...(item.scheduleId ? { scheduleId: item.scheduleId } : {}),
      date: item.date,
      time: item.time,
      duration: item.duration,
      status,
      notes: notes || existing?.notes || item.notes,
    });
  }

  function agendaForDate(dateString: string): AgendaItem[] {
    const date = new Date(`${dateString}T12:00:00`);
    const weekday = date.getDay() || 7;
    const result = new Map<string, AgendaItem>();

    students.value
      .filter((student) => student.active)
      .forEach((student) => {
        student.schedules
          .filter(
            (schedule) =>
              schedule.weekday === weekday &&
              (!schedule.startDate || dateString >= schedule.startDate) &&
              (!schedule.endDate || dateString <= schedule.endDate),
          )
          .forEach((schedule) => {
            const movedAway = lessons.value.some(
              (lesson) =>
                lesson.scheduleId === schedule.id &&
                lesson.originalDate === dateString &&
                lesson.date !== dateString,
            );
            if (movedAway) return;
            const override = lessons.value.find(
              (lesson) =>
                lesson.date === dateString &&
                lesson.studentId === student.id &&
                lesson.scheduleId === schedule.id,
            );
            result.set(`${student.id}-${schedule.id}`, {
              id: override?.id ?? `${dateString}-${schedule.id}`,
              studentId: student.id,
              studentName: student.name,
              phone: student.phone,
              date: dateString,
              time: override?.time ?? schedule.time,
              duration: override?.duration ?? schedule.duration,
              status: override?.status ?? 'scheduled',
              notes: override?.notes ?? schedule.notes,
              scheduleId: schedule.id,
              isRecurring: true,
            });
          });
      });

    lessons.value
      .filter((lesson) => {
        if (lesson.date !== dateString) return false;
        if (!lesson.scheduleId) return true;
        const schedule = students.value
          .flatMap((student) => student.schedules)
          .find((item) => item.id === lesson.scheduleId);
        return Boolean(lesson.originalDate && schedule?.weekday !== weekday);
      })
      .forEach((lesson) => {
        const student = students.value.find((item) => item.id === lesson.studentId);
        if (!student) return;
        result.set(lesson.id, {
          ...lesson,
          studentName: student.name,
          phone: student.phone,
          isRecurring: Boolean(lesson.scheduleId),
        });
      });

    return [...result.values()].sort((a, b) => a.time.localeCompare(b.time));
  }

  function ensurePeriod(key: string) {
    let period = periods.value.find((item) => item.key === key);
    if (!period) {
      period = { key, openingBalance: 0, closed: false };
      periods.value.push(period);
    }
    return period;
  }

  function periodSummary(key: string) {
    const period = ensurePeriod(key);
    const items = transactions.value.filter((transaction) => transaction.periodKey === key);
    const income = items
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0);
    const expense = items
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);
    return { income, expense, balance: period.openingBalance + income - expense };
  }

  function saveTransaction(payload: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) {
    const amount = Math.abs(Number(payload.amount));
    ensurePeriod(payload.periodKey);
    if (payload.id) {
      const index = transactions.value.findIndex((item) => item.id === payload.id);
      if (index >= 0)
        transactions.value[index] = { ...transactions.value[index]!, ...payload, amount };
      return payload.id;
    }
    const id = uid();
    transactions.value.push({ ...payload, amount, id, createdAt: toISODate(new Date()) });
    return id;
  }

  function removeTransaction(id: string) {
    transactions.value = transactions.value.filter((item) => item.id !== id);
  }

  function removeLesson(id: string) {
    lessons.value = lessons.value.filter((item) => item.id !== id);
  }

  function updateOpeningBalance(key: string, value: number) {
    const period = ensurePeriod(key);
    period.openingBalance = Number(value) || 0;
  }

  function closePeriod(key: string) {
    const period = ensurePeriod(key);
    const summary = periodSummary(key);
    period.closed = true;
    period.closingBalance = summary.balance;
    const [year, month] = key.split('-').map(Number);
    const nextKey = currentPeriodKey(new Date(year!, month!, 1));
    const nextPeriod = ensurePeriod(nextKey);
    if (nextPeriod.openingBalance === 0) nextPeriod.openingBalance = summary.balance;
    return nextKey;
  }

  function addCategory(type: 'income' | 'expense', category: string) {
    const clean = category.trim();
    if (clean && !settings.value.categories[type].includes(clean))
      settings.value.categories[type].push(clean);
  }

  function removeCategory(type: 'income' | 'expense', category: string) {
    settings.value.categories[type] = settings.value.categories[type].filter(
      (item) => item !== category,
    );
  }

  function switchDataProfile(profile: DataProfile) {
    if (settings.value.profileLocked || profile === settings.value.dataProfile) return false;
    const fresh = profile === 'demo' ? demoData() : productionData();
    students.value = fresh.students;
    lessons.value = fresh.lessons;
    periods.value = fresh.periods;
    transactions.value = fresh.transactions;
    settings.value.dataProfile = profile;
    settings.value.profileLocked = false;
    return true;
  }

  function createBackup() {
    return {
      application: 'Larissa Silva',
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      data: cloneData({
        students: students.value,
        lessons: lessons.value,
        periods: periods.value,
        transactions: transactions.value,
        settings: settings.value,
      }),
    };
  }

  function importBackup(payload: unknown) {
    if (settings.value.profileLocked) {
      throw new Error('Desative a trava do modo de produção antes de importar um backup.');
    }
    const imported = parseBackup(payload);
    students.value = imported.students;
    lessons.value = imported.lessons;
    periods.value = imported.periods;
    transactions.value = imported.transactions;
    settings.value = imported.settings;
  }

  return {
    students,
    lessons,
    periods,
    transactions,
    settings,
    activeStudents,
    saveStudent,
    toggleStudent,
    saveRecurringSchedule,
    saveLesson,
    setLessonStatus,
    agendaForDate,
    ensurePeriod,
    periodSummary,
    saveTransaction,
    removeTransaction,
    removeLesson,
    updateOpeningBalance,
    closePeriod,
    addCategory,
    removeCategory,
    switchDataProfile,
    createBackup,
    importBackup,
  };
});
