import { StackPack } from './types.js';

export const FlutterPack: StackPack = {
  name: 'flutter',
  version: '3.x',
  category: 'mobile',
  detectionFiles: ['pubspec.yaml', 'lib/main.dart'],
  validateCommands: [
    'flutter analyze',
    'flutter test',
  ],
  conventionsMarkdown: `
- Organize by features/modules: lib/app/modules/{feature}/(views|controllers|bindings).
- Use GetX or Riverpod consistently according to the existing boilerplate pattern.
- Wrap API calls in dedicated Service classes with Dio interceptors.
- Strictly adhere to screen designs and implement responsive layouts via flutter_screenutil.
- Store auth tokens securely using flutter_secure_storage.
`.trim(),
  boilerplateLeftoverPatterns: ['counter', 'sample_item', 'demo_screen'],
  requiredTools: [
    { name: 'Flutter SDK', command: 'flutter --version' },
    { name: 'Dart', command: 'dart --version' },
  ],
};

