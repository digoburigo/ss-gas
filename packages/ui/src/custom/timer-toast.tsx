import { Button } from "@acme/ui/button";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// import SolarCloseCircleBroken from "~icons/solar/close-circle-broken";

interface TimerToastProps {
	content: React.ReactNode;
	action?: { label: string; onClick: () => void };
	duration?: number;
	onDismiss?: () => void;
}

export function TimerToast({
	content,
	action,
	duration = 5000,
	onDismiss,
}: TimerToastProps) {
	// Percentage 0‒100 for visual bar
	const [progress, setProgress] = useState(0);

	/* ──────────────────────────────────
     refs to keep mutable values that SHOULD NOT
     re-trigger renders / effects
  ───────────────────────────────────── */
	const startRef = useRef(Date.now()); // moment counting started
	const hoverStartRef = useRef<number | null>(null);
	const isHoveringRef = useRef(false);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	/* ──────────────────────────────────
     Main ticking effect - runs ~60 fps,
     but ONLY reads refs & updates progress.
     Its dependency list is stable, so no
     infinite re-render loop.
  ───────────────────────────────────── */
	useEffect(() => {
		function tick() {
			if (!isHoveringRef.current) {
				const elapsed = Date.now() - startRef.current;
				const percent = Math.min((elapsed / duration) * 100, 100);
				setProgress(percent);

				if (percent >= 100) {
					if (intervalRef.current) {
						clearInterval(intervalRef.current);
					}
					// tiny delay so bar visibly reaches 100 %
					const timeout = setTimeout(() => {
						onDismiss?.();
						clearTimeout(timeout);
					}, 80);
				}
			}
		}

		intervalRef.current = setInterval(tick, 16); // ≈60 fps
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [duration, onDismiss]);

	/* ──────────────────────────────────
     Hover handlers - pause & resume
  ───────────────────────────────────── */
	const handleMouseEnter = () => {
		if (isHoveringRef.current) {
			return;
		}
		isHoveringRef.current = true;
		hoverStartRef.current = Date.now();
	};

	const handleMouseLeave = () => {
		if (!isHoveringRef.current) {
			return;
		}
		isHoveringRef.current = false;
		// shift start time forward by length of pause
		if (hoverStartRef.current) {
			const pauseDuration = Date.now() - hoverStartRef.current;
			startRef.current += pauseDuration;
		}
		hoverStartRef.current = null;
	};

	return (
		<div
			className="group bg-background pointer-events-auto relative max-h-[200px] min-h-[48px] w-[356px] overflow-hidden rounded-md border shadow-lg transition-shadow hover:shadow-xl"
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{/* content */}
			<div className="relative flex items-start justify-between p-3 pr-10">
				<div className="text-foreground min-w-0 flex-1 text-sm break-words">
					{content}
					{action && (
						<div className="mt-2">
							<Button
								className="h-7 bg-transparent px-2 text-xs"
								onClick={() => {
									action.onClick();
									onDismiss?.();
								}}
								size="sm"
								variant="outline"
							>
								{action.label}
							</Button>
						</div>
					)}
				</div>

				<Button
					className="text-foreground/50 hover:text-foreground absolute top-2 right-2 size-5 flex-shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100"
					onClick={onDismiss}
					size="sm"
					variant="ghost"
				>
					{/* <SolarCloseCircleBroken className="size-5" /> */}
					<span>x</span>
				</Button>
			</div>

			{/* progress bar */}
			<div className="bg-muted/30 absolute inset-x-0 bottom-0 h-0.5">
				<div
					className={`bg-primary h-full transition-[width] duration-75 ease-linear ${
						isHoveringRef.current ? "opacity-50" : ""
					}`}
					style={{ width: `${progress}%` }}
				/>
			</div>
		</div>
	);
}

/* helper to invoke the toast */
export function showTimerToast(opts: Omit<TimerToastProps, "onDismiss">) {
	return toast.custom(
		(t) => <TimerToast {...opts} onDismiss={() => toast.dismiss(t)} />,
		{
			duration: Number.POSITIVE_INFINITY,
		},
	);
}
