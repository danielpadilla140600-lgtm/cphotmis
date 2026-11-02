import { describe, expect, it } from "vitest";
import { Booking, Studio } from "../db/types.ts";
import { buildStudioSalesReportPDF } from "../utils/pdfGenerator.ts";

const studio: Studio = {
  id: "STUDIO-1",
  name: "Cainta Portrait Studio",
  ownerId: "OWNER-1",
  logo: "",
  coverImage: "",
  location: "Cainta",
  rating: 5,
  reviewCount: 0,
  startingPrice: 1000,
  blockedDates: [],
  categories: [],
  description: "",
  address: "Cainta, Rizal",
  contactInfo: "",
  email: "",
  businessHours: "09:00 AM - 06:00 PM",
  isApproved: true,
  status: "approved",
  printingAvailable: false,
  createdAt: "2026-01-01T00:00:00.000Z"
};

function createBooking(index: number): Booking & {
  serviceName: string;
  addonReportDetails: string;
  paymentMethods: string;
  paymentReferences: string;
} {
  return {
    id: `BK-2026-${index}`,
    studioId: studio.id,
    customerId: `CUSTOMER-${index}`,
    serviceId: "SERVICE-1",
    bookingDate: "2026-10-06",
    timeSlot: "04:00 PM",
    addons: [],
    customerDetails: {
      fullName: "Maria Dela Cruz",
      email: "maria.dela.cruz@example.com",
      phone: "09191234503",
      notes: ""
    },
    status: "Completed",
    totalAmount: 1000,
    amountPaid: 1000,
    downPaymentAmount: 300,
    remainingBalance: 0,
    paymentStatus: "Paid",
    finalPaymentStatus: "Paid",
    createdAt: "2026-10-01T00:00:00.000Z",
    serviceName: "Individual Portrait Session",
    addonReportDetails: Array.from(
      { length: 18 },
      (_, addonIndex) => `Printed 8R Photo x1 Reference${addonIndex + 1}`
    ).join(", "),
    paymentMethods: "GCash",
    paymentReferences: `PAYMENTREFERENCE${"1234567890".repeat(8)}`
  };
}

describe("studio financial report PDF layout", () => {
  it("uses landscape tables and paginates long booking details without clipping", () => {
    const pdf = buildStudioSalesReportPDF(
      studio,
      Array.from({ length: 8 }, (_, index) => createBooking(index + 1)),
      []
    );

    expect(pdf.internal.pageSize.getWidth()).toBeGreaterThan(
      pdf.internal.pageSize.getHeight()
    );
    expect(pdf.getNumberOfPages()).toBeGreaterThan(1);
  });
});
