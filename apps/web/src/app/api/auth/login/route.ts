import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPool, getMemoryUsers } from "@/lib/db";
import { createToken } from "@/lib/auth";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  const pool = getPool();

  // No database — use in-memory store
  if (!pool) {
    const { memoryUsers } = getMemoryUsers();
    const entry = memoryUsers.get(username.toLowerCase());
    if (!entry) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const valid = await bcrypt.compare(password, entry.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const token = createToken(entry.id, entry.username);
    const response = NextResponse.json({ token, userId: entry.id, username: entry.username });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });
    return response;
  }

  try {
    const result = await pool.query(
      "SELECT id, password_hash FROM users WHERE username = $1",
      [username],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = createToken(user.id, username);

    const response = NextResponse.json({ token, userId: user.id, username });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
