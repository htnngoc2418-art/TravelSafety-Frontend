import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "app_data.csv");
    const provinces = new Set();

    return new Promise((resolve) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row: any) => {
          if (row.province?.trim()) provinces.add(row.province.trim());
        })
        .on("end", () => {
          resolve(NextResponse.json([...provinces]));
        })
        .on("error", (err: any) => {
          resolve(
            NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
          );
        });
    });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
