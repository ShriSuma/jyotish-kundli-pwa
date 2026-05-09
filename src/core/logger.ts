const isProd = import.meta.env.PROD;

export const logger = {
  log: (message: string, ...args: unknown[]) => {
    if (!isProd) {
      console.log(message, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (!isProd) {
      console.warn(message, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(message, ...args);
  }
};

