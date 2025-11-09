---
description: 
globs: *.tsx
alwaysApply: false
---
- Use React Hook Form for efficient form state management and validation.
- Use controlled components for better performance and easier state management.
- Implement form validation using Zod for improved type safety and error handling.
- Implement clear error handling and user feedback for form validation issues.
- Leverage React Hook Form's performance optimizations like lazy registration.
- Implement proper validation using React Hook Form's built-in validation with Zod.
- Utilize the `useForm` hook's `watch` function for real-time form state updates.
- Use the `useFormContext` hook for sharing form state across nested components.
- Type your form with generics (useForm<FormData>()) for compile-time safety on register, setValue, etc.
- Initialize state via defaultValues in useForm({ defaultValues: { … } }).
- Wrap submission in handleSubmit to run validation before onSubmit.
- Apply validation rules in register options; for schema-based rules, use zodResolver with Zod.
- Share form methods with <FormProvider> + useFormContext instead of prop drilling.
- Use watch (single field, list, or all) to drive reactive UI; give default values where needed.
- Wrap controlled or non-ref inputs with Controller (works in React Native too).
- Manage dynamic lists with useFieldArray; supply a stable key; pair with virtualization libs for large datasets.
- Handle server or custom errors with setError / clearErrors; enable criteriaMode: 'all' for multiple messages.
- Manually register fields in useEffect when refs aren’t available; update with setValue.
- Don’t put the whole methods object in effect deps—depend on specific callbacks like reset.
- Pick validation mode (onSubmit/onChange/onBlur) that matches UX; onChange gives live feedback.
- Use Form’s onError prop to run logic after failed submissions.