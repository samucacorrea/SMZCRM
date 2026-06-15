import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";
import { withRouteLogging } from "@/lib/logger";

const handlers = toNextJsHandler(auth);

export async function GET(
  request: Request,
  _context: { params: Promise<Record<string, string | string[]>> },
) {
  return withRouteLogging(
    request,
    {
      area: "auth",
      action: "GET",
    },
    () => handlers.GET(request),
  );
}

export async function POST(
  request: Request,
  _context: { params: Promise<Record<string, string | string[]>> },
) {
  return withRouteLogging(
    request,
    {
      area: "auth",
      action: "POST",
    },
    () => handlers.POST(request),
  );
}
