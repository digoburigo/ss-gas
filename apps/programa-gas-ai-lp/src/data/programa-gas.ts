const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);

export const pgNavLinks = [
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Como Funciona", href: "#como-funciona" },
  { label: "Depoimentos", href: "#depoimentos" },
  { label: "Contato", href: "#contato" },
];

export const pgHero = {
  headline: "Programação de gás sem planilha, sem erro, sem multa.",
  description:
    "O programagas.ai lê seus contratos, calcula desvios em tempo real e garante que cada unidade consuma dentro da faixa certa — sem surpresas na fatura.",
  ctaPrimary: { label: "Agende uma Demo Gratuita", href: "#contato" },
  ctaSecondary: { label: "Ver funcionalidades →", href: "#funcionalidades" },
};

export const pgTrustStats = [
  { target: 73, suffix: "%", label: "menos tempo de programação" },
  { value: brl(2250000), label: "em multas evitáveis" },
  { target: 100, suffix: "%", label: "dos contratos monitorados" },
  { target: 24, suffix: "h", label: "para começar a operar" },
];

export const pgProblems = [
  {
    icon: "spreadsheet",
    title: "Planilhas manuais",
    description:
      "Horas perdidas preenchendo, cruzando dados e corrigindo fórmulas. Qualquer erro humano pode custar caro no final do mês.",
    tag: "Alto risco de erro",
    tagDot: "red",
    dark: false,
  },
  {
    icon: "alert",
    title: "Multas por desvio",
    description:
      "PVEMA, PVEME, sobredemanda. Cada desvio acumulado gera multas que poderiam ser evitadas com programação precisa.",
    tag: "Impacto financeiro direto",
    tagDot: "teal",
    dark: true,
  },
  {
    icon: "trending",
    title: "Falta de visibilidade",
    description:
      "Sem um painel centralizado, é impossível saber em tempo real se uma unidade está prestes a extrapolar a tolerância contratual.",
    tag: "Decisões às cegas",
    tagDot: "red",
    dark: false,
  },
];

export const pgFeatures = [
  {
    id: "contratos",
    title: "Contratos com IA",
    description:
      "Faça upload do PDF do contrato. A IA extrai automaticamente todas as cláusulas, tolerâncias e volumes — sem digitação manual.",
    dark: true,
    size: "large",
    badge: "IA generativa",
    icon: "file",
  },
  {
    id: "programacao",
    title: "Programação Diária & Mensal",
    description:
      "Dashboard por unidade com controle granular do volume programado vs. contratado.",
    dark: false,
    size: "medium",
    badge: "Automação",
    icon: "calendar",
  },
  {
    id: "alertas",
    title: "Alertas de Desvio",
    description:
      "Notificações em tempo real quando uma unidade ultrapassa os limites de tolerância do contrato.",
    dark: false,
    size: "small",
    badge: "Monitoramento",
    icon: "bell",
  },
  {
    id: "multas",
    title: "Gestão de Multas",
    description:
      "Cálculo automático de PVEMA, PVEME e sobredemanda. Saiba exatamente quanto vai pagar antes da fatura chegar.",
    dark: false,
    size: "small",
    badge: "Analytics",
    icon: "chart",
  },
  {
    id: "acuracia",
    title: "Acurácia de Programação",
    description:
      "Analytics detalhados de acurácia por unidade e período, com análise de causas para cada desvio identificado.",
    dark: false,
    size: "medium",
    badge: "Machine Learning",
    accent: true,
    icon: "target",
  },
  {
    id: "assistente",
    title: "Assistente IA",
    description:
      "Pergunte sobre qualquer cláusula do contrato, consulte o histórico de consumo ou simule cenários de programação. O assistente conhece todos os seus dados.",
    dark: true,
    size: "full",
    badge: "Chat IA",
    icon: "message",
  },
];

export const pgSteps = [
  {
    number: "1",
    title: "Cadastre seus contratos",
    description:
      "Faça upload do PDF. A IA extrai automaticamente todos os dados contratuais — volumes, tolerâncias e vigências.",
    style: "dark",
  },
  {
    number: "2",
    title: "Programe o consumo",
    description:
      "Defina os volumes diários por unidade. O sistema alerta quando você está fora da faixa antes de confirmar.",
    style: "blue",
  },
  {
    number: "3",
    title: "Monitore em tempo real",
    description:
      "Acompanhe acurácia, desvios e multas projetadas em um painel centralizado. Intervenha antes que vire custo.",
    style: "teal",
  },
];

export const pgTestimonials = [
  {
    name: "Marcos Rodrigues",
    role: "Gerente de Operações · Distribuidora de Gás SP",
    quote:
      "Antes, passávamos horas toda semana ajustando planilhas e mesmo assim errávamos. Com o programagas.ai, a programação mensal leva menos de 30 minutos e os desvios caíram 80%.",
    initials: "MR",
    dark: false,
  },
  {
    name: "Ana Carolina Lima",
    role: "Diretora de Supply · Grupo Energia Industrial",
    quote:
      "A funcionalidade de alertas de desvio salvou nossas operações diversas vezes. Hoje sabemos, com horas de antecedência, se uma unidade vai extrapolar — e agimos antes da multa.",
    initials: "AL",
    dark: true,
  },
  {
    name: "Felipe Pires",
    role: "Coordenador de Contratos · Gás & Energia RJ",
    quote:
      "A extração de contratos por IA é impressionante. Em minutos o sistema já tinha identificado todos os limites de tolerância de um contrato de 40 páginas. Implementamos em uma semana.",
    initials: "FP",
    dark: false,
  },
];

export const pgStatsBanner = [
  { value: "73%", label: "redução no tempo de programação mensal" },
  { value: brl(2250000), label: "em multas nos primeiros 90 dias de uso" },
  { value: "1 sem", label: "tempo médio de implementação" },
];

export const pgCTA = {
  headline: "Pare de perder dinheiro com multas evitáveis.",
  subtext:
    "Cada mês sem o programagas.ai é mais um mês pagando por desvios que poderiam ter sido evitados.",
  cta: { label: "Agende uma Demo Gratuita", href: "#contato" },
  finePrint: "Sem compromisso. Implementação em semanas.",
};

export const pgFooterLinks = [
  {
    title: "Produto",
    links: [
      { label: "Funcionalidades", href: "#funcionalidades" },
      { label: "Como Funciona", href: "#como-funciona" },
      { label: "Segurança", href: "#contato" },
      { label: "Integrações", href: "#contato" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre nós", href: "#contato" },
      { label: "Blog", href: "#contato" },
      { label: "Carreiras", href: "#contato" },
      { label: "Contato", href: "#contato" },
    ],
  },
  {
    title: "Suporte",
    links: [
      { label: "Central de Ajuda", href: "#contato" },
      { label: "Documentação", href: "#contato" },
      { label: "Status do sistema", href: "#contato" },
    ],
  },
];

export const pgContactInfo = {
  email: "contato@programagas.ai",
};
