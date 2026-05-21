import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getUserFromToken } from "../auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const token = opts.req.cookies?.["auth_token"];
    if (token) {
      user = await getUserFromToken(token);
    }
  } catch {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
