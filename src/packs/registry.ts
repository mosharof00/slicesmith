import { StackPack } from './types.js';
import { NestJSPack } from './nestjs.pack.js';
import { FlutterPack } from './flutter.pack.js';
import { NextJSPack } from './nextjs.pack.js';

export class StackPackRegistry {
  private static packs: Map<string, StackPack> = new Map([
    ['nestjs', NestJSPack],
    ['flutter', FlutterPack],
    ['nextjs', NextJSPack],
  ]);

  static get(name: string): StackPack | undefined {
    return this.packs.get(name.toLowerCase());
  }

  static getAll(): StackPack[] {
    return Array.from(this.packs.values());
  }

  static register(pack: StackPack): void {
    this.packs.set(pack.name.toLowerCase(), pack);
  }
}

