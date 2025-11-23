// Utility function for debouncing with flush capability
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): T & { flush: () => void; cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = function (this: unknown, ...args: Parameters<T>) {
    lastArgs = args;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this as unknown, args as unknown as Parameters<T>);
      timeoutId = null;
      lastArgs = null;
    }, wait);
  } as T & { flush: () => void; cancel: () => void };

  // Force immediate execution
  debounced.flush = function (this: unknown) {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (lastArgs) {
      func.apply(this as unknown, lastArgs as unknown as Parameters<T>);
      lastArgs = null;
    }
  };

  // Cancel pending execution
  debounced.cancel = function () {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  return debounced;
}
