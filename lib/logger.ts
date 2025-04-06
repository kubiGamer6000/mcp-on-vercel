import fs from "fs";
import path from "path";

// Default log configuration
const defaultLogConfig = {
  level: process.env.LOG_LEVEL || "info",
  file:
    process.env.NODE_ENV === "development"
      ? path.join(process.cwd(), "logs/mcp-server.log")
      : "/tmp/mcp-server.log",
  format: "json",
  timestamp: true,
};

// Create a singleton logger instance
class Logger {
  private static instance: Logger;
  private logStream: fs.WriteStream | null = null;
  private logDir: string;
  private logFile: string;
  private initialized = false;

  private constructor() {
    this.logFile = defaultLogConfig.file;
    this.logDir = path.dirname(this.logFile);
    this.ensureLogDirExists();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private ensureLogDirExists(): void {
    if (!fs.existsSync(this.logDir)) {
      try {
        fs.mkdirSync(this.logDir, { recursive: true });
        console.log(`Created log directory: ${this.logDir}`);
      } catch (error) {
        console.error(`Failed to create log directory: ${error}`);
      }
    }
  }

  public initialize(): void {
    if (this.initialized) return;

    try {
      this.logStream = fs.createWriteStream(this.logFile, { flags: "a" });
      console.log(`Logging to ${this.logFile}`);
      this.initialized = true;

      // Handle process shutdown
      process.on("exit", () => this.closeLogStream());
      process.on("SIGINT", () => {
        this.closeLogStream();
        process.exit(0);
      });
      process.on("SIGTERM", () => {
        this.closeLogStream();
        process.exit(0);
      });
    } catch (error) {
      console.error(`Failed to create log stream: ${error}`);
    }
  }

  private closeLogStream(): void {
    if (this.logStream) {
      this.logStream.end();
      this.logStream = null;
    }
  }

  public log(level: string, message: string, data?: any): void {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      const timestamp = new Date().toISOString();

      // Log entry for file
      const logEntry = {
        timestamp,
        level,
        message,
        ...(data ? { data } : {}),
      };

      // Write to log file
      if (this.logStream) {
        this.logStream.write(JSON.stringify(logEntry) + "\n");
      }

      // Always log to console in development mode
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[${timestamp}] [${level.toUpperCase()}] ${message}`,
          data || ""
        );
      }
    } catch (error) {
      console.error(`Failed to write log: ${error}`);
    }
  }

  public info(message: string, data?: any): void {
    this.log("info", message, data);
  }

  public error(message: string, data?: any): void {
    this.log("error", message, data);
  }

  public debug(message: string, data?: any): void {
    if (defaultLogConfig.level === "debug") {
      this.log("debug", message, data);
    }
  }

  public warn(message: string, data?: any): void {
    this.log("warn", message, data);
  }
}

// Export the singleton instance
export const logger = Logger.getInstance();
