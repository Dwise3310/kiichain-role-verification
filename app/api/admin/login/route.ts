import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-session";
import { logAudit } from "@/lib/audit";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({ password: z.string().min(1) });

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const { success } = await checkRateLimit(`admin-login:${ip}`);
  if (!success) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    return NextResponse.json({ error: "Admin auth is not configured" }, { status: 500 });
  }

  const valid = await bcrypt.compare(parsed.data.password, hash);
  if (!valid) {
    await logAudit("admin", "admin_login_failed", ip);
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const token = await signAdminToken();
  await logAudit("admin", "admin_login", ip);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE_NAME);
  return res;
}
