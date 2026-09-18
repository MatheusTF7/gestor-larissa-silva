export type LessonStatus = 'scheduled' | 'completed' | 'cancelled' | 'absent' | 'rescheduled';
export type TransactionType = 'income' | 'expense';

export interface Schedule {
  id: string;
  weekday: number;
  time: string;
  duration: number;
  kind: 'fixed' | 'single';
  notes: string;
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  birthday: string;
  notes: string;
  active: boolean;
  createdAt: string;
  schedules: Schedule[];
}

export interface Lesson {
  id: string;
  studentId: string;
  scheduleId?: string;
  date: string;
  time: string;
  duration: number;
  status: LessonStatus;
  notes: string;
  originalDate?: string;
  createdAt: string;
}

export interface FinancialPeriod {
  key: string;
  openingBalance: number;
  closed: boolean;
  closingBalance?: number;
}

export interface Transaction {
  id: string;
  periodKey: string;
  date: string;
  description: string;
  type: TransactionType;
  amount: number;
  category: string;
  notes: string;
  studentId?: string;
  createdAt: string;
}

export interface Settings {
  defaultDuration: number;
  startTime: string;
  endTime: string;
  workingDays: number[];
  maxCapacity: number;
  currency: string;
  categories: {
    income: string[];
    expense: string[];
  };
}

export interface AppData {
  students: Student[];
  lessons: Lesson[];
  periods: FinancialPeriod[];
  transactions: Transaction[];
  settings: Settings;
}

export interface AgendaItem {
  id: string;
  studentId: string;
  studentName: string;
  phone: string;
  date: string;
  time: string;
  duration: number;
  status: LessonStatus;
  notes: string;
  scheduleId?: string;
  isRecurring: boolean;
}

