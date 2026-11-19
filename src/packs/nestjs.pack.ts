import { StackPack } from './types.js';

export const NestJSPack: StackPack = {
  name: 'nestjs',
  version: '10.x/11.x',
  category: 'backend',
  detectionFiles: ['nest-cli.json', 'src/main.ts'],
  validateCommands: [
    'npm run lint',
    'npm run test',
    'npm run build',
  ],
  conventionsMarkdown: `
- Follow Modular Domain Architecture: modules/{module}/{module}.(controller|service|module).ts
- Use class-validator DTOs for every incoming request payload.
- Separate business logic into Services; keep Controllers thin.
- Use Prisma ORM with proper migrations: npx prisma migrate dev.
- All endpoints must return standard JSON: { data, statusCode, message }.
`.trim(),
  boilerplateLeftoverPatterns: ['cart', 'product', 'ecommerce', 'sample', 'demo'],
  requiredTools: [
    { name: 'Node.js', command: 'node -v' },
    { name: 'npm or pnpm', command: 'npm -v' },
  ],
};

