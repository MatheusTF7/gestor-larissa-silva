import type { LessonStatus } from '@/models';

export const weekdays = [
  { value: 1, label: 'Segunda', short: 'SEG' },
  { value: 2, label: 'Terça', short: 'TER' },
  { value: 3, label: 'Quarta', short: 'QUA' },
  { value: 4, label: 'Quinta', short: 'QUI' },
  { value: 5, label: 'Sexta', short: 'SEX' },
  { value: 6, label: 'Sábado', short: 'SÁB' },
  { value: 7, label: 'Domingo', short: 'DOM' },
];

export const lessonStatuses: Array<{ value: LessonStatus; label: string; icon: string }> = [
  { value: 'scheduled', label: 'Agendada', icon: 'schedule' },
  { value: 'completed', label: 'Concluída', icon: 'check_circle' },
  { value: 'absent', label: 'Falta', icon: 'person_off' },
  { value: 'cancelled', label: 'Cancelada', icon: 'cancel' },
  { value: 'rescheduled', label: 'Remarcada', icon: 'event_repeat' },
];

export const statusLabel = (status: LessonStatus) =>
  lessonStatuses.find((item) => item.value === status)?.label ?? status;

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const formatDate = (date: string, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('pt-BR', options ?? { day: '2-digit', month: 'short' }).format(
    new Date(`${date}T12:00:00`),
  );

export const monthLabel = (key: string) => {
  const [year, month] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    new Date(year!, month! - 1, 1),
  );
};

export const phoneHref = (phone: string) => `https://wa.me/55${phone.replace(/\D/g, '')}`;
