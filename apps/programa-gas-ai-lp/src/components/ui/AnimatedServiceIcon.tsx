"use client";

import { useCallback, useEffect, useRef } from "react";

import { ActivityIcon } from "~/components/ui/animated-icons/activity";
import { AudioLinesIcon } from "~/components/ui/animated-icons/audio-lines";
import { BlocksIcon } from "~/components/ui/animated-icons/blocks";
import { BrainIcon } from "~/components/ui/animated-icons/brain";
import { CloudCogIcon } from "~/components/ui/animated-icons/cloud-cog";
import { CompassIcon } from "~/components/ui/animated-icons/compass";
import { CpuIcon } from "~/components/ui/animated-icons/cpu";
import { FolderCodeIcon } from "~/components/ui/animated-icons/folder-code";
import { GitBranchIcon } from "~/components/ui/animated-icons/git-branch";
import { MenuIcon } from "~/components/ui/animated-icons/menu";
import { PenToolIcon } from "~/components/ui/animated-icons/pen-tool";
import { RocketIcon } from "~/components/ui/animated-icons/rocket";
import { TerminalIcon } from "~/components/ui/animated-icons/terminal";
import { XIcon } from "~/components/ui/animated-icons/x";
import { ZapIcon } from "~/components/ui/animated-icons/zap";

interface IconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

type AnimatedIconComponent = React.ForwardRefExoticComponent<
  { size?: number; className?: string } & React.RefAttributes<IconHandle>
>;

const iconMap: Record<string, AnimatedIconComponent> = {
  activity: ActivityIcon as AnimatedIconComponent,
  "audio-lines": AudioLinesIcon as AnimatedIconComponent,
  blocks: BlocksIcon as AnimatedIconComponent,
  brain: BrainIcon as AnimatedIconComponent,
  "cloud-cog": CloudCogIcon as AnimatedIconComponent,
  compass: CompassIcon as AnimatedIconComponent,
  cpu: CpuIcon as AnimatedIconComponent,
  "folder-code": FolderCodeIcon as AnimatedIconComponent,
  "git-branch": GitBranchIcon as AnimatedIconComponent,
  menu: MenuIcon as AnimatedIconComponent,
  "pen-tool": PenToolIcon as AnimatedIconComponent,
  rocket: RocketIcon as AnimatedIconComponent,
  terminal: TerminalIcon as AnimatedIconComponent,
  x: XIcon as AnimatedIconComponent,
  zap: ZapIcon as AnimatedIconComponent,
};

interface AnimatedServiceIconProps {
  name: string;
  size?: number;
  className?: string;
}

export default function AnimatedServiceIcon({
  name,
  size = 24,
  className,
}: AnimatedServiceIconProps) {
  const iconRef = useRef<IconHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startAnimation = useCallback(() => {
    iconRef.current?.startAnimation();
  }, []);

  const stopAnimation = useCallback(() => {
    iconRef.current?.stopAnimation();
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            startAnimation();
          }
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [startAnimation]);

  const IconComponent = iconMap[name];

  if (!IconComponent) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={startAnimation}
      onMouseLeave={stopAnimation}
    >
      <IconComponent ref={iconRef} size={size} className={className} />
    </div>
  );
}
