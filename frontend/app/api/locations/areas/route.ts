import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const province = searchParams.get("province");

    if (!province) {
      return NextResponse.json({ error: "Missing province" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "data", "app_data.csv");
    const areas: string[] = [];

    return new Promise((resolve) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row: any) => {
          if (row.province?.trim() === province.trim()) {
            areas.push(row.area);
          }
        })
        .on("end", () => resolve(NextResponse.json(areas)))
        .on("error", (err: any) =>
          resolve(
            NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
          )
        );
    }) as Promise<NextResponse>;
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
