import { cn } from "@acme/ui";
import { Form as FormPrimitive } from "@base-ui-components/react/form";

function Form({ className, ...props }: FormPrimitive.Props) {
	return (
		<FormPrimitive
			className={cn("flex w-full flex-col gap-4", className)}
			data-slot="form"
			{...props}
		/>
	);
}

export { Form };
