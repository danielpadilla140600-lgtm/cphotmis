import { jsPDF } from "jspdf";
import { Booking, Payment, Studio, PrintOrder } from "../db/types";

/**
 * Builds an Official Booking Receipt PDF document.
 */
export function buildBookingReceiptPDF(
  booking: Booking,
  studio?: Studio,
  payment?: Payment
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 4.5;
  const bottomLimit = pageHeight - 18;
  let y = 0;

  const drawHeader = () => {
    const studioName = doc.splitTextToSize(
      studio?.name || "CAINTA PHOTOGRAPHY STUDIO",
      pageWidth - 88
    );
    const headerHeight = Math.max(30, 10 + studioName.length * 5);

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, headerHeight, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(studioName, margin, 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Official Booking Confirmation & Acknowledgement Receipt", margin, headerHeight - 9);
    doc.text("Cainta Studio Management Information System (MIS)", margin, headerHeight - 4);

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(pageWidth - 65, 8, 51, 12, 2, 2, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    const statusLines = doc.splitTextToSize(`STATUS: ${booking.status.toUpperCase()}`, 45);
    doc.text(statusLines.slice(0, 2), pageWidth - 62, statusLines.length > 1 ? 12 : 15);
    return headerHeight;
  };

  const startPage = () => {
    doc.addPage();
    y = drawHeader() + 8;
  };

  const ensureSpace = (height: number) => {
    if (y + height > bottomLimit) startPage();
  };

  const drawSection = (title: string) => {
    ensureSpace(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(title.toUpperCase(), margin, y);
    y += 3;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  const drawField = (label: string, value: string | number | undefined | null) => {
    const labelWidth = 39;
    const text = String(value ?? "—").trim() || "—";
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(text, contentWidth - labelWidth - 2);
    const rowHeight = Math.max(5, lines.length * lineHeight);
    ensureSpace(rowHeight + 1);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(lines, margin + labelWidth, y);
    y += rowHeight + 1;
  };

  const drawItemsHeader = () => {
    ensureSpace(12);
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentWidth, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text("Description / Package Item", margin + 4, y + 5.5);
    doc.text("Qty", 134, y + 5.5, { align: "right" });
    doc.text("Amount (PHP)", pageWidth - margin - 3, y + 5.5, { align: "right" });
    y += 10;
  };

  const drawItem = (description: string, quantity: number | string, amount: number) => {
    const descriptionLines = doc.splitTextToSize(description, 92);
    const rowHeight = Math.max(6, descriptionLines.length * lineHeight);
    if (y + rowHeight + 2 > bottomLimit) {
      y = drawHeader() + 8;
      drawItemsHeader();
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(descriptionLines, margin + 4, y);
    doc.text(String(quantity), 134, y, { align: "right" });
    doc.text(`PHP ${amount.toLocaleString()}`, pageWidth - margin - 3, y, { align: "right" });
    y += rowHeight + 2;
  };

  startPage();
  drawSection("Booking Details");
  drawField("Booking Reference", booking.id);
  drawField("Shoot Date", booking.bookingDate);
  drawField("Time Slot", booking.timeSlot);
  drawField("Booking Status", booking.status);
  drawField("Payment Status", booking.paymentStatus);

  drawSection("Customer Details");
  drawField("Customer Name", booking.customerDetails?.fullName);
  drawField("Email Address", booking.customerDetails?.email);
  drawField("Contact Number", booking.customerDetails?.phone || "N/A");

  drawSection("Studio Details");
  drawField("Studio", studio?.name || "CAINTA PHOTOGRAPHY STUDIO");
  drawField("Studio Location", studio?.address || "Cainta, Rizal");

  drawSection("Itemized Pricing");
  drawItemsHeader();
  const addonTotal = booking.addons?.reduce((sum, addon) => sum + addon.price * addon.quantity, 0) || 0;
  drawItem("Photography Shoot Package", 1, booking.totalAmount - addonTotal);
  booking.addons?.forEach((addon, index) => {
    drawItem(`Addon Service #${index + 1}`, addon.quantity, addon.price * addon.quantity);
  });

  ensureSpace(26);
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  const rightXLabel = pageWidth - 82;
  const rightXValue = pageWidth - margin;
  const drawTotal = (label: string, amount: number, bold: boolean, color: [number, number, number]) => {
    ensureSpace(7);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(9);
    doc.setTextColor(...color);
    doc.text(label, rightXLabel, y);
    doc.text(`PHP ${amount.toLocaleString()}`, rightXValue, y, { align: "right" });
    y += 6;
  };

  drawTotal("Total Package Price:", booking.totalAmount, true, [15, 23, 42]);
  drawTotal("Amount Paid / Downpayment:", booking.amountPaid || 0, false, [15, 23, 42]);
  const remainingBalance = Math.max(0, booking.totalAmount - (booking.amountPaid || 0));
  drawTotal("Remaining Balance:", remainingBalance, true, remainingBalance > 0 ? [180, 83, 9] : [22, 101, 52]);

  if (payment?.referenceNumber) {
    drawSection("Payment Verification Record");
    drawField("Payment Method", payment.paymentMethod);
    drawField("Reference Number", payment.referenceNumber);
    drawField("Payment Date", new Date(payment.paymentDate).toLocaleDateString());
  }

  drawSection("Terms & Conditions");
  [
    "1. Please arrive at least 10 minutes prior to your scheduled time slot.",
    "2. Rescheduling is permitted at least 48 hours prior to the photoshoot date.",
    "3. Remaining balance shall be settled on the day of the photoshoot at the studio counter."
  ].forEach((term) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(term, contentWidth);
    const height = lines.length * lineHeight;
    ensureSpace(height + 1);
    doc.setTextColor(100, 116, 139);
    doc.text(lines, margin, y);
    y += height + 1;
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `CAINTA PHOTOGRAPHY STUDIO MIS - OFFICIAL DIGITAL RECEIPT | Page ${page} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }

  return doc;
}

export function generateBookingReceiptPDF(
  booking: Booking,
  studio?: Studio,
  payment?: Payment
) {
  const doc = buildBookingReceiptPDF(booking, studio, payment);
  doc.save(`Receipt_${booking.id}_CaintaMIS.pdf`);
}

/**
 * Builds a print-order receipt PDF that customers can download after placing a custom print request.
 */
export function buildPrintOrderReceiptPDF(
  order: PrintOrder,
  studio?: Studio,
  product?: { name?: string; size?: string; description?: string; price?: number }
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CUSTOM PRINT ORDER RECEIPT", 14, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(studio?.name || "Cainta Photography Studio", 14, 23);
  doc.text(`Order ID: ${order.id}`, pageWidth - 46, 23, { align: "right" });

  let y = 40;
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text("ORDER INFORMATION", 14, y);
  y += 6;
  doc.setLineWidth(0.3);
  doc.setDrawColor(203, 213, 225);
  doc.line(14, y, pageWidth - 14, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Studio:", 14, y); doc.setFont("helvetica", "normal"); doc.text(studio?.name || "N/A", 48, y);
  y += 7;
  doc.setFont("helvetica", "bold"); doc.text("Product:", 14, y); doc.setFont("helvetica", "normal"); doc.text(product?.name || "Custom Print", 48, y);
  y += 7;
  doc.setFont("helvetica", "bold"); doc.text("Size:", 14, y); doc.setFont("helvetica", "normal"); doc.text(product?.size || "N/A", 48, y);
  y += 7;
  doc.setFont("helvetica", "bold"); doc.text("Quantity:", 14, y); doc.setFont("helvetica", "normal"); doc.text(String(order.quantity), 48, y);
  y += 7;
  doc.setFont("helvetica", "bold"); doc.text("Order Status:", 14, y); doc.setFont("helvetica", "normal"); doc.text(order.status, 48, y);
  y += 7;
  doc.setFont("helvetica", "bold"); doc.text("Payment Status:", 14, y); doc.setFont("helvetica", "normal"); doc.text(order.paymentStatus, 48, y);
  y += 7;
  doc.setFont("helvetica", "bold"); doc.text("Payment Method:", 14, y); doc.setFont("helvetica", "normal"); doc.text(order.paymentMethod || "Cash (Pay on Pickup)", 48, y);
  y += 7;
  doc.setFont("helvetica", "bold"); doc.text("Reference No:", 14, y); doc.setFont("helvetica", "normal"); doc.text(order.referenceNumber || "N/A", 48, y);
  y += 7;
  doc.setFont("helvetica", "bold"); doc.text("Order Date:", 14, y); doc.setFont("helvetica", "normal"); doc.text(new Date(order.createdAt).toLocaleString(), 48, y);
  y += 7;

  doc.setFont("helvetica", "bold"); doc.text("Pickup:", 14, y); doc.setFont("helvetica", "normal"); doc.text("Studio pickup", 48, y);
 
  y += 16;
  doc.setFillColor(248, 250, 252);
  doc.rect(14, y, pageWidth - 28, 24, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("TOTAL AMOUNT", 18, y + 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(`PHP ${order.totalAmount.toLocaleString()}`, pageWidth - 18, y + 8, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Paid via ${order.paymentMethod || "Cash"} \u2022 ${order.paymentStatus}`, 18, y + 18);

  y += 36;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text("Thank you for ordering with Cainta Photography Studio. Your artwork will be processed and updated in the order tracker.", 14, y, { maxWidth: pageWidth - 28 });

  return doc;
}

export function generatePrintOrderReceiptPDF(
  order: PrintOrder,
  studio?: Studio,
  product?: { name?: string; size?: string; description?: string; price?: number }
) {
  const doc = buildPrintOrderReceiptPDF(order, studio, product);
  doc.save(`Print_Order_${order.id}_Receipt.pdf`);
}

/**
 * Generates a Studio Financial & Sales Analytics PDF Report
 */
export function buildStudioSalesReportPDF(
  studio: Studio,
  bookings: Booking[],
  printOrders: PrintOrder[],
  dateRangeLabel: string = "All-Time Financial Ledger"
) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const activeBookings = bookings.filter(booking => booking.status !== "Cancelled" && booking.status !== "Rejected");
  const activePrintOrders = printOrders.filter(order => order.status !== "Cancelled");

  const reportTitleLines = doc.splitTextToSize(`${studio.name.toUpperCase()} - FINANCIAL REPORT`, pageWidth - 28);
  const scopeLines = doc.splitTextToSize(`Scope: ${dateRangeLabel} | Generated on: ${new Date().toLocaleString()}`, pageWidth - 28);
  const locationLines = doc.splitTextToSize(`Studio Location: ${studio.address || "—"}`, pageWidth - 28);
  const headerHeight = Math.max(38, 10 + reportTitleLines.length * 6 + scopeLines.length * 4 + locationLines.length * 4);
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, headerHeight, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(reportTitleLines, 14, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const headerTextY = 12 + reportTitleLines.length * 6;
  doc.text(scopeLines, 14, headerTextY);
  doc.text(locationLines, 14, headerTextY + scopeLines.length * 4);

  let y = headerHeight + 10;
  const totalBookingRevenue = activeBookings.reduce((sum, booking) => sum + Number(booking.amountPaid || 0), 0);
  const totalPrintRevenue = activePrintOrders.filter(order => order.paymentStatus === "Paid")
    .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const totalRevenue = totalBookingRevenue + totalPrintRevenue;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 55, 20, 2, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("TOTAL REVENUE", 18, y + 6);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`PHP ${totalRevenue.toLocaleString()}`, 18, y + 14);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(75, y, 55, 20, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("ACTIVE BOOKINGS", 79, y + 6);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${activeBookings.length} Records`, 79, y + 14);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(136, y, 55, 20, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("PRINTING ORDERS", 140, y + 6);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${activePrintOrders.length} Orders`, 140, y + 14);

  y += 30;

  const drawTableHeader = (title: string, headers: string[], widths: number[], continued = false) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(continued ? `${title} (continued)` : title, margin, y);
    y += 6;
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, pageWidth - margin * 2, 8, "F");
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    let x = margin + 2;
    headers.forEach((header, index) => {
      doc.text(header, x, y + 5.5);
      x += widths[index];
    });
    y += 10;
  };

  const wrapCellText = (value: string, maxWidth: number): string[] => {
    const wrappedLines: string[] = [];
    const paragraphs = String(value || "—").split("\n");

    paragraphs.forEach(paragraph => {
      const words = paragraph.split(/\s+/).filter(Boolean);
      let line = "";

      words.forEach(word => {
        if (doc.getTextWidth(word) > maxWidth) {
          if (line) {
            wrappedLines.push(line);
            line = "";
          }

          let chunk = "";
          for (const character of word) {
            if (chunk && doc.getTextWidth(chunk + character) > maxWidth) {
              wrappedLines.push(chunk);
              chunk = character;
            } else {
              chunk += character;
            }
          }
          line = chunk;
          return;
        }

        const candidate = line ? `${line} ${word}` : word;
        if (doc.getTextWidth(candidate) > maxWidth) {
          if (line) wrappedLines.push(line);
          line = word;
        } else {
          line = candidate;
        }
      });

      if (line) wrappedLines.push(line);
      if (words.length === 0) wrappedLines.push("");
    });

    return wrappedLines.length > 0 ? wrappedLines : ["—"];
  };

  const drawRows = (title: string, headers: string[], widths: number[], rows: string[][]) => {
    drawTableHeader(title, headers, widths);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);

    if (rows.length === 0) {
      doc.setTextColor(100, 116, 139);
      doc.text("No records available.", margin + 2, y + 4);
      y += 10;
      return;
    }

    rows.forEach(row => {
      const cellLines = row.map((value, index) =>
        wrapCellText(String(value || "—"), widths[index] - 4)
      );
      const maxCellLineCount = Math.max(...cellLines.map(lines => lines.length));
      let lineOffset = 0;

      while (lineOffset < maxCellLineCount) {
        const availableLines = Math.floor((pageHeight - 18 - y - 4) / 3.6);
        if (availableLines < 1) {
          doc.addPage();
          y = 18;
          drawTableHeader(title, headers, widths, true);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(15, 23, 42);
          continue;
        }

        const lineCount = Math.min(maxCellLineCount - lineOffset, availableLines);
        let x = margin + 2;
        cellLines.forEach((lines, index) => {
          const visibleLines = lines.slice(lineOffset, lineOffset + lineCount);
          if (visibleLines.length > 0) {
            doc.text(visibleLines, x, y + 4);
          }
          x += widths[index];
        });

        y += Math.max(8, lineCount * 3.6 + 4);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(margin, y, pageWidth - margin, y);
        lineOffset += lineCount;
      }
    });
    y += 10;
  };

  const tableWidths = [34, 55, 92, 40, 43];
  drawRows("Bookings Revenue Ledger", ["Booking ID", "Customer / Contact", "Schedule / Service / Add-ons", "Status / Payment", "Paid / Balance / Total"], tableWidths,
    bookings.map(booking => {
      const details = booking as Booking & {
        serviceName?: string;
        packageName?: string;
        addonReportDetails?: string;
        paymentMethods?: string;
        paymentReferences?: string;
      };
      const balance = Number(booking.remainingBalance ?? Math.max(Number(booking.totalAmount || 0) - Number(booking.amountPaid || 0), 0));
      return [
      booking.id,
      `${booking.customerDetails?.fullName || "—"}\n${booking.customerDetails?.email || "—"}\n${booking.customerDetails?.phone || "—"}`,
      `${booking.bookingDate || "—"} ${booking.timeSlot || ""}\nService: ${details.serviceName || booking.serviceId || "—"}\nPackage: ${details.packageName || booking.packageId || "—"}\nAdd-ons: ${details.addonReportDetails || "None"}`,
      `${booking.status}\n${booking.paymentStatus || "Unpaid"}\n${details.paymentMethods || booking.paymentOption || "—"}\nRef: ${details.paymentReferences || "—"}`,
      `Paid: PHP ${Number(booking.amountPaid || 0).toLocaleString()}\nBalance: PHP ${balance.toLocaleString()}\nTotal: PHP ${Number(booking.totalAmount || 0).toLocaleString()}`,
      ];
    }));

  drawRows("Print Orders Ledger", ["Order ID", "Customer / ID", "Product / Design / Cash Details", "Status / Payment", "Paid / Balance / Total"], tableWidths,
    printOrders.map(order => {
      const details = order as PrintOrder & { productName?: string; productSize?: string };
      const paidAmount = order.paymentStatus === "Paid" ? Number(order.totalAmount || 0) : 0;
      const balance = Math.max(Number(order.totalAmount || 0) - paidAmount, 0);
      const printDesign = order.printDesign
        ? Object.entries(order.printDesign).map(([key, value]) => `${key}: ${value}`).join(", ")
        : "Standard design";
      return [
        order.id,
        `${(order as any).customerName || order.customerId || "Walk-in"}\nCustomer ID: ${order.customerId || "—"}`,
        `Product: ${details.productName || order.productId || "Photo Print"} (${details.productSize || "—"})\nQty: ${order.quantity}\nDesign: ${printDesign}\nOrdered: ${order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}\nPaid: ${order.paidAt ? new Date(order.paidAt).toLocaleString() : "—"}\nCash received by: ${order.cashReceivedBy || "—"}\nTendered: PHP ${Number(order.cashTendered || 0).toLocaleString()} | Change: PHP ${Number(order.changeAmount || 0).toLocaleString()}`,
        `${order.status}\n${order.paymentStatus}\n${order.paymentMethod || "Cash"}\nRef: ${order.referenceNumber || "—"}`,
        `Paid: PHP ${paidAmount.toLocaleString()}\nBalance: PHP ${balance.toLocaleString()}\nTotal: PHP ${Number(order.totalAmount || 0).toLocaleString()}`,
      ];
    }));

  if (y + 20 > pageHeight - 14) {
    doc.addPage();
    y = 24;
  }
  doc.setLineWidth(0.3);
  doc.setDrawColor(203, 213, 225);
  doc.line(14, y, 70, y);
  doc.line(pageWidth - 70, y, pageWidth - 14, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Prepared By: Studio Administrator", 14, y);
  doc.text("Approved By: Cainta MIS Super Admin", pageWidth - 70, y);

  return doc;
}

export function generateStudioSalesReportPDF(
  studio: Studio,
  bookings: Booking[],
  printOrders: PrintOrder[],
  dateRangeLabel: string = "All-Time Financial Ledger"
) {
  const doc = buildStudioSalesReportPDF(studio, bookings, printOrders, dateRangeLabel);
  doc.save(`${studio.name.replace(/[^a-z0-9]/gi, "_")}_Financial_Report.pdf`);
}
