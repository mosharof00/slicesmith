import { Command } from 'commander';
import { initCommand } from './init.cmd.js';
import { doctorCommand } from './doctor.cmd.js';
import { intakeCommand } from './intake.cmd.js';
import { onboardCommand } from './onboard.cmd.js';
import { planCommand } from './plan.cmd.js';
import { runCommand } from './run.cmd.js';
import { statusCommand } from './status.cmd.js';
import { tokensCommand } from './tokens.cmd.js';

export function createProgram(): Command {
  const program = new Command();

  program
    .name('slicesmith')
    .description('Deterministic Multi-Agent Build Harness for Full-Stack & Mobile Projects')
    .version('0.1.0');

  program
    .command('init [name]')
    .description('Initialize a new SliceSmith project hub')
    .option('--mode <mode>', 'Project mode: new or existing', 'new')
    .action(async (name, options) => {
      await initCommand(name, options);
    });

  program
    .command('doctor')
    .description('Check toolchains, SDKs, environment variables, and model keys')
    .action(async () => {
      await doctorCommand();
    });

  program
    .command('intake [action] [target]')
    .description('Manage client requirements inbox: scan, convert, or list')
    .action(async (action = 'scan', target) => {
      await intakeCommand(action as any, target);
    });

  program
    .command('onboard')
    .description('Scan attached boilerplates, detect stacks, and register template leftovers')
    .action(async () => {
      await onboardCommand();
    });

  program
    .command('plan')
    .description('Generate vertical slices and task contracts from requirements ledger')
    .action(async () => {
      await planCommand();
    });

  program
    .command('run <taskId>')
    .description('Compile context and execute a specific task contract')
    .action(async (taskId) => {
      await runCommand(taskId);
    });

  program
    .command('status')
    .description('Display task completion and project slice progress')
    .action(async () => {
      await statusCommand();
    });

  program
    .command('tokens')
    .description('Display token consumption, prompt cache savings, and cost ledger')
    .action(async () => {
      await tokensCommand();
    });

  return program;
}

