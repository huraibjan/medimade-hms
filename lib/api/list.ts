export type ListParams = {
  page: number;
  pageSize: number;
  search: string;
  sortBy?: string;
  sortDir: "asc" | "desc";
  filters: Record<string, string>;
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function parseListParams(request: Request, filterKeys: string[] = []): ListParams {
  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page") ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(url.searchParams.get("pageSize") ?? 25), 1), 100);
  const sortDir = url.searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const filters = Object.fromEntries(
    filterKeys
      .map((key) => [key, url.searchParams.get(key) ?? ""] as const)
      .filter(([, value]) => value.length > 0)
  );

  return {
    page,
    pageSize,
    search: url.searchParams.get("search") ?? url.searchParams.get("q") ?? "",
    sortBy: url.searchParams.get("sortBy") ?? undefined,
    sortDir,
    filters
  };
}

export function applyListParams<T>(
  rows: T[],
  params: ListParams,
  options: {
    searchFields?: string[];
    filterFields?: Record<string, string>;
    sortFields?: string[];
    defaultSort?: string;
  } = {}
): PaginatedResult<T> {
  const needle = params.search.trim().toLowerCase();
  let filtered = rows;

  if (needle && options.searchFields?.length) {
    filtered = filtered.filter((row) =>
      options.searchFields?.some((field) => String(getPath(row, field) ?? "").toLowerCase().includes(needle))
    );
  }

  for (const [filterKey, filterValue] of Object.entries(params.filters)) {
    const field = options.filterFields?.[filterKey] ?? filterKey;
    filtered = filtered.filter((row) => String(getPath(row, field) ?? "") === filterValue);
  }

  const sortBy = params.sortBy && options.sortFields?.includes(params.sortBy)
    ? params.sortBy
    : options.defaultSort;
  if (sortBy) {
    filtered = [...filtered].sort((a, b) => {
      const left = getPath(a, sortBy);
      const right = getPath(b, sortBy);
      const comparison = String(left ?? "").localeCompare(String(right ?? ""), undefined, { numeric: true });
      return params.sortDir === "asc" ? comparison : -comparison;
    });
  }

  const total = filtered.length;
  const start = (params.page - 1) * params.pageSize;
  const items = filtered.slice(start, start + params.pageSize);

  return {
    items,
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages: Math.max(Math.ceil(total / params.pageSize), 1)
  };
}

function getPath(value: unknown, path: string) {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, value);
}
