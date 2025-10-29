export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  ASSET_DOWNLOAD_ERROR = 'ASSET_DOWNLOAD_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  IAP_ERROR = 'IAP_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  recoverable: boolean;
  retryable: boolean;
  context?: Record<string, any>;
}

export class ErrorHandler {
  static handle(error: any): AppError {
    if (error instanceof AppError) {
      return error;
    }

    // Network errors
    if (
      error.message?.includes('fetch') ||
      error.message?.includes('network')
    ) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message:
          'Network connection failed. Please check your internet connection.',
        recoverable: true,
        retryable: true,
      };
    }

    // Parse errors
    if (error.message?.includes('parse') || error.message?.includes('JSON')) {
      return {
        type: ErrorType.PARSE_ERROR,
        message:
          'Failed to process the content. The page format may not be supported.',
        recoverable: false,
        retryable: false,
      };
    }

    // Storage errors
    if (error.message?.includes('storage') || error.message?.includes('disk')) {
      return {
        type: ErrorType.STORAGE_ERROR,
        message: 'Storage error. Please check available space.',
        recoverable: true,
        retryable: false,
      };
    }

    // Default error
    return {
      type: ErrorType.DATABASE_ERROR,
      message: error.message || 'An unexpected error occurred.',
      recoverable: false,
      retryable: false,
    };
  }

  static async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries exceeded');
  }
}
