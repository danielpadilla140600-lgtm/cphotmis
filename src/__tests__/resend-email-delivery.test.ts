import * as fs from "fs";
import * as path from "path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../..");
const serverSource = fs.readFileSync(path.join(ROOT, "server.ts"), "utf-8");
const adminSource = fs.readFileSync(path.join(ROOT, "src/pages/AdminDashboard.tsx"), "utf-8");

describe("Resend email delivery for hosted deployments", () => {
  it("uses the Resend API key and verified sender configuration", () => {
    expect(serverSource).toContain('process.env.RESEND_API_KEY');
    expect(serverSource).toContain('process.env.RESEND_FROM_EMAIL');
    expect(serverSource).toContain('https://api.resend.com/emails');
    expect(serverSource).toContain('Authorization: `Bearer ${resendApiKey}`');
  });

  it("preserves email content and encodes attachments for the Resend API", () => {
    expect(serverSource).toContain('to: [toEmail]');
    expect(serverSource).toContain('html: htmlContent');
    expect(serverSource).toContain('.toString("base64")');
    expect(serverSource).toContain('content_type: item.contentType');
    expect(serverSource).toContain('if (!response.ok)');
  });

  it("routes the admin test-email control to the server endpoint", () => {
    expect(adminSource).toContain('apiRequest("/api/admin/test-email"');
    expect(serverSource).toContain('app.post("/api/admin/test-email", dispatchTestEmail)');
  });
});
