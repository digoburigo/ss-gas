import { cn } from "@acme/ui";
import { Label } from "@acme/ui/label";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@acme/ui/tooltip";
import type { Label as LabelPrimitive } from "radix-ui";
import { Slot as SlotPrimitive } from "radix-ui";
import * as React from "react";
import type { ControllerProps, FieldPath, FieldValues } from "react-hook-form";
import {
	Controller,
	FormProvider,
	useFormContext,
	useFormState,
} from "react-hook-form";

// import SolarQuestionCircleBoldDuotone from "~icons/solar/question-circle-bold-duotone";

const Form = FormProvider;

type FormFieldContextValue<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
	name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
	{} as FormFieldContextValue,
);

const FormField = <
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
	...props
}: ControllerProps<TFieldValues, TName>) => (
	<FormFieldContext.Provider value={{ name: props.name }}>
		<Controller {...props} />
	</FormFieldContext.Provider>
);

const useFormField = () => {
	const fieldContext = React.useContext(FormFieldContext);
	const itemContext = React.useContext(FormItemContext);
	const { getFieldState } = useFormContext();
	const formState = useFormState({ name: fieldContext.name });
	const fieldState = getFieldState(fieldContext.name, formState);

	if (!fieldContext) {
		throw new Error("useFormField should be used within <FormField>");
	}

	const { id } = itemContext;

	return {
		id,
		name: fieldContext.name,
		formItemId: `${id}-form-item`,
		formDescriptionId: `${id}-form-item-description`,
		formMessageId: `${id}-form-item-message`,
		...fieldState,
	};
};

type FormItemContextValue = {
	id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
	{} as FormItemContextValue,
);

function FormItem({
	className,
	children,
	ref,
	...props
}: React.ComponentProps<"div">) {
	const id = React.useId();

	return (
		<FormItemContext.Provider value={{ id }}>
			<div className="w-full">
				<div
					className={cn("relative grid gap-2", className)}
					data-slot="form-item"
					ref={ref}
					{...props}
				>
					{children}
				</div>
				<div className="h-7" />
			</div>
		</FormItemContext.Provider>
		// <FormItemContext.Provider value={{ id }}>
		//   <div
		//     data-slot="form-item"
		//     className={cn('relative grid gap-2 pb-6', className)}
		//     {...props}
		//   />
		// </FormItemContext.Provider>
	);
}

function FormLabel({
	className,
	required,
	children,
	info,
	...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & {
	required?: boolean;
	info?: React.ReactNode;
}) {
	const { error, formItemId } = useFormField();
	const labelRef = React.useRef<HTMLDivElement>(null);
	const [tooltipPosition, setTooltipPosition] = React.useState({ left: 0 });

	React.useLayoutEffect(() => {
		if (labelRef.current && info) {
			const labelWidth = labelRef.current.scrollWidth;
			const asteriskWidth = required ? 8 : 0; // Approximate width of asterisk
			setTooltipPosition({ left: labelWidth + asteriskWidth });
		}
	}, [children, required, info]);

	return (
		<Label
			className={cn("data-[error=true]:text-destructive", className)}
			data-error={!!error}
			data-slot="form-label"
			htmlFor={formItemId}
			{...props}
		>
			<div className="relative flex items-center gap-1" ref={labelRef}>
				{children}
				{required ? <span>&#42;</span> : null}
			</div>
			{info ? (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							{/* <SolarQuestionCircleBoldDuotone
								className="-top-1 absolute size-6 text-primary"
								style={{ left: `${tooltipPosition.left}px` }}
							/> */}
							?
						</TooltipTrigger>
						<TooltipContent>{info}</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			) : null}
		</Label>
	);
}

function FormControl({
	...props
}: React.ComponentProps<typeof SlotPrimitive.Slot>) {
	const { error, formItemId, formDescriptionId, formMessageId } =
		useFormField();

	return (
		<SlotPrimitive.Slot
			aria-describedby={
				error ? `${formDescriptionId} ${formMessageId}` : `${formDescriptionId}`
			}
			aria-invalid={!!error}
			data-slot="form-control"
			id={formItemId}
			{...props}
		/>
	);
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
	const { error, formDescriptionId } = useFormField();

	if (error) {
		return null;
	}

	return (
		<p
			className={cn(
				"text-muted-foreground absolute bottom-0 translate-y-full transform pt-1 text-sm",
				className,
			)}
			data-slot="form-description"
			id={formDescriptionId}
			{...props}
		/>
	);
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
	const { error, formMessageId } = useFormField();
	const body = error ? String(error?.message) : props.children;

	if (!body) {
		return null;
	}

	return (
		<p
			className={cn(
				// 'absolute bottom-0 whitespace-nowrap font-medium text-destructive text-sm',
				"text-destructive absolute bottom-0 translate-y-full transform pt-1 text-sm font-medium",
				className,
			)}
			data-slot="form-message"
			id={formMessageId}
			{...props}
		>
			{body}
		</p>
	);
}

export {
	useFormField,
	Form,
	FormItem,
	FormLabel,
	FormControl,
	FormDescription,
	FormMessage,
	FormField,
};
