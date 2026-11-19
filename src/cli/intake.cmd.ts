import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { Logger } from '../utils/logger.js';
import { IntakeEngine, RequirementItem } from '../core/intake.js';
import { writeTextSafe, readTextSafe } from '../utils/files.js';

export async function intakeCommand(action: 'scan' | 'convert' | 'list', targetFile?: string): Promise<void> {
  const intake = new IntakeEngine(process.cwd());

  if (action === 'scan' || !action) {
    Logger.header('SliceSmith Intake: Scanning Inbox');
    const items = intake.scanInbox();
    console.log(chalk.bold('\nFiles waiting in inbox:'));
    console.log(`  📄 Documents (${items.docs.length}): ${items.docs.join(', ') || chalk.dim('None')}`);
    console.log(`  🖼️  Screens (${items.screens.length}):   ${items.screens.join(', ') || chalk.dim('None')}`);
    console.log(`  📝 Notes (${items.notes.length}):     ${items.notes.join(', ') || chalk.dim('None')}`);

    if (items.docs.length + items.screens.length + items.notes.length > 0) {
      console.log(chalk.cyan(`\nRun 'slicesmith intake convert' to distill these into requirements/LEDGER.md`));
    }
    return;
  }

  if (action === 'convert') {
    Logger.header('SliceSmith Intake: Converting Inbox Files');
    const items = intake.scanInbox();
    const existingLedger = intake.loadLedger();
    let addedCount = 0;

    // Convert text & PDF docs
    const docsDir = path.join(intake.inboxDir, 'docs');
    for (const doc of items.docs) {
      const fullPath = path.join(docsDir, doc);
      const convertedSpecPath = intake.processFile(fullPath, 'docs');
      if (convertedSpecPath) {
        Logger.success(`Converted ${doc} → ${path.relative(process.cwd(), convertedSpecPath)}`);
      }

      // Extract basic requirement item if not already in ledger
      const baseName = path.basename(doc, path.extname(doc));
      if (!existingLedger.some((r) => r.source.includes(doc))) {
        const nextId = intake.getNextId(existingLedger);
        const newItem: RequirementItem = {
          id: nextId,
          title: `Specifications from ${baseName}`,
          description: `Extracted from ${doc}`,
          source: doc,
          status: 'confirmed',
          date: new Date().toISOString().split('T')[0],
        };
        existingLedger.push(newItem);
        addedCount++;
      }
    }

    // Convert notes
    const notesDir = path.join(intake.inboxDir, 'notes');
    for (const note of items.notes) {
      const fullPath = path.join(notesDir, note);
      const convertedSpecPath = intake.processFile(fullPath, 'notes');
      if (convertedSpecPath) {
        Logger.success(`Converted ${note} → ${path.relative(process.cwd(), convertedSpecPath)}`);
      }
    }

    // Register screens
    if (items.screens.length > 0) {
      const screensInventoryPath = path.join(intake.requirementsDir, 'SCREEN_INVENTORY.md');
      let screensMd = `# 🖼️ Screen Inventory\n\n`;
      screensMd += `> **Visual Source of Truth**: Screenshots registered in inbox/screens/.\n\n`;
      for (const screen of items.screens) {
        screensMd += `- **${screen}**: \`inbox/screens/${screen}\`\n`;
      }
      writeTextSafe(screensInventoryPath, screensMd);
      Logger.success(`Registered ${items.screens.length} screens in requirements/SCREEN_INVENTORY.md`);
    }

    intake.saveLedger(existingLedger);
    Logger.box('Intake Conversion Completed', [
      `Requirements Ledger updated: ${intake.ledgerPath}`,
      `Total ledger items: ${existingLedger.length} (+${addedCount} new)`,
      `Next step: Run 'slicesmith onboard' to analyze your project boilerplates`,
    ]);
    return;
  }

  if (action === 'list') {
    Logger.header('SliceSmith Requirements Ledger');
    const existingLedger = intake.loadLedger();
    if (existingLedger.length === 0) {
      console.log(chalk.yellow('No requirements in ledger yet. Drop files in inbox/ and run: slicesmith intake convert'));
      return;
    }

    for (const item of existingLedger) {
      const statusColor = item.status === 'confirmed' ? chalk.green : item.status === 'assumed' ? chalk.yellow : chalk.magenta;
      console.log(`  ${chalk.bold.cyan(item.id)} [${statusColor(item.status.toUpperCase())}] ${item.title} ${chalk.dim(`(${item.source})`)}`);
    }
  }
}

