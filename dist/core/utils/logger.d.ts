/**
 * Simple logger utility with verbose/quiet modes
 */
export type LogLevel = 'quiet' | 'normal' | 'verbose';
declare class Logger {
    private level;
    setLevel(level: LogLevel): void;
    info(message: string, ...args: any[]): void;
    success(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    verbose(message: string, ...args: any[]): void;
}
export declare const logger: Logger;
export {};
