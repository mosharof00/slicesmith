import { Logger } from '../utils/logger.js';

export interface SecretMatch {
  type: string;
  line: number;
  snippet: string;
}

export class GuardEngine {
  // Regex patterns for secrets
  private static SECRET_PATTERNS: { name: string; regex: RegExp }[] = [
    { name: 'Generic API Key', regex: /(?:api[_-]?key|apikey|secret|token)\s*[:=]\s*["']([A-Za-z0-9_\-]{16,})["']/i },
    { name: 'Google API Key', regex: /AIza[0-9A-Za-z\\-_]{35}/ },
    { name: 'OpenAI Secret Key', regex: /sk-[A-Za-z0-9]{32,}/ },
    { name: 'GitHub Token', regex: /gh[pous]_[A-Za-z0-9_]{36,}/ },
    { name: 'JWT Secret Pattern', regex: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}/ },
    { name: 'Database Password URI', regex: /(?:postgres|mysql|mongodb):\/\/[^:]+:([^@]+)@/ },
  ];

  /**
   * Scans text for exposed credentials and secrets
   */
  static scanSecrets(content: string): SecretMatch[] {
    const matches: SecretMatch[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of this.SECRET_PATTERNS) {
        if (pattern.regex.test(line)) {
          matches.push({
            type: pattern.name,
            line: i + 1,
            snippet: line.trim().slice(0, 50) + '...',
          });
        }
      }
    }

    return matches;
  }

  /**
   * Redacts sensitive secret strings from content before passing to models or logs
   */
  static redactSecrets(content: string): string {
    let sanitized = content;
    for (const pattern of this.SECRET_PATTERNS) {
      sanitized = sanitized.replace(pattern.regex, '[REDACTED_SECRET]');
    }
    return sanitized;
  }

  /**
   * Evaluates if an action triggers one of the 9 Human Approval Gates
   */
  static checkApprovalGate(action: {
    type: 'db_migration' | 'deploy' | 'env_change' | 'contract_change' | 'dependency_add' | 'git_push';
    details: string;
  }): { requiresApproval: boolean; gateNumber: number; reason: string } {
    switch (action.type) {
      case 'db_migration':
        if (/drop|alter\s+table|delete/i.test(action.details)) {
          return { requiresApproval: true, gateNumber: 1, reason: 'Destructive database migration detected' };
        }
        break;
      case 'deploy':
        return { requiresApproval: true, gateNumber: 2, reason: 'Production deployment triggered' };
      case 'env_change':
        return { requiresApproval: true, gateNumber: 3, reason: 'Modifying environment variable or secret configuration' };
      case 'contract_change':
        return { requiresApproval: true, gateNumber: 8, reason: 'Modifying shared API/realtime contract' };
      case 'dependency_add':
        return { requiresApproval: true, gateNumber: 7, reason: 'Adding new third-party package dependency' };
      case 'git_push':
        return { requiresApproval: true, gateNumber: 6, reason: 'Pushing changes to remote git repository' };
    }

    return { requiresApproval: false, gateNumber: 0, reason: '' };
  }
}

