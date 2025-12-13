import { cn } from "@acme/ui";
import { Toggle as TogglePrimitive } from "@base-ui-components/react/toggle";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

const toggleVariants = cva(
	"hover:bg-accent/50 focus-visible:ring-ring focus-visible:ring-offset-background data-pressed:bg-accent data-pressed:text-accent-foreground dark:data-pressed:bg-input/80 dark:hover:bg-accent relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border text-sm font-medium whitespace-nowrap transition-shadow outline-none select-none before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-64 data-pressed:transition-none pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default: "border-transparent",
				outline:
					"border-border dark:bg-input/32 dark:hover:bg-input/64 bg-clip-padding shadow-xs not-disabled:not-active:not-data-pressed:before:shadow-[0_1px_--theme(--color-black/4%)] dark:not-disabled:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/4%)] dark:not-disabled:not-active:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/8%)] [&:is(:disabled,:active,[data-pressed])]:shadow-none",
			},
			size: {
				default: "h-8 min-w-8 px-[calc(--spacing(2)-1px)]",
				sm: "h-7 min-w-7 px-[calc(--spacing(1.5)-1px)]",
				lg: "h-9 min-w-9 px-[calc(--spacing(2.5)-1px)]",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Toggle({
	className,
	variant,
	size,
	...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
	return (
		<TogglePrimitive
			className={cn(toggleVariants({ variant, size, className }))}
			data-slot="toggle"
			{...props}
		/>
	);
}

export { Toggle, toggleVariants };
