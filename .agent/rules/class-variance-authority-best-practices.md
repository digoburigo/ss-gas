---
description: Best practices for runtime type checking and validation with Zod
globs: *.tsx,*.ts
alwaysApply: false
---
- Use CVA for managing conditional class names effectively.
- Define variants and default styles for consistent UI components.
- Leverage TypeScript for type safety in class variants.
- Keep styles modular to enhance reusability across components.
- Create components with cva(base, { variants, compoundVariants, defaultVariants }).
- Variants map names → class strings/arrays; boolean variants (true/false) supported.
- Use compoundVariants to add classes when multiple variant conditions match.
- Supply defaultVariants to set fallback values.
- Call CVA result as a function: button({ intent: 'secondary', size: 'small' }).
- Derive prop types via VariantProps<typeof button>.
- Compose multiple CVAs with cx utility.