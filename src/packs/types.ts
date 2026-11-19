export interface StackPack {
  name: string;
  version: string;
  category: 'backend' | 'frontend' | 'mobile';
  detectionFiles: string[];
  validateCommands: string[];
  conventionsMarkdown: string;
  boilerplateLeftoverPatterns: string[];
  requiredTools: { name: string; command: string }[];
}

