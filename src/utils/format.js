export function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function formatOnlyDate(value) {
  if (!value) return '-';
  const [year, month, day] = String(value).split('T')[0].split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function boolText(value) {
  if (value === true) return 'Sim';
  if (value === false) return 'Não';
  return '-';
}

export function activeText(value) {
  return value ? 'Ativo' : 'Inativo';
}

export function weekdayText(value) {
  const labels = {
    MONDAY: 'Segunda-feira',
    TUESDAY: 'Terça-feira',
    WEDNESDAY: 'Quarta-feira',
    THURSDAY: 'Quinta-feira',
    FRIDAY: 'Sexta-feira',
    SATURDAY: 'Sábado',
    SUNDAY: 'Domingo'
  };
  return labels[value] || value || '-';
}
