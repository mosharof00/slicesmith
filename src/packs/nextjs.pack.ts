import { StackPack } from './types.js';

export const NextJSPack: StackPack = {
  name: 'nextjs',
  version: '14.x/15.x/16.x',
  category: 'frontend',
  detectionFiles: ['next.config.js', 'next.config.mjs', 'next.config.ts'],
  validateCommands: [
    'npm run lint',
    'npm run build',
  ],
  conventionsMarkdown: `
- Next.js App Router (app/(auth), app/(dashboard)).
- Strict TypeScript with Tailwind CSS & Shadcn UI.
- TanStack Query for server state caching & mutation.
- React Hook Form + Zod for form state and validation.
- Implement all 6 UI states: Default, Loading Skeleton, Empty, Error, Responsive, Interactive.
`.trim(),
  boilerplateLeftoverPatterns: ['demo', 'sample_product', 'counter'],
  requiredTools: [
    { name: 'Node.js', command: 'node -v' },
    { name: 'npm or pnpm', command: 'npm -v' },
  ],
};

