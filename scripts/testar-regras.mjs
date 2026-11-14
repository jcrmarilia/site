// Testes das regras de presença, domingos automáticos e inativação. Uso: node scripts/testar-regras.mjs
import assert from 'node:assert/strict';
import { hoje, somarDias, eligible, statusFor, report, domingosFaltantes, paraInativar } from '../shared/regras.mjs';
const hj = hoje();
const m = (id, extra = {}) => ({ id, name: id, status: 'member', joinedDate: somarDias(hj, -200), archived: 0, createdAt: somarDias(hj, -200) + 'T10:00:00Z', ...extra });
const cultos = []; for (let i = 1; i <= 12; i++) cultos.push({ id: 'c' + i, date: somarDias(hj, -7 * i), title: 'Culto', time: '18:00' });
const faltasDe = (id, ids) => ids.map(c => ({ serviceId: c, memberId: id, value: 'absent' }));
// 1) presença por padrão
assert.equal(statusFor(m('a'), cultos[0], []), 'present');
assert.equal(statusFor(m('a'), { id: 'f', date: somarDias(hj, 3) }, []), 'pending');
// 2) inativação: faltou 9 semanas seguidas -> inativa; 7 semanas -> não; cadastro alterado há 3 semanas -> não; justificou -> não
const att = [
  ...faltasDe('nove', cultos.slice(0, 9).map(c => c.id)),
  ...faltasDe('sete', cultos.slice(0, 7).map(c => c.id)),
  ...faltasDe('alterado', cultos.slice(0, 10).map(c => c.id)),
  ...faltasDe('justificou', cultos.slice(0, 10).map(c => c.id)).map((a, i) => i === 4 ? { ...a, value: 'excused' } : a),
];
const membros = [m('nove'), m('sete'), m('alterado', { updatedAt: somarDias(hj, -21) + 'T10:00:00Z' }), m('justificou'), m('presente')];
const ids = paraInativar({ members: membros, services: cultos, attendance: att }, 8);
assert.deepEqual(ids, ['nove'], 'inativação: ' + ids);
assert.deepEqual(paraInativar({ members: membros, services: cultos, attendance: att }, 0), []);
// 3) arquivado/pausa: não entra na chamada no período
const arq = m('x', { archived: 1, archivedDate: somarDias(hj, -20) });
assert.equal(eligible(arq, cultos[0]), false); assert.equal(eligible(arq, cultos[5]), true);
const pausado = m('y', { pauses: [{ from: somarDias(hj, -30), to: somarDias(hj, -10) }] });
assert.equal(eligible(pausado, cultos[2]), false); assert.equal(eligible(pausado, cultos[0]), true);
// 4) visitante não entra; entrada posterior não conta
assert.equal(eligible(m('v', { status: 'visitor' }), cultos[0]), false);
assert.equal(eligible(m('n', { joinedDate: somarDias(hj, -10) }), cultos[3]), false);
// 5) relatório
const r = report({ members: [m('nove'), m('presente')], services: cultos, attendance: att }, hj.slice(0, 7));
assert.ok(r.every(l => l.total >= 1));
// 6) domingos automáticos
const novos = domingosFaltantes({ autoSunday: true, autoStart: somarDias(hj, -14), sundayTitle: 'Culto de Domingo', skippedSundays: [] }, []);
assert.ok(novos.length >= 2 && novos.every(s => new Date(s.date + 'T12:00:00Z').getUTCDay() === 0));
assert.ok(novos.at(-1).date > hj || new Date(hj + 'T12:00:00Z').getUTCDay() === 0, 'inclui o próximo domingo');
const pulado = domingosFaltantes({ autoSunday: true, autoStart: novos[0].date, sundayTitle: 'Culto de Domingo', skippedSundays: [novos[0].date] }, []);
assert.ok(!pulado.some(s => s.date === novos[0].date));
assert.equal(domingosFaltantes({ autoSunday: false }, []).length, 0);
console.log('Todas as regras conferem ✔');
