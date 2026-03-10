import { useState } from "react";

import { MenuIcon } from "~/components/ui/animated-icons/menu";
import { XIcon } from "~/components/ui/animated-icons/x";

interface MobileMenuProps {
  navLinks: { label: string; href: string }[];
}

export default function MobileMenu({ navLinks }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex size-10 items-center justify-center rounded-lg transition-colors"
        style={{ color: "rgba(255,255,255,0.7)" }}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
      >
        {open ? <XIcon size={20} /> : <MenuIcon size={20} />}
      </button>

      {open && (
        <div
          className="absolute top-full right-0 left-0 border-b backdrop-blur-xl"
          style={{ backgroundColor: "rgba(13, 27, 42, 0.98)", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div className="mx-auto max-w-7xl space-y-1 px-6 py-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-4 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <a
                href="#contato"
                className="block rounded-lg px-3 py-2.5 text-center text-sm font-semibold text-white transition-all"
                style={{ backgroundColor: "#1A56DB" }}
              >
                Agendar Demo
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
