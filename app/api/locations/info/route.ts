import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const area = searchParams.get("area");

    if (!area) {
      return NextResponse.json({ error: "Missing area" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "data", "app_data.csv");
    let result: Record<string, any> | null = null;

    return new Promise((resolve) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row: any) => {
          if (row.area?.trim() === area.trim()) result = row;
        })
        .on("end", () => resolve(NextResponse.json(result)))
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
