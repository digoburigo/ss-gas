import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	BookOpen,
	CheckCircle2,
	Clock,
	ListChecks,
	MessageSquare,
	Sparkles,
	TrendingUp,
	Users,
} from "lucide-react";

import { Sparkles as SparklesComponent } from "~/components/sparkles";

export const Route = createFileRoute("/land")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="min-h-screen bg-white">
			{/* Header */}
			<header className="sticky top-0 z-50 border-b border-gray-200 bg-white bg-white/90 backdrop-blur-sm">
				<div className="container mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
					<Link to="/" className="flex items-center">
						<img
							src="/images/altos-logo-horizontal.png"
							alt="Altos AI"
							width={180}
							height={60}
							className="h-10 w-auto"
						/>
					</Link>
					<nav className="hidden items-center gap-8 md:flex">
						<a
							href="#funcionalidades"
							className="text-sm font-medium text-gray-600 transition-colors hover:text-[#5B9AAD]"
						>
							Funcionalidades
						</a>
						<a
							href="#beneficios"
							className="text-sm font-medium text-gray-600 transition-colors hover:text-[#5B9AAD]"
						>
							Benefícios
						</a>
						<a
							href="#demo"
							className="text-sm font-medium text-gray-600 transition-colors hover:text-[#5B9AAD]"
						>
							Veja em Ação
						</a>
					</nav>
					<Link to="/auth/login">
						<Button
							variant="outline"
							className="border-[#5B9AAD] bg-transparent text-[#5B9AAD] hover:bg-[#5B9AAD]/10"
						>
							Entrar
						</Button>
					</Link>
				</div>
			</header>

			<section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50/30 to-white">
				<div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
				<div className="absolute top-20 right-10 h-96 w-96 rounded-full bg-[#5B9AAD]/10 blur-3xl" />
				<div className="absolute bottom-10 left-10 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />

				<div className="relative container mx-auto max-w-6xl px-4 py-24 md:py-32">
					<div className="mx-auto max-w-4xl text-center">
						<div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-[#1E3A4C]">
							<Sparkles className="h-4 w-4 text-[#5B9AAD]" />
							Integração Inteligente com IA
						</div>

						<div className="mb-10 flex justify-center">
							<SparklesComponent
								className="relative inline-block"
								particleColor="#5B9AAD"
								particleDensity={240}
								speed={1}
								particleSize={2}
							>
								<img
									src="/images/altos-logo-horizontal.png"
									alt="Altos AI"
									width={400}
									height={120}
									className="h-auto w-full max-w-sm"
								/>
							</SparklesComponent>
						</div>

						<h1 className="mb-6 text-3xl leading-tight font-bold text-balance text-gray-900 md:text-4xl lg:text-5xl">
							Transforme o Onboarding com Inteligência Artificial
						</h1>

						<p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-pretty text-gray-600 md:text-lg">
							Plataforma completa para acelerar e personalizar a integração de
							novos colaboradores, conectando-os à cultura e conhecimento da sua
							empresa.
						</p>

						<div className="flex flex-col justify-center gap-4 sm:flex-row">
							<Link to="/auth/register">
								<Button
									size="lg"
									className="h-12 w-full bg-[#5B9AAD] px-8 text-base font-semibold text-white shadow-lg shadow-[#5B9AAD]/25 hover:bg-[#4A8999] sm:w-auto"
								>
									Começar Gratuitamente
									<ArrowRight className="ml-2 h-5 w-5" />
								</Button>
							</Link>
							<Link to="/">
								<Button
									size="lg"
									variant="outline"
									className="h-12 w-full border-2 border-[#5B9AAD] bg-transparent px-8 text-base font-semibold text-[#5B9AAD] hover:bg-[#5B9AAD]/5 sm:w-auto"
								>
									Ver Demonstração
								</Button>
							</Link>
						</div>
					</div>
				</div>

				{/* Wave separator */}
				<div className="absolute right-0 bottom-0 left-0">
					<svg
						viewBox="0 0 1440 120"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="w-full"
					>
						<path
							d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
							fill="white"
						/>
					</svg>
				</div>
			</section>

			{/* Stats Section */}
			<section className="bg-white py-16">
				<div className="container mx-auto max-w-7xl px-4">
					<div className="grid grid-cols-2 gap-8 md:grid-cols-4">
						<div className="text-center">
							<div className="mb-2 text-4xl font-bold text-[#5B9AAD] md:text-5xl">
								50%
							</div>
							<div className="text-sm text-gray-600 md:text-base">
								Redução no tempo de integração
							</div>
						</div>
						<div className="text-center">
							<div className="mb-2 text-4xl font-bold text-[#5B9AAD] md:text-5xl">
								24/7
							</div>
							<div className="text-sm text-gray-600 md:text-base">
								Suporte com IA disponível
							</div>
						</div>
						<div className="text-center">
							<div className="mb-2 text-4xl font-bold text-[#5B9AAD] md:text-5xl">
								100%
							</div>
							<div className="text-sm text-gray-600 md:text-base">
								Personalizado por cargo
							</div>
						</div>
						<div className="text-center">
							<div className="mb-2 text-4xl font-bold text-[#5B9AAD] md:text-5xl">
								4x
							</div>
							<div className="text-sm text-gray-600 md:text-base">
								Mais engajamento
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* New Product Demo Section */}
			<section id="demo" className="bg-white py-24">
				<div className="container mx-auto max-w-7xl px-4">
					<div className="grid items-center gap-16 lg:grid-cols-2">
						{/* Left side - Feature descriptions */}
						<div className="space-y-8">
							<div>
								<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#5B9AAD]/20 bg-[#5B9AAD]/10 px-3 py-1 text-sm font-medium text-[#1E3A4C]">
									<Sparkles className="h-4 w-4 text-[#5B9AAD]" />
									Veja em Ação
								</div>
								<h2 className="mb-4 text-3xl font-bold text-balance text-gray-900 md:text-4xl">
									Experiência Completa de Onboarding
								</h2>
								<p className="text-lg leading-relaxed text-gray-600">
									Descubra como nossa plataforma simplifica cada etapa da
									integração, desde o primeiro login até a conclusão total do
									processo.
								</p>
							</div>

							<div className="space-y-6">
								<div className="flex gap-4">
									<div className="flex-shrink-0">
										<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5B9AAD]/10">
											<ListChecks className="h-6 w-6 text-[#5B9AAD]" />
										</div>
									</div>
									<div>
										<h3 className="mb-2 text-xl font-semibold text-gray-900">
											Tarefas Guiadas
										</h3>
										<p className="leading-relaxed text-gray-600">
											Checklist inteligente que acompanha o progresso e sugere
											próximos passos automaticamente, garantindo que nada seja
											esquecido.
										</p>
									</div>
								</div>

								<div className="flex gap-4">
									<div className="flex-shrink-0">
										<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5B9AAD]/10">
											<MessageSquare className="h-6 w-6 text-[#5B9AAD]" />
										</div>
									</div>
									<div>
										<h3 className="mb-2 text-xl font-semibold text-gray-900">
											Assistente Inteligente
										</h3>
										<p className="leading-relaxed text-gray-600">
											Chat com IA que entende o contexto e oferece respostas
											personalizadas sobre processos, cultura e políticas da
											empresa.
										</p>
									</div>
								</div>

								<div className="flex gap-4">
									<div className="flex-shrink-0">
										<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5B9AAD]/10">
											<BookOpen className="h-6 w-6 text-[#5B9AAD]" />
										</div>
									</div>
									<div>
										<h3 className="mb-2 text-xl font-semibold text-gray-900">
											Base de Conhecimento
										</h3>
										<p className="leading-relaxed text-gray-600">
											Acesso instantâneo a toda documentação da empresa através
											de chat inteligente treinado com suas informações
											corporativas.
										</p>
									</div>
								</div>

								<div className="flex gap-4">
									<div className="flex-shrink-0">
										<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5B9AAD]/10">
											<Users className="h-6 w-6 text-[#5B9AAD]" />
										</div>
									</div>
									<div>
										<h3 className="mb-2 text-xl font-semibold text-gray-900">
											Conexão com o Time
										</h3>
										<p className="leading-relaxed text-gray-600">
											Chat em grupo para integração social, permitindo que novos
											funcionários conheçam colegas e façam perguntas em um
											ambiente colaborativo.
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Right side - Notebook mockup with video */}
						<div className="relative">
							{/* Decorative elements */}
							<div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-[#5B9AAD]/10 blur-3xl" />
							<div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />

							{/* Notebook mockup */}
							<div className="relative z-10">
								<div className="relative rounded-2xl bg-gray-800 p-3 shadow-2xl">
									{/* Notebook top bar */}
									<div className="mb-2 flex items-center gap-2 rounded-t-lg bg-gray-700 px-4 py-2">
										<div className="flex gap-1.5">
											<div className="h-3 w-3 rounded-full bg-red-500" />
											<div className="h-3 w-3 rounded-full bg-yellow-500" />
											<div className="h-3 w-3 rounded-full bg-green-500" />
										</div>
										<div className="flex-1 text-center">
											<div className="inline-flex items-center gap-2 rounded bg-gray-600 px-3 py-1 text-xs font-medium text-gray-300">
												<Sparkles className="h-3 w-3" />
												Altos AI Platform
											</div>
										</div>
									</div>

									<div className="relative aspect-video overflow-hidden rounded-lg bg-white">
										<img
											src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-11-17%20at%2018.51.46-dkaYRCr8t0n6ZMuQzLYVf4a52Cz8DW.jpeg"
											alt="Farben Onboarding Platform Demo"
											className="h-full w-full bg-gray-50 object-contain"
										/>
									</div>

									{/* Notebook bottom */}
									<div className="mt-2 h-1 rounded-b-lg bg-gray-700" />
								</div>

								{/* Keyboard base */}
								<div
									className="relative mx-auto h-3 rounded-b-xl bg-gray-300"
									style={{ width: "110%" }}
								/>
								<div
									className="relative mx-auto h-1 rounded-b-2xl bg-gray-400 shadow-lg"
									style={{ width: "120%" }}
								/>
							</div>

							{/* Floating badge */}
							<div className="absolute -bottom-6 -left-6 z-20 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
								<div className="flex items-center gap-3">
									<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#5B9AAD] to-[#1E3A4C]">
										<CheckCircle2 className="h-6 w-6 text-white" />
									</div>
									<div>
										<div className="text-2xl font-bold text-gray-900">95%</div>
										<div className="text-xs text-gray-600">
											Taxa de Conclusão
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="funcionalidades" className="bg-gray-50 py-20">
				<div className="container mx-auto max-w-7xl px-4">
					<div className="mb-16 text-center">
						<h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-5xl">
							Funcionalidades que fazem a diferença
						</h2>
						<p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600 md:text-xl">
							Tudo que você precisa para uma integração eficiente, engajadora e
							moderna
						</p>
					</div>

					<div className="mb-12 grid gap-8 md:grid-cols-2">
						{/* Feature 1 */}
						<Card className="group overflow-hidden border-0 bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
							<CardContent className="p-8">
								<div className="flex items-start gap-6">
									<div className="flex-shrink-0 rounded-2xl bg-[#5B9AAD]/10 p-4 text-[#5B9AAD] transition-colors duration-300 group-hover:bg-[#5B9AAD] group-hover:text-white">
										<ListChecks className="h-8 w-8" />
									</div>
									<div className="flex-1">
										<h3 className="mb-3 text-2xl font-bold text-gray-900">
											Primeiros Passos
										</h3>
										<p className="mb-6 leading-relaxed text-gray-600">
											Checklist interativo que guia novos funcionários através
											de todas as etapas essenciais do onboarding, com
											acompanhamento de progresso em tempo real.
										</p>
										<ul className="space-y-3">
											<li className="flex items-start gap-3 text-gray-700">
												<CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#5B9AAD]" />
												<span>Tarefas organizadas por prioridade</span>
											</li>
											<li className="flex items-start gap-3 text-gray-700">
												<CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#5B9AAD]" />
												<span>Progresso salvo automaticamente</span>
											</li>
											<li className="flex items-start gap-3 text-gray-700">
												<CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#5B9AAD]" />
												<span>Personalizado por tipo de funcionário</span>
											</li>
										</ul>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Feature 2 */}
						<Card className="group overflow-hidden border-0 bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
							<CardContent className="p-8">
								<div className="flex items-start gap-6">
									<div className="flex-shrink-0 rounded-2xl bg-[#5B9AAD]/10 p-4 text-[#5B9AAD] transition-colors duration-300 group-hover:bg-[#5B9AAD] group-hover:text-white">
										<MessageSquare className="h-8 w-8" />
									</div>
									<div className="flex-1">
										<h3 className="mb-3 text-2xl font-bold text-gray-900">
											Chat de Integração com IA
										</h3>
										<p className="mb-6 leading-relaxed text-gray-600">
											Assistente virtual inteligente que responde dúvidas e
											orienta novos colaboradores durante todo o processo,
											adaptando-se ao perfil de cada um.
										</p>
										<ul className="space-y-3">
											<li className="flex items-start gap-3 text-gray-700">
												<CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#5B9AAD]" />
												<span>Respostas contextualizadas por cargo</span>
											</li>
											<li className="flex items-start gap-3 text-gray-700">
												<CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#5B9AAD]" />
												<span>Histórico de conversas salvo</span>
											</li>
											<li className="flex items-start gap-3 text-gray-700">
												<CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#5B9AAD]" />
												<span>Disponível 24 horas por dia</span>
											</li>
										</ul>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Feature 3 */}
						<Card className="group overflow-hidden border-0 bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
							<CardContent className="p-8">
								<div className="flex items-start gap-6">
									<div className="flex-shrink-0 rounded-2xl bg-[#5B9AAD]/10 p-4 text-[#5B9AAD] transition-colors duration-300 group-hover:bg-[#5B9AAD] group-hover:text-white">
										<BookOpen className="h-8 w-8" />
									</div>
									<div className="flex-1">
										<h3 className="mb-3 text-2xl font-bold text-gray-900">
											Base de Conhecimento Inteligente
										</h3>
										<p className="mb-6 leading-relaxed text-gray-600">
											Chat com IA treinada sobre a empresa, políticas, processos
											e cultura. Respostas instantâneas sobre qualquer aspecto
											da organização.
										</p>
										<ul className="space-y-3">
											<li className="flex items-start gap-3 text-gray-700">
												<CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#5B9AAD]" />
												<span>Acesso rápido a informações</span>
											</li>
											<li className="flex items-start gap-3 text-gray-700">
												<CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#5B9AAD]" />
												<span>Baseado em documentos oficiais</span>
											</li>
											<li className="flex items-start gap-3 text-gray-700">
												<CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#5B9AAD]" />
												<span>Sempre atualizado</span>
											</li>
										</ul>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Feature 4 */}
						<Card className="group overflow-hidden border-0 bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
							<CardContent className="p-8">
								<div className="flex items-start gap-6">
									<div className="flex-shrink-0 rounded-2xl bg-[#5B9AAD]/10 p-4 text-[#5B9AAD] transition-colors duration-300 group-hover:bg-[#5B9AAD] group-hover:text-white">
										<Users className="h-8 w-8" />
									</div>
									<div className="flex-1">
										<h3 className="mb-3 text-2xl font-bold text-gray-900">
											Chat em Grupo
										</h3>
										<p className="mb-6 leading-relaxed text-gray-600">
											Espaço colaborativo para novos funcionários se conectarem
											entre si e com a equipe, promovendo integração social
											desde o primeiro dia.
										</p>
										<ul className="space-y-3">
											<li className="flex items-start gap-3 text-gray-700">
												<CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#5B9AAD]" />
												<span>Comunicação em tempo real</span>
											</li>
											<li className="flex items-start gap-3 text-gray-700">
												<CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#5B9AAD]" />
												<span>Fortalece cultura organizacional</span>
											</li>
											<li className="flex items-start gap-3 text-gray-700">
												<CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#5B9AAD]" />
												<span>Reduz isolamento de novos membros</span>
											</li>
										</ul>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Benefits Section */}
			<section id="beneficios" className="bg-white py-20">
				<div className="container mx-auto max-w-7xl px-4">
					<div className="mb-16 text-center">
						<h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-5xl">
							Por que escolher nossa plataforma?
						</h2>
						<p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600 md:text-xl">
							Benefícios comprovados que transformam a experiência de integração
						</p>
					</div>

					<div className="grid gap-10 md:grid-cols-3">
						<div className="group text-center">
							<div className="mb-6 inline-flex rounded-3xl bg-gradient-to-br from-[#5B9AAD] to-[#1E3A4C] p-6 text-white shadow-lg transition-shadow duration-300 group-hover:shadow-xl">
								<Clock className="h-12 w-12" />
							</div>
							<h3 className="mb-3 text-2xl font-bold text-gray-900">
								Onboarding Mais Rápido
							</h3>
							<p className="leading-relaxed text-gray-600">
								Reduza o tempo de integração em até 50% com processos
								automatizados e informações centralizadas em um só lugar
							</p>
						</div>

						<div className="group text-center">
							<div className="mb-6 inline-flex rounded-3xl bg-gradient-to-br from-[#5B9AAD] to-[#1E3A4C] p-6 text-white shadow-lg transition-shadow duration-300 group-hover:shadow-xl">
								<Sparkles className="h-12 w-12" />
							</div>
							<h3 className="mb-3 text-2xl font-bold text-gray-900">
								Experiência Personalizada
							</h3>
							<p className="leading-relaxed text-gray-600">
								IA adapta o conteúdo e orientações baseado no cargo e perfil de
								cada novo funcionário automaticamente
							</p>
						</div>

						<div className="group text-center">
							<div className="mb-6 inline-flex rounded-3xl bg-gradient-to-br from-[#5B9AAD] to-[#1E3A4C] p-6 text-white shadow-lg transition-shadow duration-300 group-hover:shadow-xl">
								<TrendingUp className="h-12 w-12" />
							</div>
							<h3 className="mb-3 text-2xl font-bold text-gray-900">
								Maior Engajamento
							</h3>
							<p className="leading-relaxed text-gray-600">
								Aumente em 4x o engajamento dos novos colaboradores com uma
								experiência moderna e interativa
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="relative overflow-hidden bg-gradient-to-br from-[#5B9AAD] via-[#3A7A8A] to-[#1E3A4C] py-20 text-white">
				<div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
				<div className="relative container mx-auto max-w-5xl px-4">
					<div className="text-center">
						<h2 className="mb-6 text-3xl font-bold text-balance md:text-5xl">
							Pronto para revolucionar seu onboarding?
						</h2>
						<p className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed opacity-90 md:text-xl">
							Junte-se às empresas que já estão oferecendo uma experiência de
							integração excepcional para seus novos colaboradores com
							tecnologia de ponta.
						</p>
						<div className="flex flex-col justify-center gap-4 sm:flex-row">
							<Link to="/auth/register">
								<Button
									size="lg"
									className="h-12 w-full bg-white px-8 text-base font-semibold text-[#1E3A4C] shadow-xl hover:bg-gray-100 sm:w-auto"
								>
									Criar Conta Gratuita
									<ArrowRight className="ml-2 h-5 w-5" />
								</Button>
							</Link>
							<Link to="/">
								<Button
									size="lg"
									variant="outline"
									className="h-12 w-full border-2 border-white bg-transparent px-8 text-base font-semibold text-white hover:bg-white/10 sm:w-auto"
								>
									Explorar Plataforma
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-gray-200 bg-white">
				<div className="container mx-auto max-w-7xl px-4 py-12">
					<div className="flex flex-col items-center justify-between gap-6 md:flex-row">
						<div className="flex items-center gap-3">
							<img
								src="/images/altos-logo-horizontal.png"
								alt="Altos AI Logo"
								width={120}
								height={36}
								className="h-9 w-auto"
							/>
							<span className="text-sm text-gray-600">
								© 2025 Altos AI. Todos os direitos reservados.
							</span>
						</div>
						<div className="flex gap-8 text-sm">
							<Link
								to="/"
								className="font-medium text-gray-600 transition-colors hover:text-[#5B9AAD]"
							>
								Plataforma
							</Link>
							<Link
								to="/auth/login"
								className="font-medium text-gray-600 transition-colors hover:text-[#5B9AAD]"
							>
								Login
							</Link>
							<a
								href="#funcionalidades"
								className="font-medium text-gray-600 transition-colors hover:text-[#5B9AAD]"
							>
								Funcionalidades
							</a>
							<a
								href="#beneficios"
								className="font-medium text-gray-600 transition-colors hover:text-[#5B9AAD]"
							>
								Benefícios
							</a>
							<a
								href="#demo"
								className="font-medium text-gray-600 transition-colors hover:text-[#5B9AAD]"
							>
								Veja em Ação
							</a>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
