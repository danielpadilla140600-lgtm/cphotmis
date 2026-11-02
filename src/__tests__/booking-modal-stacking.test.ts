import * as fs from "fs";
import * as path from "path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../..");

describe("booking and photo-proof modal stacking", () => {
  it("renders booking action modals above the manage dialog", () => {
    const dashboard = fs.readFileSync(
      path.join(ROOT, "src/pages/StudioDashboard.tsx"),
      "utf-8"
    );
    const bookingDetails = fs.readFileSync(
      path.join(ROOT, "src/components/BookingDetailsModal.tsx"),
      "utf-8"
    );
    const rescheduleModal = fs.readFileSync(
      path.join(ROOT, "src/components/RescheduleModal.tsx"),
      "utf-8"
    );
    const manageModalZ = dashboard.match(
      /aria-label="Booking details and actions"[\s\S]*?className="fixed inset-0 z-\[(\d+)\]/
    );
    const proofModal = dashboard.match(
      /proofingBookingId && \(\s*<div className="fixed inset-0 z-\[(\d+)\]/
    );
    const detailsModal = bookingDetails.match(
      /<div className="fixed inset-0 z-\[(\d+)\]/
    );
    const rescheduleOverlay = rescheduleModal.match(
      /<div className="fixed inset-0 z-\[(\d+)\]/
    );
    const receiptModal = dashboard.match(
      /viewingReceipt && \(\s*<div className="fixed inset-0 z-\[(\d+)\]/
    );

    expect(manageModalZ).not.toBeNull();
    expect(proofModal).not.toBeNull();
    expect(detailsModal).not.toBeNull();
    expect(rescheduleOverlay).not.toBeNull();
    expect(receiptModal).not.toBeNull();

    const manageZIndex = Number(manageModalZ?.[1]);
    expect(Number(proofModal?.[1])).toBeGreaterThan(manageZIndex);
    expect(Number(detailsModal?.[1])).toBeGreaterThan(manageZIndex);
    expect(Number(rescheduleOverlay?.[1])).toBeGreaterThan(manageZIndex);
    expect(Number(receiptModal?.[1])).toBeGreaterThan(manageZIndex);
  });
});
