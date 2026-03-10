"use client";

import { ArrowRight } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";

import AnimatedCounter from "~/components/AnimatedCounter";
import { BackgroundGradientAnimation } from "~/components/ui/background-gradient-animation";

const trustStats = [
  { label: "projetos entregues", suffix: "+", value: 50 },
  { label: "taxa de satisfação", suffix: "%", value: 98 },
  { label: "mais rápido", suffix: "x", value: 5 },
];

// Staggered fade-up variants
const fadeUp = (delay = 0) => ({
  animate: { opacity: 1, y: 0 },
  initial: { opacity: 0, y: 24 },
  transition: { delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
});

export function HeroSection() {
  // Mouse parallax motion values
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const springX = useSpring(rawX, { damping: 20, stiffness: 60 });
  const springY = useSpring(rawY, { damping: 20, stiffness: 60 });

  // Orb moves with mouse (~20px), text moves opposite (~6px)
  const orbX = useTransform(springX, (v) => v * 20);
  const orbY = useTransform(springY, (v) => v * 20);
  const textX = useTransform(springX, (v) => v * -6);
  const textY = useTransform(springY, (v) => v * -6);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      rawX.set(nx);
      rawY.set(ny);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [rawX, rawY]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FAFCFD]">
      {/* Orb — desktop right side, expanded to bleed behind text */}
      <motion.div
        className="absolute right-0 top-0 hidden h-[calc(100%-80px)] lg:block"
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 30%)",
          maskImage: "linear-gradient(to right, transparent 0%, black 30%)",
          width: "60vw",
          x: orbX,
          y: orbY,
        }}
      >
        <BackgroundGradientAnimation
          containerClassName="h-full w-full"
          gradientBackgroundStart="rgb(240, 248, 252)"
          gradientBackgroundEnd="rgb(224, 242, 248)"
          firstColor="91, 154, 173"
          secondColor="123, 184, 200"
          thirdColor="30, 58, 76"
          fourthColor="91, 154, 173"
          fifthColor="200, 223, 230"
          pointerColor="91, 154, 173"
          blendingValue="soft-light"
          gradientOpacity={0.65}
          softBlend={true}
          interactive={false}
        />
      </motion.div>

      {/* Orb — mobile, subtle behind text */}
      <div className="absolute inset-0 opacity-25 lg:hidden">
        <BackgroundGradientAnimation
          containerClassName="h-full w-full"
          gradientBackgroundStart="rgb(240, 248, 252)"
          gradientBackgroundEnd="rgb(224, 242, 248)"
          firstColor="91, 154, 173"
          secondColor="123, 184, 200"
          thirdColor="30, 58, 76"
          fourthColor="91, 154, 173"
          fifthColor="200, 223, 230"
          pointerColor="91, 154, 173"
          blendingValue="soft-light"
          gradientOpacity={0.65}
          softBlend={true}
          interactive={false}
        />
      </div>

      {/* Floating bridge shapes — desktop only, in the gap zone (~44-52% horizontal) */}
      <div
        className="pointer-events-none absolute top-0 hidden h-[calc(100%-80px)] lg:block"
        aria-hidden="true"
        style={{ left: "44%", width: "10%", zIndex: 5 }}
      >
        {/* Thin circle outline */}
        <div
          className="absolute"
          style={{
            animation: "var(--animate-float)",
            border: "1.5px solid #5B9AAD",
            borderRadius: "50%",
            height: 48,
            left: "30%",
            opacity: 0.18,
            top: "22%",
            width: 48,
          }}
        />
        {/* Smaller solid dot */}
        <div
          className="absolute"
          style={{
            animation: "var(--animate-float-delayed)",
            background: "#5B9AAD",
            borderRadius: "50%",
            height: 8,
            left: "60%",
            opacity: 0.22,
            top: "55%",
            width: 8,
          }}
        />
        {/* Larger thin ring */}
        <div
          className="absolute"
          style={{
            animation: "var(--animate-float-slow)",
            border: "1px solid #5B9AAD",
            borderRadius: "50%",
            height: 28,
            left: "10%",
            opacity: 0.14,
            top: "68%",
            width: 28,
          }}
        />
      </div>

      {/* Main content — left aligned, with subtle parallax on desktop */}
      <motion.div
        className="relative z-10 flex min-h-[calc(100vh-80px)] flex-col px-6 pt-28 pb-24 lg:max-w-[760px] lg:px-20"
        style={{
          x: textX,
          y: textY,
        }}
      >
        <div className="my-auto">
          {/* Section label */}
          <motion.div className="mb-8 flex items-center gap-3" {...fadeUp(0)}>
            <div className="h-px w-8 bg-[#5B9AAD]" />
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-[#5B9AAD]">
              SOFTWARE SOB MEDIDA · IA APLICADA
            </span>
          </motion.div>

          {/* Headline */}
          <h1
            className="font-extrabold tracking-[-0.04em]"
            style={{ fontFamily: "var(--font-jakarta)", lineHeight: 1.05 }}
          >
            <motion.span
              className="block"
              style={{
                color: "#0F2B3C",
                fontSize: "clamp(2.4rem, 5vw, 4.75rem)",
              }}
              {...fadeUp(0.15)}
            >
              Software que escala.
            </motion.span>
            <motion.span
              className="block"
              style={{
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                background:
                  "linear-gradient(135deg, #0a1e3c 0%, #14456a 40%, #1e6fa0 70%, #0a2d50 100%)",
                backgroundClip: "text",
                fontSize: "clamp(2.4rem, 5vw, 4.75rem)",
              }}
              {...fadeUp(0.28)}
            >
              Custo que faz sentido.
            </motion.span>
          </h1>

          {/* Subtitle */}
          <motion.p
            className="mt-6 leading-relaxed text-[#4A6B78]"
            style={{
              fontSize: "clamp(1rem, 1.4vw, 1.125rem)",
              maxWidth: "480px",
            }}
            {...fadeUp(0.38)}
          >
            Desenvolvemos Softwares com arquitetura validada na prática para
            entregar em semanas o que antes levaria meses. Custo previsível.
            Código que dura.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="mt-10 flex flex-col gap-4 sm:flex-row"
            {...fadeUp(0.5)}
          >
            <a
              href="#contato"
              className="inline-flex items-center rounded-md px-8 py-3 text-base font-semibold text-white transition-all active:scale-[0.98]"
              style={{
                animation: "gradient-shift 6s ease infinite",
                background:
                  "linear-gradient(135deg, #0a1e3c, #14456a, #1e6fa0, #0a2d50)",
                backgroundSize: "200% 200%",
              }}
            >
              Solicitar Orçamento
            </a>
            <a
              href="#portfolio"
              className="group inline-flex h-12 items-center justify-center gap-1.5 px-2 text-base font-medium text-[#4A6B78] transition-colors hover:text-[#0F2B3C]"
            >
              Ver portfólio
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </a>
          </motion.div>
        </div>
      </motion.div>

      {/* Trust Bar */}
      <div
        className="absolute bottom-0 left-0 right-0 border-t bg-[#FAFCFD]/90 backdrop-blur-sm"
        style={{ borderColor: "#C8DFE6", height: "80px" }}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center gap-10 px-6 lg:gap-16 lg:px-20">
          {trustStats.map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-2">
              <span
                className="font-extrabold text-[#0F2B3C]"
                style={{
                  fontFamily: "var(--font-jakarta)",
                  fontSize: "1.5rem",
                  lineHeight: 1,
                }}
              >
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </span>
              <span className="text-sm text-[#4A6B78]">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
