// Login da equipe: senhas com scrypt, sessão em cookie assinado (HMAC).
import crypto from 'node:crypto';
import { loja, ler, atualizar } from './armazenamento.mjs';

const COOKIE = 'jcr_sessao';
const DURACAO = 30 * 24 * 3600; // 30 dias
// sha256 do código de instalação (o código em si foi entregue ao administrador)
const HASH_CODIGO_INSTALACAO = '0c76aab53950ed2a6045f775599c0e3785a6692b09a5559796619d60d2a1c7d5';

const b64 = b => Buffer.from(b).toString('base64url');
export const sistema = () => loja('jcr-sistema');

async function segredo() {
  const st = sistema();
  const s = await atualizar(st, 'segredo', null, atual => atual ? undefined : { chave: crypto.randomBytes(32).toString('hex') });
  return s.chave;
}

export function hashSenha(senha, sal = crypto.randomBytes(16).toString('hex')) {
  const h = crypto.scryptSync(senha, sal, 64).toString('hex');
  return { sal, hash: h };
}
function confere(senha, u) {
  const h = crypto.scryptSync(senha, u.sal, 64);
  const esperado = Buffer.from(u.hash, 'hex');
  return h.length === esperado.length && crypto.timingSafeEqual(h, esperado);
}

export const usuarios = async () => (await ler(sistema(), 'usuarios', [])).dados;
export const publico = u => u && ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt });

export async function criarToken(u) {
  const corpo = b64(JSON.stringify({ u: u.id, v: u.versao || 1, e: Math.floor(Date.now() / 1000) + DURACAO }));
  const assinatura = crypto.createHmac('sha256', await segredo()).update(corpo).digest('base64url');
  return corpo + '.' + assinatura;
}

export function cookieSessao(token, req) {
  const seguro = new URL(req.url).protocol === 'https:' ? '; Secure' : '';
  return token
    ? `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DURACAO}${seguro}`
    : `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${seguro}`;
}

export async function usuarioDaSessao(req) {
  const m = (req.headers.get('cookie') || '').match(new RegExp(COOKIE + '=([^;]+)'));
  if (!m) return null;
  const [corpo, assinatura] = m[1].split('.');
  if (!corpo || !assinatura) return null;
  const esperado = crypto.createHmac('sha256', await segredo()).update(corpo).digest('base64url');
  if (esperado.length !== assinatura.length || !crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(assinatura))) return null;
  let p; try { p = JSON.parse(Buffer.from(corpo, 'base64url').toString()); } catch { return null; }
  if (!p.e || p.e < Date.now() / 1000) return null;
  const u = (await usuarios()).find(x => x.id === p.u);
  if (!u || (u.versao || 1) !== p.v) return null;
  return u;
}

// Limite de tentativas de login por IP (10 erros a cada 15 minutos)
export async function bloqueado(ip) {
  const { dados } = await ler(sistema(), 'tentativas', {});
  const t = dados[ip];
  return !!t && t.n >= 10 && Date.now() - t.desde < 15 * 60000;
}
export async function registrarErro(ip) {
  await atualizar(sistema(), 'tentativas', {}, d => {
    const agora = Date.now();
    for (const k of Object.keys(d)) if (agora - d[k].desde > 15 * 60000) delete d[k];
    const t = d[ip] || { n: 0, desde: agora };
    t.n++; d[ip] = t; return d;
  });
}

export async function login(email, senha) {
  const u = (await usuarios()).find(x => x.email === String(email).trim().toLowerCase());
  if (!u || !confere(String(senha), u)) return null;
  return u;
}

export function codigoValido(codigo) {
  const c = String(codigo || '').trim().toUpperCase();
  const env = process.env.JCR_CODIGO_INSTALACAO;
  if (env && c === env.trim().toUpperCase()) return true;
  return crypto.createHash('sha256').update(c).digest('hex') === HASH_CODIGO_INSTALACAO;
}

export function validarSenha(s) {
  s = String(s || '');
  if (s.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (s.length > 200) return 'Senha muito longa.';
  return '';
}
export const emailValido = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim()) && String(e).length <= 180;
