import { StrictMode, useEffect, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { LogIn, ShieldCheck, RefreshCw } from 'lucide-react';
import './globals.css';
import { TESTE } from './domain';
import DashboardGestao from './dashboard-gestao';
import DashboardTeste from './dashboard-teste';

type Estado = { configurado: boolean; usuario: unknown } | null;

function Entrar() {
  const [estado, setEstado] = useState<Estado>(null), [erro, setErro] = useState(''), [busy, setBusy] = useState(false);
  async function ver() {
    try { const r = await fetch('/api/auth/estado', { cache: 'no-store' }); setEstado(await r.json()); setErro(''); }
    catch { setErro('Sem conexão com o servidor. Verifique a internet e tente de novo.'); }
  }
  useEffect(() => { ver(); }, []);
  async function enviar(e: FormEvent<HTMLFormElement>, rota: string) {
    e.preventDefault(); setBusy(true); setErro('');
    try {
      const r = await fetch('/api/auth/' + rota, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))) });
      const j: any = await r.json(); if (!r.ok) throw new Error(j.error); await ver();
    } catch (err) { setErro((err as Error).message || 'Não foi possível entrar.'); } finally { setBusy(false); }
  }
  if (erro && !estado) return <main className="test-registration login-page"><section className="panel owner-access"><p>{erro}</p><button className="btn" onClick={ver}><RefreshCw size={16} />Tentar de novo</button></section></main>;
  if (!estado) return <main className="test-registration login-page"><div className="notice"><RefreshCw size={16} className="spin" />Carregando…</div></main>;
  if (estado.usuario) return <DashboardGestao />;
  const instalar = !estado.configurado;
  return <main className="test-registration login-page">
    <a className="test-registration-brand login-brand" href="/hub"><img src="/assets/logo-jcr-320.webp" alt="" width="88" height="88"/><b>JCR Marília</b></a>
    <section className="panel">
      <div className="test-registration-intro"><span>{instalar ? 'PRIMEIRO ACESSO' : 'GESTÃO DA IGREJA'}</span><h1>{instalar ? 'Vamos configurar o painel.' : 'Que bom ter você aqui.'}</h1>
        <p>{instalar ? 'Crie a conta do administrador. Depois você inclui o restante da equipe em Configurações.' : 'Entre com o e-mail e a senha cadastrados pela administração.'}</p></div>
      <form onSubmit={e => enviar(e, instalar ? 'instalar' : 'login')}>
        <div className="form-grid">
          {instalar && <label className="field full"><span>Código de instalação *</span><input name="codigo" required autoComplete="off" placeholder="XXXX-XXXX-XXXX-XXXX" /></label>}
          {instalar && <label className="field full"><span>Seu nome *</span><input name="nome" required minLength={2} maxLength={80} autoComplete="name" /></label>}
          <label className="field full"><span>E-mail *</span><input name="email" type="email" required autoComplete="username" /></label>
          <label className="field full"><span>{instalar ? 'Crie uma senha (mínimo 8 caracteres) *' : 'Senha *'}</span><input name="senha" type="password" required minLength={instalar ? 8 : 1} autoComplete={instalar ? 'new-password' : 'current-password'} /></label>
          {erro && <p className="notice error full">{erro}</p>}
        </div>
        <div className="form-actions"><button className="btn" type="submit" disabled={busy}><LogIn size={16} />{busy ? 'Aguarde…' : instalar ? 'Criar administrador e entrar' : 'Entrar'}</button></div>
      </form>
      <p className="login-foot"><ShieldCheck size={14} />Acesso restrito à equipe da igreja. Esqueceu a senha? Peça a um administrador para gerar uma nova.</p>
    </section>
  </main>;
}

createRoot(document.getElementById('root')!).render(<StrictMode>{TESTE ? <DashboardTeste /> : <Entrar />}</StrictMode>);
