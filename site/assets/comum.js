/* JCR Marília — funções compartilhadas entre as páginas */
(function(){
  const I = window.IGREJA;
  const DIAS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const DIAS_L = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
  const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pad = n => String(n).padStart(2,'0');
  const ymd = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const hora = h => { if(!h) return ''; const [H,M] = h.split(':'); return M==='00' ? (+H)+'h' : (+H)+'h'+M; };

  const ICONES = {
    instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/>',
    youtube:'<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="m10.5 9.5 4 2.5-4 2.5z" fill="currentColor"/>',
    facebook:'<path d="M14 21v-7.5h2.6l.4-3H14V8.6c0-.9.3-1.5 1.6-1.5H17V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.8 1.4-3.8 3.9v2.3H8.5v3H11V21"/>',
    tiktok:'<path d="M14 3v11.5a3.5 3.5 0 1 1-3-3.46M14 3c.4 2.6 2.2 4.4 5 4.6"/>',
    spotify:'<circle cx="12" cy="12" r="9"/><path d="M7.5 9.5c3-1 6.5-.7 9 .8M8 12.6c2.5-.7 5.2-.4 7.3.8M8.6 15.4c1.9-.5 3.8-.3 5.4.6"/>',
    whatsapp:'<path d="M20 11.6a8.2 8.2 0 0 1-12.2 7.2L3.5 20l1.3-4.1A8.2 8.2 0 1 1 20 11.6z"/><path d="M9 8.6c.2-.4.5-.5.8-.5h.5c.2 0 .4 0 .5.4l.7 1.6c.1.2 0 .4-.1.6l-.5.6c.6 1.2 1.6 2.1 2.8 2.7l.6-.6c.2-.2.4-.2.6-.1l1.5.7c.3.1.4.3.3.6-.1.9-.9 1.6-1.8 1.6-2.9-.3-5.8-3-6.2-5.9 0-.6.1-1.1.3-1.7z" fill="currentColor" stroke="none"/>',
    pin:'<path d="M12 21s-7-6.2-7-11.5a7 7 0 1 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    cal:'<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 4-6 8-6s7.2 2 8 6"/>',
    users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .7 3.2 2.4 3.5 5.2"/>',
    home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    heart:'<path d="M12 20s-7.5-4.6-9-9.3C1.9 7.2 4.2 4 7.5 4c2 0 3.4 1.1 4.5 2.6C13.1 5.1 14.5 4 16.5 4 19.8 4 22.1 7.2 21 10.7 19.5 15.4 12 20 12 20z"/>',
    next:'<path d="m9 5 7 7-7 7"/>',
    arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    qr:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM21 14v.01M14 21h.01M17 21h4v-4"/>',
    lock:'<rect x="4" y="10.5" width="16" height="10.5" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
    flask:'<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7 15h10"/>',
    star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8c-2-4-6-4-6-1.5S9.5 8 12 8zm0 0c2-4 6-4 6-1.5S14.5 8 12 8z"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/>',
    phone:'<path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 12l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    share:'<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>',
    book:'<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5zM4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3"/>',
    map:'<path d="m9 4-6 2.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
    check:'<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16.5 9.5"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h10"/>',
    x:'<path d="M6 6l12 12M18 6 6 18"/>',
    play:'<circle cx="12" cy="12" r="9"/><path d="m10 8.5 5 3.5-5 3.5z" fill="currentColor"/>'
  };
  const ic = (n, cls='') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONES[n]||''}</svg>`;

  const REDES_NOME = {instagram:'Instagram', youtube:'YouTube', facebook:'Facebook', tiktok:'TikTok', spotify:'Spotify'};
  const redesAtivas = () => Object.entries(I.redes||{}).filter(([,u])=>u).map(([k,u])=>({k,u,nome:REDES_NOME[k]||k}));

  const enderecoTexto = () => { const e=I.endereco||{}; return [e.rua, e.bairro, e.cidade].filter(Boolean).join(' · '); };
  const mapaQuery = () => { const e=I.endereco||{}; return e.mapa || [e.rua, e.bairro, e.cidade].filter(Boolean).join(', ') || (I.nomeCompleto+' '+(e.cidade||'')); };
  const linkMaps = () => (I.endereco&&I.endereco.linkMapa) || 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(mapaQuery());
  const linkWaze = () => 'https://waze.com/ul?navigate=yes&q='+encodeURIComponent(mapaQuery());
  const embedMaps = () => 'https://www.google.com/maps?q='+encodeURIComponent(mapaQuery())+'&output=embed';
  const linkWa = (txt='Olá! Vim pelo site da '+I.nome+'.') => I.whatsapp ? 'https://wa.me/'+I.whatsapp.replace(/\D/g,'')+'?text='+encodeURIComponent(txt) : '';

  // Próximos cultos a partir de agora (horário do aparelho)
  function proximosCultos(qtd=1){
    const lista=[]; const agora=new Date();
    for(let add=0; add<40 && lista.length<qtd*3; add++){
      const d=new Date(agora); d.setDate(agora.getDate()+add);
      (I.programacao||[]).filter(p=>+p.dia===d.getDay() && (!p.semanaDoMes || Math.ceil(d.getDate()/7)===+p.semanaDoMes)).forEach(p=>{
        const [H,M]=(p.hora||'00:00').split(':').map(Number); const quando=new Date(d); quando.setHours(H,M,0,0);
        if(quando.getTime() > agora.getTime()-90*60000) lista.push({...p, quando, add});   // conta como "agora" até 1h30 depois do início
      });
    }
    return lista.sort((a,b)=>a.quando-b.quando).slice(0,qtd);
  }
  function rotuloQuando(c){
    const agora=new Date(); const diff=(c.quando-agora)/60000;
    if(diff<=0) return 'Acontecendo agora';
    const h=hora(c.hora);
    if(c.add===0) return 'Hoje às '+h;
    if(c.add===1) return 'Amanhã às '+h;
    return (c.add<7 ? DIAS[c.quando.getDay()] : c.quando.getDate()+'/'+String(c.quando.getMonth()+1).padStart(2,'0'))+' às '+h;
  }
  function eventosFuturos(){
    const hj=ymd(new Date());
    return (I.eventos||[]).filter(e=>e.data && e.data>=hj).sort((a,b)=>(a.data+(a.hora||'')).localeCompare(b.data+(b.hora||'')));
  }
  function linkAgendaGoogle(e){
    const d=e.data.replace(/-/g,''); let datas;
    if(e.hora){ const [H,M]=e.hora.split(':'); const ini=d+'T'+H+M+'00'; const fimH=pad(Math.min(23,+H+2)); datas=ini+'/'+d+'T'+fimH+M+'00'; }
    else { const n=new Date(e.data+'T12:00:00'); n.setDate(n.getDate()+1); datas=d+'/'+ymd(n).replace(/-/g,''); }
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(e.titulo+' — '+I.nome)+'&dates='+datas+'&ctz=America/Sao_Paulo&details='+encodeURIComponent(e.descricao||'')+'&location='+encodeURIComponent(e.local||mapaQuery());
  }
  const fmtDataEvento = s => { const [y,m,d]=s.split('-'); const dt=new Date(+y,+m-1,+d); return {dia:d, mes:MESES[+m-1], semana:DIAS_L[dt.getDay()]}; };
  const ORD=['','Primeiro','Segundo','Terceiro','Quarto','Quinto'];
  const quandoAcontece = p => p.semanaDoMes ? ORD[p.semanaDoMes]+' '+DIAS_L[+p.dia].replace('-feira','')+' do mês' : (+p.dia===0||+p.dia===6 ? 'Todo ' : 'Toda ')+DIAS_L[+p.dia];
  const pendente = txt => `<span class="pendente">${esc(txt)}</span>`;

  async function copiar(txt, el){
    try{ await navigator.clipboard.writeText(txt); }
    catch{ const t=document.createElement('textarea'); t.value=txt; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
    if(el){ const o=el.innerHTML; el.innerHTML=ic('copy')+' Copiado!'; setTimeout(()=>el.innerHTML=o,1600); }
  }
  const urlAbs = p => location.origin + p;

  // ---------- topo, rodapé e animações compartilhados por todas as páginas ----------
  const MENU = [['Início','/paginainicial'],['Programação','/paginainicial#programacao'],['Quem somos','/paginainicial#sobre'],['Localização','/paginainicial#localizacao'],['Contato','/paginainicial#contato']];
  function topo(ativo=''){
    const el=document.getElementById('topo'); if(!el) return;
    el.className='topo';
    el.innerHTML=`<div class="wrap"><a class="marca" href="/paginainicial"><img src="/assets/logo-jcr-96.png" alt="" width="48" height="48"><span>JCR Marília<small>Jesus Cristo é a Resposta</small></span></a>
      <nav class="menu" aria-label="Menu principal">${MENU.map(([t,u])=>`<a href="${u}" class="${t===ativo?'ativo':''}">${t}</a>`).join('')}</nav>
      <a class="btn btn-branco" href="/cadastro">Sou visitante</a>
      <button class="abre-menu" aria-label="Abrir menu" aria-expanded="false">${ic('menu')}</button></div>`;
    const mm=document.createElement('nav'); mm.className='menu-movel'; mm.setAttribute('aria-label','Menu');
    mm.innerHTML=`<button class="abre-menu fecha" aria-label="Fechar menu">${ic('x')}</button>${MENU.map(([t,u])=>`<a href="${u}">${t}</a>`).join('')}<a href="/cadastro" style="color:var(--azul-brilho)">Sou visitante</a>`;
    document.body.appendChild(mm);
    const abrir=v=>{mm.classList.toggle('aberto',v);document.body.style.overflow=v?'hidden':'';el.querySelector('.abre-menu').setAttribute('aria-expanded',v)};
    el.querySelector('.abre-menu').onclick=()=>abrir(true);
    mm.querySelector('.fecha').onclick=()=>abrir(false);
    mm.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>abrir(false)));
    const solido=()=>el.classList.toggle('solido',scrollY>40); solido(); addEventListener('scroll',solido,{passive:true});
  }
  function rodape(){
    const el=document.getElementById('rodape'); if(!el) return;
    el.className='rodape';
    const e=I.endereco||{};
    el.innerHTML=`<div class="wrap"><div class="colunas">
      <div><img src="/assets/logo-jcr-320.webp" alt="JCR Marília" width="84" height="84"><p style="max-width:34ch;margin:0">${esc(I.lema)}. ${esc(I.nomeCompleto)} em ${esc(e.cidade||'Marília - SP')}.</p>
        <div class="sociais">${redesAtivas().map(r=>`<a href="${esc(r.u)}" target="_blank" rel="noopener" aria-label="${esc(r.nome)}">${ic(r.k)}</a>`).join('')}${I.whatsapp?`<a href="${linkWa()}" target="_blank" rel="noopener" aria-label="WhatsApp">${ic('whatsapp')}</a>`:''}</div></div>
      <div><h4>Navegue</h4><ul>${MENU.map(([t,u])=>`<li><a href="${u}">${t}</a></li>`).join('')}<li><a href="/cadastro">Cadastro de visitantes</a></li></ul></div>
      <div><h4>Contato</h4><ul>${e.rua?`<li>${esc(e.rua)}${e.bairro?' · '+esc(e.bairro):''}</li>`:''}<li>${esc(e.cidade||'Marília - SP')}</li>${I.telefone?`<li>${esc(I.telefone)}</li>`:''}${I.email?`<li><a href="mailto:${esc(I.email)}">${esc(I.email)}</a></li>`:''}${I.whatsapp?`<li><a href="${linkWa()}" target="_blank" rel="noopener">WhatsApp da igreja</a></li>`:''}</ul></div>
    </div><div class="base"><span>© ${new Date().getFullYear()} ${esc(I.nomeCompleto)} · ${esc(I.nome)}</span><a href="/hub">Área da equipe</a></div></div>`;
  }
  // entrada suave dos elementos ao aparecerem na tela
  function animar(raiz=document){
    const itens=[...raiz.querySelectorAll('[data-anima]:not(.visivel)')];
    if(!('IntersectionObserver' in window)){ itens.forEach(i=>i.classList.add('visivel')); return; }
    const io=new IntersectionObserver(es=>es.forEach(en=>{ if(en.isIntersecting){ const d=en.target.dataset.atraso; if(d) en.target.style.animationDelay=d+'ms'; en.target.classList.add('visivel'); io.unobserve(en.target); } }),{threshold:.12,rootMargin:'0px 0px -40px 0px'});
    itens.forEach(i=>io.observe(i));
  }
  function letreiro(el, texto){
    if(!el) return; const item=`<span>${esc(texto)}<i>•</i></span>`;
    el.innerHTML=`<div class="faixa">${item.repeat(8)}${item.repeat(8)}</div>`;
  }
  const idYoutube = u => (String(u||'').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)||[])[1]||'';

  window.JCR = { topo, rodape, animar, letreiro, idYoutube, I, DIAS, DIAS_L, esc, hora, ic, redesAtivas, enderecoTexto, mapaQuery, linkMaps, linkWaze, embedMaps, linkWa, proximosCultos, rotuloQuando, eventosFuturos, linkAgendaGoogle, fmtDataEvento, quandoAcontece, pendente, copiar, urlAbs, ymd };
  document.addEventListener('DOMContentLoaded', ()=>{ document.querySelectorAll('[data-ano]').forEach(e=>e.textContent=new Date().getFullYear()); });
})();
