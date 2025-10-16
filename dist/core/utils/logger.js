/**
 * Simple logger utility with verbose/quiet modes
 */
class Logger {
    level = 'normal';
    setLevel(level) {
        this.level = level;
    }
    info(message, ...args) {
        if (this.level !== 'quiet') {
            console.log(message, ...args);
        }
    }
    success(message, ...args) {
        if (this.level !== 'quiet') {
            console.log(`✅ ${message}`, ...args);
        }
    }
    warn(message, ...args) {
        if (this.level !== 'quiet') {
            console.warn(`⚠️ ${message}`, ...args);
        }
    }
    error(message, ...args) {
        console.error(`❌ ${message}`, ...args);
    }
    debug(message, ...args) {
        if (this.level === 'verbose') {
            console.log(`  🔍 ${message}`, ...args);
        }
    }
    verbose(message, ...args) {
        if (this.level === 'verbose') {
            console.log(`  📋 ${message}`, ...args);
        }
    }
}
export const logger = new Logger();
//# sourceMappingURL=logger.js.map