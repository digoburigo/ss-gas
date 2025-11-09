---
description: Best practices for using Radix UI components
globs: *.tsx
alwaysApply: false
---
- Use Radix UI components to ensure consistent and accessible UI elements.
- Customize components using Radix UI's provided APIs rather than altering the core.
- Implement accessibility features like ARIA attributes and keyboard navigation.
- Use Radix UI's primitive components to build custom, accessible UI elements.
- Follow Radix UI's guidelines for theming and styling to maintain design consistency.
- Install primitives/themes: npm install radix-ui@latest and @radix-ui/themes, then wrap the app in <Theme>.
- Compose with asChild + Slot to merge props on a single child; default element otherwise.
- Label interactive primitives (e.g., Select) using Label: wrap or link via htmlFor/id for a11y.
- Wrap custom primitives in React.forwardRef and pass indicators/icons (e.g., SelectItem with CheckIcon).
- Use Dialog.Portal for overlay/content portalling; set container or forceMount for animation control.
- Override theme colors by remapping CSS vars (--indigo-9, etc.) inside .radix-themes; declare light/dark palettes via Radix Colors aliasing.
- Enable highContrast on Slider, TabNav, etc.; set panelBackground="solid" for opaque panels.
- Use radius scale vars (--radius-1…6) and radius-factor for consistent rounding.
- Implement OTP fields, Menubar, etc., with proper dir/orientation and loop keyboard props.
- Custom Buttons default to native element but switch to Slot.Root when asChild is true.
- Place CSS var overrides after Radix Themes styles and avoid CDN imports in production.