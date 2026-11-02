import { describe, expect, it } from "vitest";
import { Booking, Payment, Studio } from "../db/types.ts";
import { buildBookingReceiptPDF } from "../utils/pdfGenerator.ts";

const booking: Booking = {
  id: "BK-2026-LAYOUT",
  studioId: "STUDIO-1",
  customerId: "CUSTOMER-1",
  serviceId: "SERVICE-1",
  bookingDate: "2026-10-06",
  timeSlot: "10:00 AM",
  addons: Array.from({ length: 35 }, (_, index) => ({
    addonId: `ADDON-${index + 1}`,
    quantity: 2,
    price: 125
  })),
  customerDetails: {
    fullName: "A very long customer name that needs to wrap neatly across the receipt page",
    email: "customer.with.a.very.long.address@example-photography-booking.test",
    phone: "+63 912 345 6789",
    notes: ""
  },
  status: "Confirmed",
  totalAmount: 10000,
  amountPaid: 2500,
  downPaymentAmount: 2500,
  remainingBalance: 7500,
  paymentStatus: "Partially Paid",
  finalPaymentStatus: "Pending",
  createdAt: "2026-10-05T10:00:00.000Z"
};

const studio: Studio = {
  id: "STUDIO-1",
  name: "A Studio Name That Is Long Enough To Wrap Without Hitting The Status Badge",
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
  address: "A long studio address that should wrap inside the receipt without overlapping other fields, Cainta, Rizal",
  contactInfo: "",
  email: "",
  businessHours: "",
  isApproved: true,
  status: "approved",
  printingAvailable: false,
  createdAt: "2026-01-01T00:00:00.000Z"
};

const payment: Payment = {
  id: "PAYMENT-1",
  bookingId: booking.id,
  studioId: studio.id,
  customerId: booking.customerId,
  amount: 2500,
  paymentType: "Downpayment",
  paymentMethod: "GCash",
  paymentStatus: "Paid",
  referenceNumber: "GCASH-REFERENCE-1234567890-REFERENCE-CONTINUES-WITH-A-LONG-IDENTIFIER",
  paymentDate: "2026-10-05T10:00:00.000Z",
  createdAt: "2026-10-05T10:00:00.000Z"
};

describe("booking receipt PDF layout", () => {
  it("wraps long fields and paginates large item lists", () => {
    const pdf = buildBookingReceiptPDF(booking, studio, payment);

    expect(pdf.getNumberOfPages()).toBeGreaterThan(1);
    expect(pdf.output()).toContain("OFFICIAL DIGITAL RECEIPT");
  });
});
