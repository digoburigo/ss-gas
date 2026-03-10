export interface AltosAIService {
  icon: string;
  title: string;
  description: string;
  tags: string[];
}

export const altosAIServices: AltosAIService[] = [
  {
    description:
      "Aplicações modernas e escaláveis com as melhores tecnologias do mercado.",
    icon: "terminal",
    tags: ["React", "React Native", "Node.js"],
    title: "Desenvolvimento Web, Mobile & Desktop",
  },
  {
    description:
      "Plataformas SaaS completas, escaláveis e prontas para monetização desde o primeiro dia.",
    icon: "rocket",
    tags: ["Multi-tenant", "Assinaturas", "API"],
    title: "Plataformas SaaS",
  },
  {
    description:
      "Sistemas prontos com código fonte completo para personalizar e escalar seu negócio.",
    icon: "git-branch",
    tags: ["White-label", "Documentado", "Suporte"],
    title: "Venda de Código Fonte",
  },
  {
    description:
      "Infraestrutura escalável e processos automatizados para máxima eficiência.",
    icon: "cloud-cog",
    tags: ["AWS", "CI/CD"],
    title: "Soluções Cloud & DevOps",
  },
  {
    description:
      "Design centrado no usuário para experiências memoráveis e intuitivas.",
    icon: "pen-tool",
    tags: ["Design System", "Prototipagem", "UI Kit"],
    title: "UI/UX Design",
  },
  {
    description:
      "Orientação estratégica para decisões tecnológicas assertivas.",
    icon: "brain",
    tags: ["Arquitetura", "Performance", "Escalabilidade"],
    title: "Consultoria Tech",
  },
];

export interface AltosAIProcessStep {
  number: number;
  icon: string;
  title: string;
  description: string;
  duration: string;
}

export const altosAIProcessSteps: AltosAIProcessStep[] = [
  {
    description:
      "Mapeamos seu negócio, entendemos a dor real e definimos escopo com custo fixo. Sem surpresas no bolso.",
    duration: "1 semana",
    icon: "compass",
    number: 1,
    title: "Descoberta",
  },
  {
    description:
      "Protótipos interativos e definição da stack antes de escrever uma linha de código. Você valida antes de pagar.",
    duration: "1–2 semanas",
    icon: "blocks",
    number: 2,
    title: "Arquitetura",
  },
  {
    description:
      "Desenvolvimento ágil acelerado com sprints semanais, demonstrações do sistema e acompanhamento em tempo real.",
    duration: "4–8 semanas",
    icon: "cpu",
    number: 3,
    title: "Construção",
  },
  {
    description:
      "Deploy, monitoramento, treinamento da equipe e suporte pós-lançamento. Não sumimos quando o projeto vai ao ar.",
    duration: "1 semana",
    icon: "rocket",
    number: 4,
    title: "Lançamento",
  },
];

export interface AltosAIPortfolioItem {
  image: string;
  category: string;
  title: string;
  description: string;
  techStack: string[];
  result: string;
  metric?: string;
  metricLabel?: string;
  featured?: boolean;
  link?: string;
}

export const altosAIPortfolio: AltosAIPortfolioItem[] = [
  {
    category: "Plataforma SaaS",
    description:
      "Plataforma completa de onboarding com IA que automatiza o processo de integração de novos colaboradores. Reduz tempo manual, garante consistência e escala com o crescimento do time.",
    featured: true,
    image: "/altos-ai/portfolio-onboarding.png",
    link: "https://altosrh.com.br",
    metric: "-68%",
    metricLabel: "tempo de onboarding",
    result: "68% redução no tempo de integração de novos colaboradores",
    techStack: ["Tanstack Router", "Postgres", "AI SDK", "TailwindCSS"],
    title: "Plataforma de Onboarding com IA",
  },
  {
    category: "Gestão",
    description:
      "Sistema de programação e controle de gás com roteirização inteligente, agendamento de entregas e rastreamento em tempo real. Fim das planilhas manuais.",
    featured: false,
    image: "/altos-ai/portfolio-gas.jpeg",
    link: "https://gas-app.altosai.com.br",
    result: "73% redução no tempo de roteirização de entregas",
    techStack: ["React", "Node.js", "PostgreSQL"],
    title: "Programação de Gás",
  },
  {
    category: "Governo",
    description:
      "Sistema jurídico para procuradorias municipais com gestão de processos, controle de prazos e geração automatizada de documentos. Conformidade e eficiência para o setor público.",
    featured: false,
    image: "/altos-ai/portfolio-proc.png",
    link: "https://proc.altosai.com.br",
    result: "40% redução no tempo de elaboração de documentos",
    techStack: ["Angular", "TypeScript", ".NET"],
    title: "Procuradoria de Municípios",
  },
];

export const altosAIShowcaseBullets = [
  { icon: "zap", text: "Automações inteligentes que eliminam tarefas manuais" },
  {
    icon: "folder-code",
    text: "Assistentes e chatbots integrados ao seu produto",
  },
  { icon: "git-branch", text: "Análise de dados com insights em tempo real" },
  { icon: "activity", text: "Ciclos curtos de entrega com demo a cada sprint" },
  {
    icon: "audio-lines",
    text: "Código testado, documentado e pronto para escalar",
  },
];

export interface AltosAITechItem {
  icon: string;
  name: string;
}

export const altosAITechStack: AltosAITechItem[] = [
  { icon: "typescript", name: "TypeScript" },
  { icon: "javascript", name: "JavaScript" },
  { icon: "react", name: "React" },
  { icon: "nodejs", name: "Node.js" },
  { icon: "bun", name: "Bun" },
  { icon: "postgresql", name: "PostgreSQL" },
  { icon: "aws", name: "AWS" },
  { icon: "docker", name: "Docker" },
  { icon: "git", name: "Git" },
  { icon: "github", name: "GitHub" },
  { icon: "openai", name: "OpenAI" },
  { icon: "claude-ai", name: "Claude" },
  { icon: "tailwindcss", name: "Tailwind CSS" },
];

export interface AltosAITestimonial {
  name: string;
  role: string;
  company: string;
  initials: string;
  quote: string;
  featured?: boolean;
}

export const altosAITestimonials: AltosAITestimonial[] = [
  {
    company: "Vianna Logística",
    featured: true,
    initials: "CV",
    name: "Carlos Vianna",
    quote:
      "A Altos entregou em 6 semanas o que outras empresas estimavam em 6 meses. Não é só velocidade — é a qualidade do que foi construído que nos impressionou.",
    role: "CEO",
  },
  {
    company: "Rede Atacado",
    initials: "FC",
    name: "Fernanda Costa",
    quote:
      "O sistema de precificação com IA mudou completamente nossa margem. Resultado visível no primeiro mês.",
    role: "Diretora Comercial",
  },
  {
    company: "Clínica+",
    initials: "RM",
    name: "Rafael Menezes",
    quote:
      "Comunicação clara, entregas no prazo e código que qualquer dev consegue manter. Raridade no mercado.",
    role: "CTO",
  },
];

export const altosAIContactInfo = {
  email: "contato@altosai.com.br",
  location: "Santa Catarina, Brasil",
  phone: "+55 (47) 9 9999-9999",
  social: {
    github: "https://github.com/altosai",
    instagram: "https://instagram.com/altosai",
    linkedin: "https://linkedin.com/company/altosai",
  },
};
