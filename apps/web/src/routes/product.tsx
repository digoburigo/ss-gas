import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Flame,
  Mail,
  MapPin,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import { Sparkles as SparklesComponent } from "~/components/sparkles";

export const Route = createFileRoute("/product")({
  component: RouteComponent,
});

function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.message.trim()
    ) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Por favor, insira um email válido");
      return;
    }

    toast.success(
      "Mensagem enviada com sucesso! Entraremos em contato em breve.",
    );

    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <section
      id="contato"
      className="relative overflow-hidden bg-gradient-to-br from-[#0047AB] via-[#003080] to-[#001845] py-28 text-white"
    >
      {/* Animated decorative blobs */}
      <div className="pointer-events-none absolute top-10 left-10 h-72 w-72 animate-pulse rounded-full bg-[#00BFFF]/15 blur-3xl" />
      <div className="pointer-events-none absolute right-10 bottom-10 h-96 w-96 animate-pulse rounded-full bg-[#0047AB]/20 blur-3xl [animation-delay:1s]" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 h-64 w-64 animate-pulse rounded-full bg-white/5 blur-3xl [animation-delay:2s]" />

      <div className="relative container mx-auto max-w-7xl px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-6 text-4xl font-extrabold tracking-tight text-balance md:text-6xl">
            Entre em Contato
            <div className="bg-white">
              <svg
                width="920"
                height="200"
                viewBox="0 0 920 200"
                xmlns="http://www.w3.org/2000/svg"
              >
                <text
                  x="40"
                  y="130"
                  font-family="Montserrat, Arial, Helvetica, sans-serif"
                  font-size="88"
                  font-weight="600"
                  fill="#1F4DFF"
                  letter-spacing="-1"
                >
                  programagas.ai
                </text>
              </svg>
            </div>
          </h2>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-white/80 md:text-xl">
            Quer saber mais sobre o Programa GAS? Fale conosco.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <div>
              <h3 className="mb-6 text-2xl font-bold">
                Informações de Contato
              </h3>
              <p className="mb-8 leading-relaxed text-white/80">
                Entre em contato conosco através dos canais abaixo ou preencha o
                formulário ao lado.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="mb-1 text-lg font-semibold">Email</h4>
                  <a
                    href="mailto:contato@programagas.ai"
                    className="text-base text-white/80 transition-colors hover:text-white"
                  >
                    contato@programagas.ai
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="mb-1 text-lg font-semibold">Endereço</h4>
                  <p className="text-base text-white/80">
                    Criciúma, SC
                    <br />
                    Brasil
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Card className="overflow-hidden rounded-[20px] border border-white/15 bg-white/10 shadow-2xl backdrop-blur-md">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name" className="text-white">
                      Nome
                    </Label>
                    <Input
                      id="contact-name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="rounded-xl bg-white/90 text-gray-900 placeholder:text-gray-500 focus-visible:bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-email" className="text-white">
                      Email
                    </Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="rounded-xl bg-white/90 text-gray-900 placeholder:text-gray-500 focus-visible:bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-message" className="text-white">
                      Mensagem
                    </Label>
                    <Textarea
                      id="contact-message"
                      placeholder="Como podemos ajudar?"
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      className="min-h-32 rounded-xl bg-white/90 text-gray-900 placeholder:text-gray-500 focus-visible:bg-white"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full rounded-full bg-white text-[#002D6B] shadow-xl shadow-black/10 hover:bg-gray-100"
                  >
                    Enviar Mensagem
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: CalendarClock,
    title: "Programação Diária de Consumo",
    description:
      "Planeje e registre a programação de consumo de gás natural diariamente, garantindo conformidade com os contratos e evitando penalidades.",
  },
  {
    icon: FileText,
    title: "Gestão de Contratos",
    description:
      "Acompanhe todos os contratos de fornecimento de gás com alertas de vencimento, limites contratuais e histórico de consumo.",
  },
  {
    icon: FileSpreadsheet,
    title: "Relatórios Petrobras",
    description:
      "Gere relatórios no formato exigido pela Petrobras automaticamente, prontos para envio com dados consolidados e validados.",
  },
  {
    icon: Bell,
    title: "Alertas Automáticos",
    description:
      "Receba notificações sobre desvios de consumo, vencimentos contratuais e limites operacionais antes que se tornem problemas.",
  },
  {
    icon: TrendingUp,
    title: "Análise de Desvios",
    description:
      "Compare consumo programado vs. realizado com visualizações claras, identificando tendências e oportunidades de otimização.",
  },
  {
    icon: Shield,
    title: "Controle de Acesso",
    description:
      "Gerencie permissões por unidade e função, garantindo que cada usuário acesse apenas os dados relevantes à sua operação.",
  },
];

const steps = [
  {
    number: "01",
    title: "Configure",
    description:
      "Cadastre suas unidades consumidoras, contratos e parâmetros operacionais na plataforma.",
  },
  {
    number: "02",
    title: "Programe",
    description:
      "Registre a programação diária de consumo de gás de cada unidade de forma simples e rápida.",
  },
  {
    number: "03",
    title: "Acompanhe",
    description:
      "Monitore em tempo real o consumo vs. programado com dashboards intuitivos e alertas automáticos.",
  },
  {
    number: "04",
    title: "Gere Relatórios",
    description:
      "Exporte relatórios prontos para a Petrobras e para gestão interna com um clique.",
  },
];

const benefits = [
  {
    icon: Shield,
    title: "Evite Penalidades",
    description:
      "Reduza multas e penalidades contratuais com monitoramento contínuo e alertas antecipados sobre desvios de consumo",
  },
  {
    icon: Zap,
    title: "Ganhe Eficiência",
    description:
      "Automatize processos manuais de programação e relatórios, liberando sua equipe para tarefas estratégicas",
  },
  {
    icon: TrendingUp,
    title: "Decisões Inteligentes",
    description:
      "Tome decisões baseadas em dados com análises de tendência, histórico de consumo e projeções de demanda",
  },
];

function RouteComponent() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#001845]/95 backdrop-blur-md">
        <div className="container mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <a href="/product" className="flex items-center">
            <img
              src="/logo white gas.jpg"
              alt="Programa GAS"
              width={180}
              height={60}
              className="h-10 w-auto"
            />
          </a>
          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#funcionalidades"
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              Funcionalidades
            </a>
            <a
              href="#como-funciona"
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              Como Funciona
            </a>
            <a
              href="#beneficios"
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              Benefícios
            </a>
            <a
              href="#contato"
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              Contato
            </a>
          </nav>
          <Link to="/auth/login">
            <Button
              variant="outline"
              className="rounded-full border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
            >
              Entrar
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0047AB] via-[#003080] to-[#001845]">
        {/* Animated gradient blobs */}
        <div className="pointer-events-none absolute top-20 right-10 h-[500px] w-[500px] animate-pulse rounded-full bg-[#00BFFF]/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-20 left-10 h-[400px] w-[400px] animate-pulse rounded-full bg-[#0047AB]/20 blur-3xl [animation-delay:1s]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-white/5 blur-3xl [animation-delay:2s]" />

        <div className="relative container mx-auto max-w-6xl px-4 py-28 md:py-36">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm">
              <Flame className="h-4 w-4 text-[#00BFFF]" />
              Gestão Inteligente de Gás Natural
            </div>

            <div className="mb-12 flex justify-center">
              <SparklesComponent
                className="relative inline-block"
                particleColor="#00BFFF"
                particleDensity={320}
                speed={1.2}
                particleSize={2.5}
              >
                <img
                  src="/logo white gas.jpg"
                  alt="Programa GAS"
                  width={400}
                  height={120}
                  className="h-auto w-full max-w-md drop-shadow-2xl"
                />
              </SparklesComponent>
            </div>

            <h1 className="mb-8 text-4xl leading-tight font-extrabold tracking-tight text-balance text-white md:text-5xl lg:text-6xl">
              Controle Total do Consumo de Gás da Sua Indústria
            </h1>

            <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-pretty text-white/75 md:text-xl">
              Plataforma completa para programação, monitoramento e gestão de
              consumo de gás natural industrial. Evite penalidades, otimize
              contratos e gere relatórios automaticamente.
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link to="/auth/register">
                <Button
                  size="lg"
                  className="h-14 w-full rounded-full bg-white px-10 text-base font-bold text-[#002D6B] shadow-xl shadow-black/20 transition-all hover:bg-gray-100 hover:shadow-2xl hover:shadow-[#00BFFF]/20 sm:w-auto"
                >
                  Começar Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#contato">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 w-full rounded-full border-2 border-white/30 bg-white/10 px-10 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/20 sm:w-auto"
                >
                  Agendar Demonstração
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Bold wave separator */}
        <div className="absolute right-0 bottom-0 left-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="#001845"
            />
          </svg>
        </div>
      </section>

      {/* Stats Section — Dark Band */}
      <section className="bg-[#001845] py-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            {[
              { value: "+150", label: "Unidades Monitoradas" },
              { value: "24/7", label: "Monitoramento" },
              { value: "99.5%", label: "Precisão" },
              { value: "-40%", label: "Penalidades" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm md:p-8"
              >
                <div className="mb-3 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-white/60 md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="bg-white py-28">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-20 text-center">
            <h2 className="mb-6 text-4xl font-extrabold tracking-tight text-gray-900 md:text-6xl">
              Funcionalidades Completas
            </h2>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-500 md:text-xl">
              Tudo que você precisa para uma gestão eficiente de gás natural em
              uma única plataforma
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-lg shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 hover:border-[#0047AB]/20 hover:shadow-xl hover:shadow-[#0047AB]/10"
              >
                {/* Gradient accent top border */}
                <div className="h-1 bg-gradient-to-r from-[#0047AB] to-[#00BFFF]" />
                <CardContent className="p-8">
                  <div className="mb-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0047AB] to-[#003080] text-white shadow-lg shadow-[#0047AB]/25 transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-[#0047AB]/30">
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="leading-relaxed text-gray-500">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="como-funciona"
        className="bg-gradient-to-b from-[#f0f6ff] to-white py-28"
      >
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-20 text-center">
            <h2 className="mb-6 text-4xl font-extrabold tracking-tight text-gray-900 md:text-6xl">
              Como Funciona
            </h2>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-500 md:text-xl">
              Em 4 passos simples, transforme a gestão de gás da sua indústria
            </p>
          </div>

          <div className="relative grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Connecting line (desktop only) */}
            <div className="pointer-events-none absolute top-10 right-0 left-0 hidden h-0.5 lg:block">
              <div className="mx-auto h-full w-[75%] bg-gradient-to-r from-[#0047AB]/20 via-[#0047AB]/40 to-[#0047AB]/20" />
            </div>

            {steps.map((step, index) => (
              <div key={step.number} className="relative text-center">
                <div className="relative z-10 mb-8 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#0047AB] to-[#002D6B] text-2xl font-extrabold text-white shadow-xl shadow-[#0047AB]/30">
                  {step.number}
                  {/* Glow ring */}
                  <div className="absolute inset-0 rounded-full bg-[#0047AB]/20 blur-md" />
                </div>
                {/* Arrow connector (desktop, between steps) */}
                {index < steps.length - 1 && (
                  <div className="pointer-events-none absolute top-10 left-[60%] hidden -translate-y-1/2 text-[#0047AB]/30 lg:block">
                    <ChevronRight className="h-6 w-6" />
                  </div>
                )}
                <div className="rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
                  <h3 className="mb-3 text-xl font-bold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="leading-relaxed text-gray-500">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section — Full Blue Band */}
      <section
        id="beneficios"
        className="relative overflow-hidden bg-gradient-to-br from-[#0047AB] via-[#003080] to-[#001845] py-28"
      >
        {/* Background decorative elements */}
        <div className="pointer-events-none absolute top-0 right-0 h-96 w-96 animate-pulse rounded-full bg-[#00BFFF]/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 animate-pulse rounded-full bg-white/5 blur-3xl [animation-delay:1.5s]" />

        <div className="relative container mx-auto max-w-7xl px-4">
          <div className="mb-20 text-center">
            <h2 className="mb-6 text-4xl font-extrabold tracking-tight text-white md:text-6xl">
              Benefícios para Sua Operação
            </h2>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-white/70 md:text-xl">
              Resultados reais para a gestão de gás natural industrial
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="group rounded-[20px] border border-white/15 bg-white/10 p-10 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 hover:shadow-xl hover:shadow-black/10"
              >
                <div className="mb-8 inline-flex rounded-2xl bg-white/20 p-5 text-white shadow-lg shadow-black/10 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                  <benefit.icon className="h-12 w-12" />
                </div>
                <h3 className="mb-4 text-2xl font-bold text-white">
                  {benefit.title}
                </h3>
                <p className="leading-relaxed text-white/70">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-white py-28">
        {/* Background decorative blobs */}
        <div className="pointer-events-none absolute top-10 left-10 h-64 w-64 animate-pulse rounded-full bg-[#0047AB]/5 blur-3xl" />
        <div className="pointer-events-none absolute right-10 bottom-10 h-80 w-80 animate-pulse rounded-full bg-[#00BFFF]/5 blur-3xl [animation-delay:1s]" />

        <div className="relative container mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-8 text-4xl font-extrabold tracking-tight text-balance text-gray-900 md:text-6xl">
            Pronto para transformar a gestão de gás da sua indústria?
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-gray-500 md:text-xl">
            Comece agora e tenha controle total sobre o consumo de gás natural
            das suas unidades industriais.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/auth/register">
              <Button
                size="lg"
                className="h-14 w-full rounded-full bg-[#0047AB] px-10 text-base font-bold text-white shadow-xl shadow-[#0047AB]/30 transition-all hover:bg-[#0055CC] hover:shadow-2xl hover:shadow-[#0047AB]/40 sm:w-auto"
              >
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#contato">
              <Button
                size="lg"
                variant="outline"
                className="h-14 w-full rounded-full border-2 border-[#0047AB] bg-transparent px-10 text-base font-semibold text-[#0047AB] hover:bg-[#0047AB]/5 sm:w-auto"
              >
                Agendar Demonstração
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <ContactSection />

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <img
                src="/logo blue gas.jpg"
                alt="Programa GAS Logo"
                width={120}
                height={36}
                className="h-9 w-auto"
              />
              <span className="text-sm text-gray-500">
                © 2025 Programa GAS. Todos os direitos reservados.
              </span>
            </div>
            <div className="flex gap-8 text-sm">
              <a
                href="#funcionalidades"
                className="font-medium text-gray-500 transition-colors hover:text-[#0047AB]"
              >
                Funcionalidades
              </a>
              <a
                href="#como-funciona"
                className="font-medium text-gray-500 transition-colors hover:text-[#0047AB]"
              >
                Como Funciona
              </a>
              <a
                href="#beneficios"
                className="font-medium text-gray-500 transition-colors hover:text-[#0047AB]"
              >
                Benefícios
              </a>
              <Link
                to="/auth/login"
                className="font-medium text-gray-500 transition-colors hover:text-[#0047AB]"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
