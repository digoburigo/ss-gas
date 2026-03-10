import type { ReactNode } from "react";

import { GlowingEffect } from "~/components/ui/glowing-effect";

interface ServiceCardGlowProps {
  children: ReactNode;
}

export function ServiceCardGlow({ children }: ServiceCardGlowProps) {
  return (
    <div className="relative h-full rounded-2xl border border-black/[0.06] p-2">
      <GlowingEffect
        spread={40}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        borderWidth={2}
      />
      {children}
    </div>
  );
}
