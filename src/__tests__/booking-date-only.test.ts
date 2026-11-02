import * as fs from "fs";
import * as path from "path";
import { describe, expect, it } from "vitest";
import { toDateOnlyString } from "../utils/dateOnly.ts";

describe("booking date-only persistence", () => {
  it("reads MySQL DATE columns as strings and maps them as calendar dates", () => {
    const databaseSource = fs.readFileSync(
      path.resolve(__dirname, "../db/database.ts"),
      "utf-8"
    );

    expect(databaseSource).toContain('dateStrings: ["DATE"]');
    expect(databaseSource).toContain("bookingDate: toDateOnlyString(row.booking_date)");
  });

  it("formats SQL DATE strings without interpreting them as instants", () => {
    expect(toDateOnlyString("2026-10-05")).toBe("2026-10-05");
  });

  it("keeps a local-midnight SQL DATE on its original calendar day", () => {
    expect(toDateOnlyString(new Date(2026, 9, 5))).toBe("2026-10-05");
  });
});
