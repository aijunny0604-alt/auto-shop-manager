import { NextResponse } from "next/server";
import { isConnected } from "@/lib/google-calendar";

export async function GET() {
  return NextResponse.json({ connected: isConnected() });
}
