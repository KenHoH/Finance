import type { QueryClient } from "@tanstack/react-query";

interface OptimisticContext<T> {
  previous: T;
}

export async function optimisticCreate(
  queryClient: QueryClient,
  queryKey: unknown[],
  optimisticItem: object,
): Promise<OptimisticContext<unknown[]>> {
  await queryClient.cancelQueries({ queryKey });
  const previous = queryClient.getQueryData<unknown[]>(queryKey) || [];
  queryClient.setQueryData<unknown[]>(queryKey, (old) => [optimisticItem, ...(old || [])]);
  return { previous };
}

export async function optimisticUpdate(
  queryClient: QueryClient,
  queryKey: unknown[],
  id: string,
  patch: object,
): Promise<OptimisticContext<unknown[]>> {
  await queryClient.cancelQueries({ queryKey });
  const previous = queryClient.getQueryData<unknown[]>(queryKey) || [];
  queryClient.setQueryData<unknown[]>(queryKey, (old) =>
    (old || []).map((item) => ((item as { id: string }).id === id ? { ...(item as object), ...patch } : item)),
  );
  return { previous };
}

export async function optimisticDelete(
  queryClient: QueryClient,
  queryKey: unknown[],
  id: string,
): Promise<OptimisticContext<unknown[]>> {
  await queryClient.cancelQueries({ queryKey });
  const previous = queryClient.getQueryData<unknown[]>(queryKey) || [];
  queryClient.setQueryData<unknown[]>(queryKey, (old) => (old || []).filter((item) => (item as { id: string }).id !== id));
  return { previous };
}

export function rollbackOnError<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  context: OptimisticContext<T> | undefined,
) {
  if(context) {
    queryClient.setQueryData(queryKey, context.previous);
  }
}
