import { useEffect, useState, type FormEvent } from 'react';
import { ShieldCheck, UserPlus, KeyRound, Trash2, Copy, MessageCircle, Lock } from 'lucide-react';
import { PAPEIS, type Me } from './domain';

type Usuario = { id: string; name: string; email: string; role: string; createdAt: string };
const post = async (url: string, body: unknown) => {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Não foi possível concluir.');
  return j;
};

export function EquipeAcessos({ me, aviso }: { me: Me; aviso: (t: string) => void }) {
  const [lista, setLista] = useState<Usuario[]>([]), [busy, setBusy] = useState(false), [senha, setSenha] = useState<{ nome: string; email: string; senha: string } | null>(null);
  const admin = me?.role === 'admin';
  async function carregar() {
    if (!admin) return;
    const r = await fetch('/api/usuarios', { cache: 'no-store' }); const j: any = await r.json();
    if (r.ok) setLista(j.usuarios);
  }
  useEffect(() => { carregar(); }, [admin]);
  async function acao(body: any, ok: string) {
    setBusy(true);
    try { const j = await post('/api/usuarios', body); await carregar(); aviso(ok); return j; }
    catch (e) { aviso((e as Error).message); }
    finally { setBusy(false); }
  }
  async function criar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = e.currentTarget; const v = Object.fromEntries(new FormData(f)) as any;
    const j = await acao({ action: 'create', ...v }, 'Acesso criado.');
    if (j?.senhaTemporaria) { setSenha({ nome: v.name, email: v.email, senha: j.senhaTemporaria }); f.reset(); }
  }
  async function trocarSenha(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = e.currentTarget; const v = Object.fromEntries(new FormData(f)) as any;
    if (v.nova !== v.confirma) { aviso('A confirmação não confere com a nova senha.'); return; }
    setBusy(true);
    try { await post('/api/auth/senha', { atual: v.atual, nova: v.nova }); f.reset(); aviso('Senha alterada.'); }
    catch (e) { aviso((e as Error).message); } finally { setBusy(false); }
  }
  const convite = senha ? `Olá, ${senha.nome.split(' ')[0]}! Seu acesso ao painel da JCR Marília está pronto.\n\nEndereço: ${location.origin}/gestao\nE-mail: ${senha.email}\nSenha provisória: ${senha.senha}\n\nAo entrar, troque a senha em Configurações › Minha senha.` : '';
  return <>
    <section className="panel settings-info team-panel">
      <ShieldCheck size={25} /><h2>Equipe e acessos</h2>
      <p>O painel é privado: só entra quem tem e-mail e senha cadastrados aqui. O formulário de visitantes permite apenas enviar um cadastro.</p>
      {admin ? <>
        <div className="team-list">{lista.map(u => <div key={u.id} className="team-row">
          <div><b>{u.name}{u.id === me?.id ? ' (você)' : ''}</b><small>{u.email}</small></div>
          <select aria-label={'Perfil de ' + u.name} value={u.role} disabled={busy} onChange={e => acao({ action: 'role', id: u.id, role: e.target.value }, 'Perfil atualizado.')}>
            {Object.entries(PAPEIS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button className="icon-btn" title="Gerar nova senha" disabled={busy} onClick={async () => { const j = await acao({ action: 'reset', id: u.id }, 'Nova senha gerada.'); if (j?.senhaTemporaria) setSenha({ nome: u.name, email: u.email, senha: j.senhaTemporaria }); }}><KeyRound size={16} /></button>
          {u.id !== me?.id && <button className="icon-btn" title="Remover acesso" disabled={busy} onClick={() => { if (confirm(`Remover o acesso de ${u.name}?`)) acao({ action: 'delete', id: u.id }, 'Acesso removido.'); }}><Trash2 size={16} /></button>}
        </div>)}</div>
        {senha && <div className="temp-pass"><b>Senha provisória de {senha.nome}:</b><code>{senha.senha}</code><p>Envie para a pessoa. Ela deve trocar a senha ao entrar. Esta senha não aparece de novo.</p>
          <div className="share-buttons"><button className="btn" onClick={() => { navigator.clipboard.writeText(convite).then(() => aviso('Convite copiado.')); }}><Copy size={15} />Copiar convite</button>
            <a className="btn secondary" target="_blank" rel="noreferrer" href={'https://wa.me/?text=' + encodeURIComponent(convite)}><MessageCircle size={15} />Enviar pelo WhatsApp</a>
            <button className="text-btn" onClick={() => setSenha(null)}>Fechar</button></div></div>}
        <form className="form-grid team-form" onSubmit={criar}>
          <label className="field full"><span>Nome</span><input name="name" required minLength={2} maxLength={80} placeholder="Nome da pessoa" /></label>
          <label className="field"><span>E-mail</span><input name="email" type="email" required placeholder="email@exemplo.com" /></label>
          <label className="field"><span>Perfil</span><select name="role" defaultValue="equipe">{Object.entries(PAPEIS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <p className="form-note full"><b>Administrador:</b> tudo, inclusive configurações e equipe. <b>Tesouraria:</b> tudo menos configurações e equipe. <b>Equipe:</b> membros, cultos, relatórios e mensagens, sem o financeiro.</p>
          <div className="full"><button className="btn" type="submit" disabled={busy}><UserPlus size={16} />Criar acesso</button></div>
        </form>
      </> : <p>Fale com um administrador para incluir ou remover pessoas da equipe.</p>}
    </section>
    <section className="panel settings-info">
      <Lock size={24} /><h2>Minha senha</h2>
      <form className="form-grid team-form" onSubmit={trocarSenha}>
        <label className="field full"><span>Senha atual</span><input name="atual" type="password" required autoComplete="current-password" /></label>
        <label className="field"><span>Nova senha</span><input name="nova" type="password" required minLength={8} autoComplete="new-password" /></label>
        <label className="field"><span>Confirmar</span><input name="confirma" type="password" required minLength={8} autoComplete="new-password" /></label>
        <div className="full"><button className="btn secondary" type="submit" disabled={busy}>Trocar senha</button></div>
      </form>
    </section>
  </>;
}

export function Avaliacoes() {
  const [lista, setLista] = useState<any[] | null>(null), [erro, setErro] = useState('');
  useEffect(() => { fetch('/api/feedback', { cache: 'no-store' }).then(async r => { const j: any = await r.json(); if (!r.ok) throw new Error(j.error); setLista(j.feedback); }).catch(e => setErro(e.message)); }, []);
  if (erro) return <section className="panel owner-access"><h2>{erro}</h2></section>;
  if (!lista) return <div className="notice">Carregando avaliações…</div>;
  return <div className="feedback-owner">
    <p className="feedback-count">{lista.length} avaliações recebidas no ambiente de testes · <a className="text-btn" href="/testes/">Abrir ambiente de testes</a></p>
    {lista.length ? lista.map(r => <article className="panel feedback-review" key={r.id}><div><b>{r.kind}</b><span className="pill blue">{r.area}</span><small>{new Date(r.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</small></div><p>{r.message}</p><small>{r.name || 'Participante sem identificação'}</small></article>)
      : <section className="panel owner-access"><h2>As primeiras impressões vão aparecer aqui.</h2><p>Compartilhe o link de testes e peça para as pessoas usarem “Deixar avaliação”.</p></section>}
  </div>;
}
