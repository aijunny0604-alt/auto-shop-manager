import { NextResponse } from "next/server";
import { isSheetConnected } from "@/lib/google-sheets";

export async function GET() {
  const connected = isSheetConnected();
  const sheetId = process.env.GOOGLE_SHEET_ID || null;
  const sheetUrl = sheetId
    ? `https://docs.google.com/spreadsheets/d/${sheetId}`
    : null;

  return NextResponse.json({ connected, sheetId, sheetUrl });
}
