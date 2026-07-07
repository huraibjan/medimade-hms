import { NextResponse } from "next/server";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiFailure = {
  success: false;
  error: string;
  details?: unknown;
};

export function apiSuccess<T>(data: T, init?: ResponseInit & { meta?: Record<string, unknown> }) {
  return NextResponse.json<ApiSuccess<T>>(
    { success: true, data, ...(init?.meta ? { meta: init.meta } : {}) },
    init
  );
}

export function apiError(error: string, status = 400, details?: unknown) {
  return NextResponse.json<ApiFailure>(
    { success: false, error, ...(details === undefined ? {} : { details }) },
    { status }
  );
}

export function apiServiceResult<T extends { ok: boolean; message: string }>(
  result: T,
  successStatus = 200,
  getData?: (result: T) => unknown
) {
  if (!result.ok) return apiError(result.message, 400);
  return apiSuccess(getData ? getData(result) : result, { status: successStatus });
}

export function apiUnexpected(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  return apiError(message, 500);
}
