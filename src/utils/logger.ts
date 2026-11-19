import chalk from 'chalk';
import ora, { Ora } from 'ora';

export class Logger {
  private static spinner: Ora | null = null;

  static info(message: string): void {
    console.log(chalk.blue('ℹ'), chalk.white(message));
  }

  static success(message: string): void {
    console.log(chalk.green('✔'), chalk.bold(message));
  }

  static warn(message: string): void {
    console.log(chalk.yellow('⚠'), chalk.yellow(message));
  }

  static error(message: string, error?: unknown): void {
    console.log(chalk.red('✖'), chalk.bold.red(message));
    if (error instanceof Error && process.env.DEBUG) {
      console.error(chalk.dim(error.stack));
    }
  }

  static header(title: string): void {
    console.log('\n' + chalk.bold.cyan('=== ' + title + ' ==='));
  }

  static box(title: string, lines: string[]): void {
    const width = Math.max(title.length + 4, ...lines.map((l) => l.length + 4), 50);
    const border = '─'.repeat(width);
    console.log(chalk.cyan(`┌${border}┐`));
    console.log(chalk.cyan(`│ ${chalk.bold.white(title.padEnd(width - 2))} │`));
    console.log(chalk.cyan(`├${border}┤`));
    for (const line of lines) {
      console.log(chalk.cyan(`│ `) + line.padEnd(width - 2) + chalk.cyan(` │`));
    }
    console.log(chalk.cyan(`└${border}┘`));
  }

  static spin(message: string): Ora {
    if (this.spinner) this.spinner.stop();
    this.spinner = ora({
      text: chalk.dim(message),
      color: 'cyan',
    }).start();
    return this.spinner;
  }

  static stopSpin(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }
}

