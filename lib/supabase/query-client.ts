type QueryError = {
  message: string;
};

type QueryResult<T> = {
  data: T[] | null;
  error: QueryError | null;
  count: number | null;
};

type InsertResult = {
  error: QueryError | null;
};

export type SupabaseTableQuery<T = unknown> = PromiseLike<QueryResult<T>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): SupabaseTableQuery<T>;
  eq(column: string, value: unknown): SupabaseTableQuery<T>;
  is(column: string, value: unknown): SupabaseTableQuery<T>;
  gte(column: string, value: unknown): SupabaseTableQuery<T>;
  gt(column: string, value: unknown): SupabaseTableQuery<T>;
  order(column: string, options?: { ascending?: boolean }): SupabaseTableQuery<T>;
  limit(count: number): SupabaseTableQuery<T>;
  update(values: Record<string, unknown>): SupabaseTableQuery<T>;
  insert(values: Record<string, unknown> | Array<Record<string, unknown>>): PromiseLike<InsertResult>;
};

export type SupabaseQueryClient = {
  from<T = unknown>(table: string): SupabaseTableQuery<T>;
};

export function asQueryClient(client: unknown) {
  return client as SupabaseQueryClient;
}
