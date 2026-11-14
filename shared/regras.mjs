// Regras da igreja usadas pelo painel e pelo servidor (mesma lógica nos dois lados).

export const hoje = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

export function somarDias(data, n) {
  const d = new Date(data + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const diaDaSemana = data => new Date(data + 'T12:00:00Z').getUTCDay();

export const ordenarPessoas = lista => [...lista].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

// A pessoa entra na chamada de um culto se é frequentante, já tinha entrado na igreja
// e não estava arquivada (nem em período de pausa) naquela data.
export function eligible(m, s) {
  if (m.status !== 'member') return false;
  if ((m.joinedDate || '') > s.date) return false;
  for (const p of m.pauses || []) if (s.date >= p.from && s.date < p.to) return false;
  if (m.archived) return !!m.archivedDate && s.date < m.archivedDate;
  return true;
}

// Presença por padrão: só faltas e justificativas são registradas.
// Culto já realizado sem marcação = presente. Culto futuro = pendente.
export function statusFor(m, s, attendance) {
  const r = attendance.find(a => a.memberId === m.id && a.serviceId === s.id);
  if (r) return r.value;
  return s.date <= hoje() ? 'present' : 'pending';
}

export const cultoRealizado = s => s.date <= hoje();

export function report(data, month) {
  const services = data.services.filter(s => s.date.startsWith(month) && cultoRealizado(s));
  return ordenarPessoas(data.members.filter(m => m.status === 'member' && services.some(s => eligible(m, s)))).map(m => {
    const ss = services.filter(s => eligible(m, s));
    const st = ss.map(s => statusFor(m, s, data.attendance));
    const present = st.filter(v => v === 'present').length;
    const excused = st.filter(v => v === 'excused').length;
    return { member: m, total: ss.length, present, excused, absent: ss.length - present - excused, rate: ss.length ? Math.round(present / ss.length * 100) : 0 };
  });
}

export const presentesNoCulto = (data, s) => data.members.filter(m => eligible(m, s) && statusFor(m, s, data.attendance) === 'present').length;

export const configPadrao = {
  name: 'JCR Marília', acronym: 'JCR', address: '', groupLink: '',
  autoSunday: true, sundayTitle: 'Culto da Família', sundayTime: '10:00', autoStart: '', skippedSundays: [],
  inactivityWeeks: 8,
  missingText: 'Olá, {nome}! Sentimos sua falta no culto. Esperamos que esteja tudo bem com você. Estamos aqui se precisar. Será uma alegria ter você conosco novamente!'
};

// Cria os cultos de domingo que ainda não existem (desde a data inicial até o próximo domingo).
export function domingosFaltantes(settings, services) {
  const cfg = { ...configPadrao, ...settings };
  if (!cfg.autoSunday) return [];
  const hj = hoje();
  let d = cfg.autoStart || somarDias(hj, -diaDaSemana(hj));
  while (diaDaSemana(d) !== 0) d = somarDias(d, 1);
  const pular = new Set(cfg.skippedSundays || []);
  const novos = [];
  const ate = somarDias(hj, 6); // inclui o próximo domingo, para a chamada já estar pronta
  for (let n = 0; d <= ate && n < 520; n++, d = somarDias(d, 7)) {
    if (pular.has(d)) continue;
    if (services.some(s => s.id === 'dom-' + d || (s.date === d && s.title === cfg.sundayTitle))) continue;
    novos.push({ id: 'dom-' + d, title: cfg.sundayTitle, date: d, time: cfg.sundayTime || '18:00', status: 'open', auto: true, createdAt: new Date().toISOString() });
  }
  return novos;
}

// Frequentantes que faltaram a todos os cultos durante N semanas (sem justificativa)
// e cujo cadastro não foi alterado nesse período.
export function paraInativar(data, semanas) {
  if (!semanas || semanas <= 0) return [];
  const hj = hoje(), limite = somarDias(hj, -7 * semanas);
  const passados = data.services.filter(s => s.date <= hj).sort((a, b) => a.date.localeCompare(b.date));
  const ids = [];
  for (const m of data.members) {
    if (m.archived || m.status !== 'member') continue;
    const meus = passados.filter(s => eligible(m, s));
    let ultima = '';
    for (const s of meus) if (statusFor(m, s, data.attendance) !== 'absent') ultima = s.date;
    const seguidas = meus.filter(s => s.date > ultima);
    if (!seguidas.length) continue;
    const alterado = (m.updatedAt || m.createdAt || '').slice(0, 10);
    const desde = alterado > seguidas[0].date ? alterado : seguidas[0].date;
    if (desde <= limite && seguidas.some(s => s.date >= desde)) ids.push(m.id);
  }
  return ids;
}
