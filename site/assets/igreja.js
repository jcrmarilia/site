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
    rua: '',            // ex.: 'Rua Exemplo, 123'
    bairro: '',         // ex.: 'Centro'
    cidade: 'Marília - SP',
    cep: '',
    referencia: '',     // ex.: 'Ao lado da praça…'
    mapa: ''            // ex.: 'Rua Exemplo, 123, Marília - SP'
  },

  // Contatos (WhatsApp só números, com 55 + DDD: '5514999999999')
  whatsapp: '',
  telefone: '',
  email: '',

  // Redes sociais: cole o link completo. Vazio = não aparece.
  redes: {
    instagram: '',
    youtube: '',
    facebook: '',
    tiktok: '',
    spotify: ''
  },

  // Programação semanal. dia: 0=domingo, 1=segunda … 6=sábado. hora: 'HH:MM'
  programacao: [
    // { dia: 0, hora: '19:00', nome: 'Culto da Família', descricao: '' },
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
    testes: '/testes',
    avaliacoes: '/avaliacoes',
    bio: '/bio',
    hub: '/hub'
  }
};
