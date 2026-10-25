"use client";

import { useRef, useEffect, useCallback } from "react";

export interface ExecuteOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: unknown) => void;
  onSettled?: (isLatest: boolean) => void;
}

export interface ExecuteResult<T> {
  superseded: boolean;
  data?: T;
  error?: unknown;
}

/**
 * Core manager that coordinates asynchronous request generations, ensuring
 * latest-request-wins semantics and preventing race conditions or stale state updates.
 */
export class LatestRequestManager {
  generation = 0;
  isMounted = true;

  async execute<T>(
    asyncFn: () => Promise<T>,
    options?: ExecuteOptions<T>
  ): Promise<ExecuteResult<T>> {
    const currentGen = ++this.generation;
    try {
      const result = await asyncFn();
      if (!this.isMounted || currentGen !== this.generation) {
        return { superseded: true, data: undefined };
      }
      options?.onSuccess?.(result);
      return { superseded: false, data: result };
    } catch (err) {
      if (!this.isMounted || currentGen !== this.generation) {
        return { superseded: true, error: err };
      }
      options?.onError?.(err);
      return { superseded: false, error: err };
    } finally {
      if (this.isMounted) {
        const isLatest = currentGen === this.generation;
        options?.onSettled?.(isLatest);
      }
    }
  }
}

/**
 * Hook to manage asynchronous request generations, ensuring latest-request-wins
 * semantics and preventing race conditions or stale state updates in React components.
 *
 * Each call to `execute` receives an incrementing generation ID. Callbacks
 * (`onSuccess`, `onError`) are only invoked if the request is still the latest
 * generation and the component remains mounted.
 *
 * `onSettled` is called with `isLatest` indicating whether this request is the
 * newest generation, allowing callers to clear loading flags only when the
 * newest request settles without leaving skeletons stuck.
 */
export function useLatestRequest() {
  const isMountedRef = useRef(true);
  const generationRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      options?: ExecuteOptions<T>
    ): Promise<ExecuteResult<T>> => {
      const currentGen = ++generationRef.current;
      try {
        const result = await asyncFn();
        if (!isMountedRef.current || currentGen !== generationRef.current) {
          return { superseded: true, data: undefined };
        }
        options?.onSuccess?.(result);
        return { superseded: false, data: result };
      } catch (err) {
        if (!isMountedRef.current || currentGen !== generationRef.current) {
          return { superseded: true, error: err };
        }
        options?.onError?.(err);
        return { superseded: false, error: err };
      } finally {
        if (isMountedRef.current) {
          const isLatest = currentGen === generationRef.current;
          options?.onSettled?.(isLatest);
        }
      }
    },
    []
  );

  return {
    execute,
    isMountedRef,
    generationRef,
  };
}

export default useLatestRequest;
