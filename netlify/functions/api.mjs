// API da plataforma JCR Marília (Netlify Function).
//   /api/auth/*          login da equipe
//   /api/data            dados do sistema real (exige login)
//   /api/usuarios        equipe e acessos (administrador)
//   /api/registration    cadastro público de visitantes
//   /api/feedback        avaliações do ambiente de testes (administrador)
//   /api/teste/*         ambiente de testes (sem login, dados fictícios)
import { carregar, executar, cadastroPublico, salvarAvaliacao, listarAvaliacoes, restaurarTestes, Erro } from '../lib/dados.mjs';
import { usuarioDaSessao, usuarios, publico, login, criarToken, cookieSessao, bloqueado, registrarErro, codigoValido, validarSenha, emailValido, hashSenha, sistema } from '../lib/acesso.mjs';
import { atualizar } from '../lib/armazenamento.mjs';
import crypto from 'node:crypto';

export const config = { path: ['/api/*'] };

const json = (v, status = 200, headers = {}) => new Response(JSON.stringify(v), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }
});
const ipDe = (req, context) => context?.ip || req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';

async function corpo(req, limite = 200000) {
  const t = await req.text();
  if (t.length > limite) throw new Erro('Requisição muito grande.', 413);
  try { return t ? JSON.parse(t) : {}; } catch { throw new Erro('Dados inválidos.'); }
}
function mesmaOrigem(req) {
  const o = req.headers.get('origin');
  if (o && o !== new URL(req.url).origin) throw new Erro('Origem não autorizada.', 403);
  if (!(req.headers.get('content-type') || '').includes('application/json')) throw new Erro('Formato inválido.', 415);
}
const podeFinanceiro = u => u.role === 'admin' || u.role === 'tesouraria';
const PAPEIS = ['admin', 'tesouraria', 'equipe'];

function resposta(dados, req, teste, usuario) {
  const origem = new URL(req.url).origin;
  const r = { ...dados, formUrl: origem + (teste ? '/testes/cadastro' : '/cadastro') };
  if (!teste) {
    r.me = publico(usuario);
    if (!podeFinanceiro(usuario)) r.transactions = [];
  }
  return r;
}

export default async (req, context) => {
  const url = new URL(req.url);
  const rota = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  const metodo = req.method;
  try {
    if (metodo !== 'GET' && metodo !== 'HEAD') mesmaOrigem(req);

    // ---------- ambiente de testes ----------
    if (rota.startsWith('teste/')) {
      const sub = rota.slice(6);
      if (sub === 'data' && metodo === 'GET') return json(resposta(await carregar(true), req, true));
      if (sub === 'data' && metodo === 'POST') {
        const b = await corpo(req);
        const r = await executar(true, b.action, b.data, null);
        return json({ ok: true, ...r });
      }
      if (sub === 'registration' && metodo === 'POST') { await cadastroPublico(true, await corpo(req, 12000), ipDe(req, context)); return json({ ok: true }); }
      if (sub === 'feedback' && metodo === 'POST') { await salvarAvaliacao(await corpo(req, 12000)); return json({ ok: true }); }
      if (sub === 'reset' && metodo === 'POST') { await restaurarTestes(); return json({ ok: true }); }
      return json({ error: 'Endereço não encontrado.' }, 404);
    }

    // ---------- cadastro público ----------
    if (rota === 'registration' && metodo === 'POST') {
      await cadastroPublico(false, await corpo(req, 12000), ipDe(req, context));
      return json({ ok: true });
    }

    // ---------- acesso ----------
    if (rota === 'auth/estado' && metodo === 'GET') {
      const lista = await usuarios();
      const u = await usuarioDaSessao(req);
      return json({ configurado: lista.length > 0, usuario: publico(u) });
    }
    if (rota === 'auth/instalar' && metodo === 'POST') {
      const ip = ipDe(req, context);
      if (await bloqueado(ip)) throw new Erro('Muitas tentativas. Aguarde 15 minutos.', 429);
      const b = await corpo(req, 5000);
      if (!codigoValido(b.codigo)) { await registrarErro(ip); throw new Erro('Código de instalação incorreto.', 403); }
      const nome = String(b.nome || '').trim();
      if (nome.length < 2 || nome.length > 80) throw new Erro('Informe seu nome.');
      if (!emailValido(b.email)) throw new Erro('E-mail inválido.');
      const erroSenha = validarSenha(b.senha); if (erroSenha) throw new Erro(erroSenha);
      let criado;
      await atualizar(sistema(), 'usuarios', [], lista => {
        if (lista.length) throw new Erro('O sistema já foi configurado. Entre com seu e-mail e senha.', 409);
        criado = { id: crypto.randomUUID(), name: nome, email: String(b.email).trim().toLowerCase(), role: 'admin', versao: 1, createdAt: new Date().toISOString(), ...hashSenha(String(b.senha)) };
        return [criado];
      });
      return json({ ok: true, usuario: publico(criado) }, 200, { 'Set-Cookie': cookieSessao(await criarToken(criado), req) });
    }
    if (rota === 'auth/login' && metodo === 'POST') {
      const ip = ipDe(req, context);
      if (await bloqueado(ip)) throw new Erro('Muitas tentativas. Aguarde 15 minutos e tente de novo.', 429);
      const b = await corpo(req, 5000);
      const u = await login(b.email, b.senha);
      if (!u) { await registrarErro(ip); throw new Erro('E-mail ou senha incorretos.', 401); }
      return json({ ok: true, usuario: publico(u) }, 200, { 'Set-Cookie': cookieSessao(await criarToken(u), req) });
    }
    if (rota === 'auth/logout' && metodo === 'POST') return json({ ok: true }, 200, { 'Set-Cookie': cookieSessao('', req) });

    // ---------- daqui para baixo exige login ----------
    const usuario = await usuarioDaSessao(req);
    if (!usuario) return json({ error: 'Sua sessão terminou. Entre novamente.', login: true }, 401);

    if (rota === 'auth/senha' && metodo === 'POST') {
      const b = await corpo(req, 5000);
      if (!(await login(usuario.email, b.atual))) throw new Erro('Senha atual incorreta.', 403);
      const erroSenha = validarSenha(b.nova); if (erroSenha) throw new Erro(erroSenha);
      let novo;
      await atualizar(sistema(), 'usuarios', [], lista => lista.map(x => x.id === usuario.id ? (novo = { ...x, ...hashSenha(String(b.nova)), versao: (x.versao || 1) + 1 }) : x));
      return json({ ok: true }, 200, { 'Set-Cookie': cookieSessao(await criarToken(novo), req) });
    }

    if (rota === 'data' && metodo === 'GET') return json(resposta(await carregar(false), req, false, usuario));
    if (rota === 'data' && metodo === 'POST') {
      const b = await corpo(req);
      const r = await executar(false, b.action, b.data, usuario);
      return json({ ok: true, ...r });
    }

    if (rota === 'feedback' && metodo === 'GET') {
      if (usuario.role !== 'admin') throw new Erro('Somente administradores veem as avaliações.', 403);
      return json({ feedback: await listarAvaliacoes() });
    }

    if (rota === 'usuarios') {
      if (usuario.role !== 'admin') throw new Erro('Somente administradores gerenciam a equipe.', 403);
      if (metodo === 'GET') return json({ usuarios: (await usuarios()).map(publico) });
      if (metodo === 'POST') {
        const b = await corpo(req, 5000);
        let senhaTemporaria = '';
        await atualizar(sistema(), 'usuarios', [], lista => {
          if (b.action === 'create') {
            const email = String(b.email || '').trim().toLowerCase();
            if (!emailValido(email)) throw new Erro('E-mail inválido.');
            if (lista.some(x => x.email === email)) throw new Erro('Já existe um acesso com esse e-mail.');
            const nome = String(b.name || '').trim(); if (nome.length < 2 || nome.length > 80) throw new Erro('Informe o nome.');
            if (!PAPEIS.includes(b.role)) throw new Erro('Perfil inválido.');
            senhaTemporaria = crypto.randomBytes(6).toString('base64url');
            lista.push({ id: crypto.randomUUID(), name: nome, email, role: b.role, versao: 1, createdAt: new Date().toISOString(), ...hashSenha(senhaTemporaria) });
            return lista;
          }
          const alvo = lista.find(x => x.id === b.id);
          if (!alvo) throw new Erro('Acesso não encontrado.', 404);
          const admins = lista.filter(x => x.role === 'admin');
          if (b.action === 'role') {
            if (!PAPEIS.includes(b.role)) throw new Erro('Perfil inválido.');
            if (alvo.role === 'admin' && b.role !== 'admin' && admins.length === 1) throw new Erro('É preciso ter pelo menos um administrador.');
            alvo.role = b.role; return lista;
          }
          if (b.action === 'reset') {
            senhaTemporaria = crypto.randomBytes(6).toString('base64url');
            Object.assign(alvo, hashSenha(senhaTemporaria), { versao: (alvo.versao || 1) + 1 }); return lista;
          }
          if (b.action === 'delete') {
            if (alvo.id === usuario.id) throw new Erro('Você não pode remover o próprio acesso.');
            if (alvo.role === 'admin' && admins.length === 1) throw new Erro('É preciso ter pelo menos um administrador.');
            return lista.filter(x => x.id !== b.id);
          }
          throw new Erro('Ação não reconhecida.');
        });
        return json({ ok: true, senhaTemporaria });
      }
    }

    return json({ error: 'Endereço não encontrado.' }, 404);
  } catch (e) {
    if (e instanceof Erro) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: 'Não foi possível concluir. Tente novamente.' }, 500);
  }
};
