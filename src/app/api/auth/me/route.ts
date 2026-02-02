import { NextResponse } from "next/server";
import { getToken, getUser } from "@/lib/auth";

export async function GET() {
  const token = await getToken();
  const user = await getUser();
  if (!token || !user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user });
}
