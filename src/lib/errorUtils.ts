// errorUtils.ts

/**
 * Gets a user-friendly error message from any type of error
 */
export const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unknown error occurred';
  };
  
  /**
   * Type guard to check if an unknown value is an Error
   */
  export const isError = (error: unknown): error is Error => {
    return error instanceof Error;
  };
  
  /**
   * Wrapper for async operations with proper error handling
   */
  export const handleAsyncOperation = async <T>(
    operation: () => Promise<T>,
    onError: (message: string) => void
  ): Promise<T | undefined> => {
    try {
      return await operation();
    } catch (error) {
      onError(getErrorMessage(error));
      return undefined;
    }
  };