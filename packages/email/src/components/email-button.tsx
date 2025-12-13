import { cn } from "@acme/ui";
import type { ButtonProps } from "@react-email/components";
import { Button } from "@react-email/components";

export function EmailButton({ children, className, ...props }: ButtonProps) {
	return (
		<Button
			className={cn("bg-primary rounded-md px-3 py-2", className)}
			{...props}
		>
			{children}
		</Button>
	);
}
