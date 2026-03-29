import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function errorJson(
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return json(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status },
  );
}

export function zodError(err: ZodError) {
  return errorJson(422, "VALIDATION_ERROR", "Invalid request", err.flatten());
}

export function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store");
  return res;
}
