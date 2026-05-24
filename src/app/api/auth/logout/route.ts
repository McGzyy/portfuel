import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

async function logout() {
  await destroySession();
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
}

export async function POST() {
  return logout();
}

export async function GET() {
  return logout();
}
