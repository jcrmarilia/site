/* =====================================================================
   DADOS DA IGREJA — tudo o que aparece no site sai deste arquivo.
   Para mudar horário, endereço, rede social ou evento, edite só aqui.
   Campos vazios ('') ficam escondidos no site automaticamente.
   ===================================================================== */
window.IGREJA = {
  nome: 'JCR Marília',
  nomeCompleto: 'Igreja Jesus Cristo é a Resposta',
  lema: 'Uma comunidade de fé, um lugar para pertencer',
  boasVindas: 'Que bom ter você aqui. Queremos conhecer você e caminhar juntos.',
  versiculo: { texto: 'Assim nós, que somos muitos, somos um só corpo em Cristo.', ref: 'Romanos 12:5' },

  // Três frases curtas que aparecem no topo da página inicial
  destaques: [
    'Uma família para pertencer e caminhar junto.',
    'A Palavra de Deus anunciada com amor e verdade.',
    'Portas abertas para você e sua família.'
  ],
  // Missão e visão (aparecem em "Quem somos"). Vazio = não aparece.
  missao: '',
  visao: '',
  // Palavras que giram em volta do logo
  palavrasSelo: ['Família', 'Fé', 'Comunidade', 'Igreja', 'Amor', 'Jesus'],
  // Frase da faixa que rola na tela
  letreiro: 'Venha nos visitar',
  // Vídeo de fundo do topo da página inicial: cole o link de um vídeo do YouTube (opcional)
  videoFundo: '',

  // Endereço — "mapa" é o texto pesquisado no Google Maps (pode ser o próprio endereço)
  endereco: {
    rua: 'Rua Clotilde Calabresi Magalhães, 248',
    bairro: 'Jardim Continental',
    cidade: 'Marília - SP',
    cep: '',
    referencia: '',     // ex.: 'Ao lado da praça…'
    mapa: 'Rua Clotilde Calabresi Magalhães, 248, Jardim Continental, Marília - SP',
    linkMapa: 'https://share.google/qGu1Y5IMr9RBWSNJp'  // link do Google Maps da igreja (botão "Como chegar")
  },

  // Contatos (WhatsApp só números, com 55 + DDD: '5514999999999')
  whatsapp: '',
  telefone: '',
  email: '',

  // Redes sociais: cole o link completo. Vazio = não aparece.
  redes: {
    instagram: 'https://www.instagram.com/jesuscristoresposta/',
    youtube: 'https://www.youtube.com/channel/UCbDx-z3CxxpFAonLEWnwN9A',
    facebook: '',
    tiktok: '',
    spotify: ''
  },

  // Programação. dia: 0=domingo, 1=segunda … 6=sábado. hora: 'HH:MM'
  // semanaDoMes (opcional): 1 = só na 1ª semana do mês (ex.: 1º sábado), 2 = 2ª … ; sem o campo = toda semana
  programacao: [
    { dia: 0, hora: '10:00', nome: 'Culto da Família', descricao: '' },
    { dia: 3, hora: '20:00', nome: 'Culto de Oração', descricao: '' },
    { dia: 4, hora: '20:00', nome: 'Entre Mulheres', descricao: 'Na casa da pastora' },
    { dia: 6, hora: '20:00', nome: 'Vigília', descricao: '', semanaDoMes: 1 },
  ],

  // Agenda/eventos. Eventos com data passada somem sozinhos.
  eventos: [
    // { data: '2026-12-24', hora: '20:00', titulo: 'Culto de Natal', descricao: '', local: '' },
  ],

  // Ministérios / grupos (opcional)
  ministerios: [
    // { nome: 'Louvor', descricao: 'Equipe de música e adoração', contato: '' },
  ],

  // Liderança (opcional)
  lideranca: [
    // { nome: 'Pr. Nome Sobrenome', funcao: 'Pastor presidente' },
  ],

  // Dízimos e ofertas (opcional). Vazio = seção escondida.
  contribuicao: {
    pix: '',            // chave PIX
    titular: '',        // nome que aparece no PIX
    banco: '',          // ex.: 'Banco X — Ag 0000 / CC 00000-0'
    texto: 'Sua contribuição sustenta a obra de Deus e os projetos da igreja.'
  },

  // Endereços curtos do próprio site (não precisa mexer)
  links: {
    paginaInicial: '/paginainicial',
    cadastro: '/cadastro',
    gestao: '/gestao',
    bio: '/bio',
    hub: '/hub'
  }
};
