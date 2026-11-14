// Tipos e funções do painel. As regras de presença ficam em shared/regras.mjs (as mesmas do servidor).
import { hoje, ordenarPessoas, eligible as elegivel, statusFor as situacao, report as relatorio, presentesNoCulto as presentes, configPadrao } from '../../shared/regras.mjs';

export type Member = { id: string; name: string; phone: string; email: string; birthDate: string; area: string; status: string; joinedDate: string; notes: string; source: string; consent: number; archived: number; archivedDate?: string; archivedReason?: string; archivedWeeks?: number; pauses?: { from: string; to: string }[]; createdAt: string; updatedAt?: string };
export type Service = { id: string; title: string; date: string; time: string; status: string; auto?: boolean; createdAt: string };
export type Attendance = { serviceId: string; memberId: string; value: string };
export type Transaction = { id: string; date: string; kind: string; category: string; description: string; amount: number; memberId: string | null; paymentMethod: string };
export type Message = { id: string; title: string; body: string; targetType: string; targetId: string; groupLink: string; scheduledAt: string; status: string; completedAt?: string };
export type Settings = { name: string; acronym: string; address: string; groupLink: string; autoSunday?: boolean; sundayTitle?: string; sundayTime?: string; autoStart?: string; inactivityWeeks?: number; missingText?: string };
export type Me = { id: string; name: string; email: string; role: string } | null;
export type Data = { members: Member[]; services: Service[]; attendance: Attendance[]; transactions: Transaction[]; messages: Message[]; settings: Settings; formUrl: string; me?: Me };

export const TESTE = import.meta.env.MODE === 'teste';
export const API = TESTE ? '/api/teste' : '/api';

export const today: () => string = hoje;
export const sortMembers = (m: Member[]): Member[] => ordenarPessoas(m);
export const eligible = (m: Member, s: Service): boolean => elegivel(m, s);
export const statusFor = (m: Member, s: Service, att: Attendance[]): string => situacao(m, s, att);
export const report = (d: Data, month: string): { member: Member; total: number; present: number; excused: number; absent: number; rate: number }[] => relatorio(d, month);
export const presentesNoCulto = (d: Data, s: Service): number => presentes(d, s);
export const currency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v / 100);
export function csvCell(v: unknown) { const s = String(v ?? ''); return '"' + (/^[=+@\-\t\r]/.test(s) ? "'" + s : s).replaceAll('"', '""') + '"'; }
export const moneyToCents = (s: string) => { const n = s.includes(',') ? s.replaceAll('.', '').replace(',', '.') : s; return Math.round(Number(n) * 100); };
export const emptyData: Data = { members: [], services: [], attendance: [], transactions: [], messages: [], settings: { ...configPadrao }, formUrl: '' };
export const PAPEIS: Record<string, string> = { admin: 'Administrador', tesouraria: 'Tesouraria', equipe: 'Equipe' };
