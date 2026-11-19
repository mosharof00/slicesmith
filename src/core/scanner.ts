import fs from 'node:fs';
import path from 'node:path';
import { Logger } from '../utils/logger.js';
import { readTextSafe, writeTextSafe } from '../utils/files.js';

export interface ScanResult {
  repoPath: string;
  detectedStack: string;
  manifest: Record<string, any>;
  modules: string[];
  routesOrScreens: string[];
  templateLeftovers: string[];
  envVariables: string[];
}

export class CodebaseScanner {
  /**
   * Deterministically scans a repo without calling LLM
   */
  static scan(repoPath: string): ScanResult {
    const absPath = path.resolve(repoPath);
    if (!fs.existsSync(absPath)) {
      throw new Error(`Repo path does not exist: ${absPath}`);
    }

    const result: ScanResult = {
      repoPath: absPath,
      detectedStack: 'unknown',
      manifest: {},
      modules: [],
      routesOrScreens: [],
      templateLeftovers: [],
      envVariables: [],
    };

    // Check package.json (Node / Nest / Next)
    const pkgPath = path.join(absPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        result.manifest = pkg;
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };

        if (deps['@nestjs/core']) result.detectedStack = 'nestjs';
        else if (deps['next']) result.detectedStack = 'nextjs';
        else if (deps['react']) result.detectedStack = 'react';
        else if (deps['express']) result.detectedStack = 'express';
      } catch (e) {
        // ignore JSON parse error
      }
    }

    // Check pubspec.yaml (Flutter / Dart)
    const pubspecPath = path.join(absPath, 'pubspec.yaml');
    if (fs.existsSync(pubspecPath)) {
      result.detectedStack = 'flutter';
    }

    // Check composer.json (Laravel / PHP)
    const composerPath = path.join(absPath, 'composer.json');
    if (fs.existsSync(composerPath)) {
      result.detectedStack = 'laravel';
    }

    // Scan modules
    if (result.detectedStack === 'nestjs') {
      const srcDir = path.join(absPath, 'src');
      if (fs.existsSync(srcDir)) {
        const entries = fs.readdirSync(srcDir, { withFileTypes: true });
        result.modules = entries.filter((e) => e.isDirectory() && !['common', 'config'].includes(e.name)).map((e) => e.name);
      }
    } else if (result.detectedStack === 'flutter') {
      const libModules = path.join(absPath, 'lib', 'app', 'modules');
      const libFeatures = path.join(absPath, 'lib', 'features');
      const targetDir = fs.existsSync(libModules) ? libModules : fs.existsSync(libFeatures) ? libFeatures : null;
      if (targetDir) {
        result.modules = fs.readdirSync(targetDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
      }
    }

    // Scan for potential template leftovers (e-commerce, demo, sample carts in non-commerce templates)
    const commonDemoPatterns = ['cart', 'product', 'ecommerce', 'sample', 'counter', 'demo'];
    result.templateLeftovers = result.modules.filter((mod) =>
      commonDemoPatterns.some((pattern) => mod.toLowerCase().includes(pattern))
    );

    return result;
  }

  /**
   * Generates or updates the boilerplate registry file
   */
  static saveRegistry(hubDir: string, repoId: string, result: ScanResult): void {
    const registryPath = path.join(hubDir, '.slicesmith', 'boilerplate-registry.json');
    let registry: Record<string, any> = {};

    if (fs.existsSync(registryPath)) {
      try {
        registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
      } catch {}
    }

    registry[repoId] = {
      stack: result.detectedStack,
      modules: result.modules,
      template_leftovers: result.templateLeftovers,
      scanned_at: new Date().toISOString(),
    };

    writeTextSafe(registryPath, JSON.stringify(registry, null, 2));
  }
}

