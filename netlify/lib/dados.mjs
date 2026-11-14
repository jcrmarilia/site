// Dados da igreja (membros, cultos, presença, financeiro, mensagens, configurações).
// Dados ficam na loja "jcr-dados" do Netlify Blobs.
import crypto from 'node:crypto';
import { loja, lerVarios, atualizar } from './armazenamento.mjs';
import { hoje, somarDias, eligible, configPadrao, domingosFaltantes, paraInativar } from '../../shared/regras.mjs';

export const COLECOES = ['members', 'services', 'attendance', 'transactions', 'messages', 'settings'];
export const PADROES = { members: [], services: [], attendance: [], transactions: [], messages: [], settings: configPadrao, feedback: [] };
export const lojaDoAmbiente = () => loja('jcr-dados');

export class Erro extends Error { constructor(msg, status = 400) { super(msg); this.status = status; } }
const falha = (cond, msg, status) => { if (cond) throw new Erro(msg, status); };

// ---------- validação ----------
const texto = (v, { min = 0, max = 200, nome = 'Campo' } = {}) => {
  const s = String(v ?? '').trim();
  falha(s.length < min, min > 1 ? `${nome}: use pelo menos ${min} caracteres.` : `${nome} é obrigatório.`);
  falha(s.length > max, `${nome}: use no máximo ${max} caracteres.`);
  return s;
};
const data = (v, nome = 'Data', opcional = false) => {
  const s = String(v ?? '').trim();
  if (!s && opcional) return '';
  falha(!/^\d{4}-\d{2}-\d{2}$/.test(s) || isNaN(Date.parse(s)), `${nome} inválida.`);
  return s;
};
const telefone = v => {
  const s = String(v ?? '').trim();
  if (!s) return '';
  falha(!/^\+?[\d ()-]{10,30}$/.test(s), 'Telefone inválido. Use DDD + número.');
  return s.replace(/\D/g, '');
};
const email = v => {
  const s = String(v ?? '').trim().toLowerCase();
  if (!s) return '';
  falha(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) || s.length > 180, 'E-mail inválido.');
  return s;
};
const um = (v, opcoes, nome) => { falha(!opcoes.includes(v), `${nome} inválido.`); return v; };
const linkGrupo = v => {
  const s = String(v ?? '').trim();
  falha(s && !/^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_-]+$/.test(s), 'Use um link de grupo do WhatsApp válido (https://chat.whatsapp.com/...).');
  return s;
};
const id = () => crypto.randomUUID();

// ---------- leitura + automações ----------
export async function carregar(teste, { comAutomacoes = true } = {}) {
  const st = lojaDoAmbiente(teste);
  let d = await lerVarios(st, COLECOES, PADROES);
  d.settings = { ...configPadrao, ...d.settings };
  if (comAutomacoes) d = await automacoes(st, d);
  return d;
}

async function automacoes(st, d) {
  // 0) ajuste único: o culto de domingo é o "Culto da Família", às 10h
  if (!d.settings.ajusteFamilia) {
    const antigo = d.settings.sundayTitle === 'Culto de Domingo';
    d.settings = { ...configPadrao, ...(await atualizar(st, 'settings', configPadrao, s => ({ ...configPadrao, ...s, ...(s?.sundayTitle === 'Culto de Domingo' || !s?.sundayTitle ? { sundayTitle: 'Culto da Família', sundayTime: '10:00' } : {}), ajusteFamilia: true }))) };
    if (antigo) d.services = await atualizar(st, 'services', [], ss => ss.map(s => s.auto && s.title === 'Culto de Domingo' ? { ...s, title: 'Culto da Família', time: '10:00' } : s));
  }
  // 1) cultos de domingo automáticos
  if (d.settings.autoSunday && !d.settings.autoStart) {
    const hj = hoje(); const ini = somarDias(hj, -new Date(hj + 'T12:00:00Z').getUTCDay());
    d.settings = await atualizar(st, 'settings', configPadrao, s => ({ ...configPadrao, ...s, autoStart: s?.autoStart || ini }));
    d.settings = { ...configPadrao, ...d.settings };
  }
  if (domingosFaltantes(d.settings, d.services).length) {
    d.services = await atualizar(st, 'services', [], ss => {
      const novos = domingosFaltantes(d.settings, ss);
      return novos.length ? [...ss, ...novos] : undefined;
    });
  }
  // 2) inativação automática
  const semanas = Number(d.settings.inactivityWeeks) || 0;
  if (paraInativar(d, semanas).length) {
    d.members = await atualizar(st, 'members', [], ms => {
      const ids = new Set(paraInativar({ ...d, members: ms }, semanas));
      if (!ids.size) return undefined;
      return ms.map(m => ids.has(m.id) ? { ...m, archived: 1, archivedDate: hoje(), archivedReason: 'auto', archivedWeeks: semanas } : m);
    });
  }
  return d;
}

// ---------- alterações ----------
export async function executar(teste, acao, d, usuario) {
  const st = lojaDoAmbiente(teste);
  const agora = new Date().toISOString();
  const admin = teste || usuario?.role === 'admin';
  const podeFinanceiro = teste || usuario?.role === 'admin' || usuario?.role === 'tesouraria';
  d = d || {};

  switch (acao) {
    case 'member.save': {
      const m = {
        name: texto(d.name, { min: 3, max: 120, nome: 'Nome' }), phone: telefone(d.phone), email: email(d.email),
        birthDate: data(d.birthDate, 'Data de nascimento', true), area: texto(d.area, { max: 120, nome: 'Ministério' }),
        status: um(d.status || 'member', ['member', 'visitor'], 'Perfil'), joinedDate: data(d.joinedDate, 'Data de entrada'),
        notes: texto(d.notes, { max: 3000, nome: 'Observações' }), consent: Number(d.consent) ? 1 : 0
      };
      falha(m.joinedDate > hoje(), 'A data de entrada não pode ser futura.');
      falha(m.birthDate && m.birthDate > hoje(), 'A data de nascimento não pode ser futura.');
      let novoId = d.id;
      await atualizar(st, 'members', [], ms => {
        if (d.id) {
          const i = ms.findIndex(x => x.id === d.id); falha(i < 0, 'Cadastro não encontrado.', 404);
          ms[i] = { ...ms[i], ...m, consentAt: m.consent ? (ms[i].consentAt || agora) : '', updatedAt: agora };
        } else {
          novoId = id();
          ms.push({ id: novoId, ...m, source: 'manual', consentAt: m.consent ? agora : '', archived: 0, archivedDate: '', createdAt: agora, updatedAt: agora });
        }
        return ms;
      });
      return { id: novoId };
    }
    case 'member.archive': {
      const arquivar = !!d.archived;
      await atualizar(st, 'members', [], ms => {
        const m = ms.find(x => x.id === d.id); falha(!m, 'Cadastro não encontrado.', 404);
        if (arquivar) Object.assign(m, { archived: 1, archivedDate: hoje(), archivedReason: 'manual' });
        else {
          if (m.archivedDate && m.archivedDate < hoje()) m.pauses = [...(m.pauses || []), { from: m.archivedDate, to: hoje() }];
          Object.assign(m, { archived: 0, archivedDate: '', archivedReason: '', updatedAt: agora });
        }
        return ms;
      });
      return {};
    }
    case 'member.delete': {
      falha(!admin, 'Somente administradores podem excluir cadastros.', 403);
      await atualizar(st, 'members', [], ms => ms.filter(x => x.id !== d.id));
      await atualizar(st, 'attendance', [], as => as.filter(a => a.memberId !== d.id));
      return {};
    }
    case 'service.save': {
      const s = { title: texto(d.title, { min: 3, max: 120, nome: 'Nome do encontro' }), date: data(d.date), time: String(d.time || '') };
      falha(!/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time), 'Horário inválido.');
      let novoId = d.id;
      await atualizar(st, 'services', [], ss => {
        if (d.id) { const x = ss.find(v => v.id === d.id); falha(!x, 'Culto não encontrado.', 404); Object.assign(x, s); }
        else { novoId = id(); ss.push({ id: novoId, ...s, status: 'open', createdAt: agora }); }
        return ss;
      });
      return { id: novoId };
    }
    case 'service.delete': {
      let culto;
      await atualizar(st, 'services', [], ss => { culto = ss.find(v => v.id === d.id); falha(!culto, 'Culto não encontrado.', 404); return ss.filter(v => v.id !== d.id); });
      await atualizar(st, 'attendance', [], as => as.filter(a => a.serviceId !== d.id));
      if (culto.auto) await atualizar(st, 'settings', configPadrao, s => ({ ...configPadrao, ...s, skippedSundays: [...new Set([...(s.skippedSundays || []), culto.date])] }));
      return {};
    }
    case 'attendance.save': {
      const valores = Array.isArray(d.values) ? d.values.slice(0, 10000) : [];
      const dados = await lerVarios(st, ['services', 'members'], PADROES);
      const culto = dados.services.find(s => s.id === d.serviceId); falha(!culto, 'Culto não encontrado.', 404);
      falha(d.close && culto.date > hoje(), 'Não é possível encerrar a chamada de um culto futuro.');
      const porId = new Map(dados.members.map(m => [m.id, m]));
      for (const v of valores) {
        um(v.value, ['present', 'absent', 'excused', 'pending'], 'Situação');
        const m = porId.get(v.memberId); falha(!m || !eligible(m, culto), 'Há uma pessoa que não pertence a esta chamada. Atualize a página.');
      }
      const ids = new Set(valores.map(v => v.memberId));
      await atualizar(st, 'attendance', [], as => [
        ...as.filter(a => !(a.serviceId === culto.id && ids.has(a.memberId))),
        ...valores.filter(v => v.value === 'absent' || v.value === 'excused').map(v => ({ serviceId: culto.id, memberId: v.memberId, value: v.value }))
      ]);
      await atualizar(st, 'services', [], ss => { const x = ss.find(v => v.id === culto.id); if (x) x.status = d.close ? 'closed' : 'open'; return ss; });
      return {};
    }
    case 'service.reopen':
      await atualizar(st, 'services', [], ss => { const x = ss.find(v => v.id === d.id); falha(!x, 'Culto não encontrado.', 404); x.status = 'open'; return ss; });
      return {};
    case 'transaction.save': {
      falha(!podeFinanceiro, 'Seu acesso não inclui o financeiro.', 403);
      const amount = Math.round(Number(d.amount));
      const t = {
        date: data(d.date), kind: um(d.kind, ['income', 'expense'], 'Tipo'), category: texto(d.category, { min: 1, max: 80, nome: 'Categoria' }),
        description: texto(d.description, { min: 2, max: 200, nome: 'Descrição' }), amount, memberId: d.memberId || null,
        paymentMethod: texto(d.paymentMethod || 'Pix', { max: 60, nome: 'Forma de pagamento' })
      };
      falha(!Number.isFinite(amount) || amount <= 0 || amount > 9999999999, 'Informe um valor válido.');
      let novoId = d.id;
      await atualizar(st, 'transactions', [], ts => {
        if (d.id) { const x = ts.find(v => v.id === d.id); falha(!x, 'Lançamento não encontrado.', 404); Object.assign(x, t); }
        else { novoId = id(); ts.push({ id: novoId, ...t, createdAt: agora }); }
        return ts;
      });
      return { id: novoId };
    }
    case 'transaction.delete':
      falha(!podeFinanceiro, 'Seu acesso não inclui o financeiro.', 403);
      await atualizar(st, 'transactions', [], ts => ts.filter(x => x.id !== d.id));
      return {};
    case 'message.save': {
      const m = {
        title: texto(d.title, { min: 3, max: 140, nome: 'Título' }), body: texto(d.body, { min: 3, max: 4000, nome: 'Mensagem' }),
        targetType: um(d.targetType, ['member', 'all', 'absent', 'group', 'broadcast'], 'Destinatário'),
        targetId: String(d.targetId || '').slice(0, 200), groupLink: linkGrupo(d.groupLink), scheduledAt: String(d.scheduledAt || '')
      };
      falha(isNaN(Date.parse(m.scheduledAt)), 'Data e horário inválidos.');
      falha(m.targetType === 'member' && !m.targetId, 'Selecione um destinatário.');
      falha(m.targetType === 'absent' && !m.targetId, 'Selecione um culto.');
      let novoId;
      await atualizar(st, 'messages', [], ms => { novoId = id(); ms.push({ id: novoId, ...m, status: 'scheduled', createdAt: agora }); return ms; });
      return { id: novoId };
    }
    case 'message.status': {
      const status = um(d.status, ['completed', 'cancelled', 'scheduled'], 'Situação');
      await atualizar(st, 'messages', [], ms => { const x = ms.find(v => v.id === d.id); falha(!x, 'Mensagem não encontrada.', 404); x.status = status; x.completedAt = status === 'completed' ? agora : null; return ms; });
      return {};
    }
    case 'settings.save': {
      falha(!admin, 'Somente administradores podem alterar as configurações.', 403);
      const semanas = Math.round(Number(d.inactivityWeeks));
      falha(!Number.isFinite(semanas) || semanas < 0 || semanas > 104, 'Semanas para inativação: use um número entre 0 e 104.');
      const sundayTime = String(d.sundayTime || '18:00');
      falha(!/^([01]\d|2[0-3]):[0-5]\d$/.test(sundayTime), 'Horário do culto de domingo inválido.');
      const s = {
        name: texto(d.name, { min: 3, max: 120, nome: 'Nome da igreja' }), acronym: texto(d.acronym, { min: 1, max: 8, nome: 'Sigla' }),
        address: texto(d.address, { max: 250, nome: 'Endereço' }), groupLink: linkGrupo(d.groupLink),
        autoSunday: !!d.autoSunday, sundayTitle: texto(d.sundayTitle || 'Culto da Família', { min: 3, max: 120, nome: 'Nome do culto de domingo' }),
        sundayTime, autoStart: data(d.autoStart, 'Data inicial dos domingos', true), inactivityWeeks: semanas,
        missingText: texto(d.missingText, { min: 3, max: 2000, nome: 'Mensagem de falta' })
      };
      await atualizar(st, 'settings', configPadrao, atual => ({ ...configPadrao, ...atual, ...s }));
      return {};
    }
    default:
      throw new Erro('Ação não reconhecida.');
  }
}

// ---------- cadastro público ----------
export async function cadastroPublico(teste, d, ip) {
  if (d.website) return; // armadilha para robôs
  const st = lojaDoAmbiente(teste);
  const nome = texto(d.name, { min: 3, max: 120, nome: 'Nome' });
  const tel = telefone(d.phone);
  falha(!tel || tel.length < 10 || tel.length > 15, 'Informe o WhatsApp com DDD.');
  const nasc = data(d.birthDate, 'Data de nascimento', true);
  falha(nasc && nasc > hoje(), 'Confira sua data de nascimento.');
  falha(!d.privacy, 'É preciso aceitar o uso dos dados para concluir o cadastro.');
  const chave = hoje() + ':' + crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0, 16);
  await atualizar(st, 'limites', {}, l => {
    for (const k of Object.keys(l)) if (!k.startsWith(hoje())) delete l[k];
    falha((l[chave] || 0) >= 8, 'Muitas tentativas hoje. Tente novamente amanhã.', 429);
    l[chave] = (l[chave] || 0) + 1; return l;
  });
  const agora = new Date().toISOString();
  await atualizar(st, 'members', [], ms => {
    const dup = ms.find(m => !m.archived && m.phone === tel && m.name.toLowerCase() === nome.toLowerCase());
    if (dup) return undefined;
    ms.push({
      id: id(), name: nome, phone: tel, email: email(d.email), birthDate: nasc, area: texto(d.area, { max: 120, nome: 'Ministério' }),
      status: 'visitor', joinedDate: hoje(), notes: texto(d.notes, { max: 1000, nome: 'Observações' }), source: 'self',
      consent: d.consent ? 1 : 0, consentAt: d.consent ? agora : '', archived: 0, archivedDate: '', createdAt: agora, updatedAt: agora
    });
    return ms;
  });
}
