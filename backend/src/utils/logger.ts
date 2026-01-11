/**
 * Structured logging utility
 */

export interface LogContext {
  source?: string;
  articleId?: string;
  duration?: number;
  error?: Error | string;
  [key: string]: unknown;
}

export class Logger {
  private prefix: string;

  constructor(prefix: string = 'APP') {
    this.prefix = prefix;
  }

  info(message: string, context?: LogContext): void {
    console.log(this.format('INFO', message, context));
  }

  error(message: string, context?: LogContext): void {
    console.error(this.format('ERROR', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.format('WARN', message, context));
  }

  debug(message: string, context?: LogContext): void {
    console.debug(this.format('DEBUG', message, context));
  }

  private format(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${this.prefix}] [${level}] ${message}${contextStr}`;
  }
}

export const logger = new Logger();
