import { useCallback, useRef } from "react";

export function useCancelLatestCalls<T extends (params: any) => Promise<any>>(
    fn: T,
    delay: number = 3000
) {
    const cancelRef = useRef<{
        id: number;
        cancel: () => void;
    } | null>(null);

    return useCallback(
        (params: Parameters<T>[0]): Promise<ReturnType<T> | undefined> => {
            // Cancel previous pending call
            if (cancelRef.current) {
                cancelRef.current.cancel();
            }

            let shouldCancel = false;
            const currentId = Date.now();

            const promise = new Promise<ReturnType<T> | undefined>(
                (resolve, reject) => {
                    const timeoutId = setTimeout(() => {
                        if (!shouldCancel) {
                            fn(params).then(resolve).catch(reject);
                        } else {
                            resolve(undefined);
                        }
                    }, delay);

                    cancelRef.current = {
                        id: currentId,
                        cancel: () => {
                            shouldCancel = true;
                            clearTimeout(timeoutId);
                        }
                    };
                }
            );

            return promise;
        },
        [fn, delay]
    );
}
