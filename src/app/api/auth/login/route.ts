import { NextRequest, NextResponse } from "next/server";
import { login, getProfile } from "@/lib/dupr-api";
import { setAuthCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const loginData = await login(email, password);
    const token = loginData?.result?.accessToken;
    if (!token) {
      return NextResponse.json(
        { error: "Login failed - invalid credentials" },
        { status: 401 }
      );
    }

    // Get user profile
    const profileData = await getProfile(token);
    const user = profileData?.result || {};

    // Log the raw profile for debugging
    console.log("[DUPR Login] Raw profile keys:", Object.keys(user));
    console.log("[DUPR Login] id:", user.id, "duprId:", user.duprId, "fullName:", user.fullName);
    console.log("[DUPR Login] ratings - doubles:", user.doubles, "doublesRating:", user.doublesRating);

    // Try multiple possible rating fields
    const doublesRating = user.doubles ?? user.doublesRating ?? user.ratings?.doubles ?? null;
    const singlesRating = user.singles ?? user.singlesRating ?? user.ratings?.singles ?? null;

    await setAuthCookies(token, {
      id: user.id,
      duprId: user.duprId,
      fullName: user.fullName,
      email: user.email,
      doublesRating,
      singlesRating,
      imageUrl: user.imageUrl,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        duprId: user.duprId,
        fullName: user.fullName,
        doublesRating,
        singlesRating,
        imageUrl: user.imageUrl,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
