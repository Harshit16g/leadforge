import { logAudit } from "@/lib/audit";
// ─── MSG91 SMS Service ───────────────────────────────────────────────────────
// Centralized service for all MSG91 template-based messaging.
// Uses the Flow API (https://control.msg91.com/api/v5/flow/)
// All templates are DLT-verified and mapped with their variable keys.
// ─────────────────────────────────────────────────────────────────────────────

const MSG91_API_KEY = process.env.MSG_91_API_KEY || process.env.MSG_AUTH_KEY || "";
const MSG91_FLOW_URL = process.env.SEND_MESSAGE_URL || "https://control.msg91.com/api/v5/flow";

// ─── Template Registry ───────────────────────────────────────────────────────
// Each template has an ID and variable mapping documentation.
// Variables use ##var1##, ##var2## etc. or named keys like ##salonname##

export const MSG91_TEMPLATES = {
  // ── OTP ──
  OTP: {
    id: "679a6747d6fc051a447a8733",
    description: "OTP verification for Leaex account",
    // var1 = customer name, var2 = OTP code
  },

  // ── Booking ──
  BOOKING_CONFIRMATION: {
    id: "67b44b74d6fc0513d76164c3",
    description: "Booking confirmation for customer",
    // var1 = business name, var2 = date/time, var3 = manage link
  },
  APPOINTMENT_CONFIRMATION_DLT: {
    id: "67c033fcd6fc0560a80023c3",
    description: "Appointment confirmed (DLT verified)",
    // businessname = business name, dateandtime = date/time, businesscontactnumber = phone
  },
  APPOINTMENT_REMINDER: {
    id: "67b44d61d6fc052adb0447a2",
    description: "Appointment reminder for customer",
    // businessspa = business name, dateandtime = date/time
  },

  // ── Rescheduling ──
  USER_RESCHEDULED: {
    id: "679a6880d6fc0510625e9483",
    description: "Notify customer their appointment was rescheduled",
    // var1 = customer name, var2 = business name, var3 = new date/time
  },
  RESCHEDULE_NOTIFICATION_DLT: {
    id: "67de3bb5d6fc052f5e743152",
    description: "Reschedule notification (DLT verified)",
    // salonspa = salon name, dateandtime = new date/time
  },
  PARTNER_RESCHEDULE_NOTIFICATION: {
    id: "67b5cd4bd6fc056036526f52",
    description: "Notify partner about customer reschedule",
    // var = customer name, new_dateandtime, old_dateandtime
  },

  // ── Reminders ──
  REMINDER_DLT: {
    id: "69044c490bd6242b9852f0d2",
    description: "Revisit reminder (DLT verified)",
    // salonname = salon name, link = booking link
  },
  REMINDER_APPROVED: {
    id: "679a68bdd6fc0512fa6d5b83",
    description: "Reminder for upcoming appointment",
    // var1 = salon name, var2 = date/time, var3 = contact
  },

  // ── Partner Notifications ──
  PARTNER_NEW_BOOKING: {
    id: "67b45115d6fc0530455b2002",
    description: "Notify partner of new booking",
    // name = customer name, dateandtime, service
  },
  PARTNER_NEW_BOOKING_APPROVED: {
    id: "679a69bad6fc054eaa1efde2",
    description: "New booking notification (approved by MSG91)",
    // var1 = partner name, var2 = customer name, var3 = date/time, var4 = services, var5 = manage link
  },
  PARTNER_ONBOARDING: {
    id: "67b453b1d6fc052fba779083",
    description: "Partner onboarding success",
    // name = partner name, link = dashboard link
  },
  PARTNER_ONBOARDING_DASHBOARD: {
    id: "67b452a8d6fc053357680f32",
    description: "Partner onboarding with dashboard link",
    // name = partner name, dashboardlink = dashboard URL
  },
  PARTNER_PERFORMANCE_REPORT: {
    id: "67b5d323d6fc050ef93ab023",
    description: "Monthly partner performance report",
    // TotalAppointments, completed, earning
  },

  // ── Offers & Discounts ──
  OFFER_DLT: {
    id: "6903505bcf4877147e1b9b62",
    description: "Offer notification (DLT verified)",
    // salon_name, offer, appoinment_link
  },
  OFFER_VERIFIED: {
    id: "6904585c1fa9965a4232a5c4",
    description: "Offer notification (DLT verified v2)",
    // var1 = salon name, var2 = offer details, var3 = booking link
  },
  DISCOUNT_DLT: {
    id: "69044c88e651c924b63c7283",
    description: "40% discount offer (DLT verified)",
    // var1 = salon name, var2 = booking link
  },

  // ── Follow-up ──
  VISIT_FOLLOWUP: {
    id: "68abfaf12e27c627fd2852a2",
    description: "Post-visit follow-up with invoice",
    // name = business name, invoicelink = invoice URL, link = booking link
  },
} as const;

export type TemplateKey = keyof typeof MSG91_TEMPLATES;

// ─── Core Send Function ──────────────────────────────────────────────────────

interface SendSmsOptions {
  /** Mobile number with country code, no + prefix (e.g. "919876543210") */
  mobile: string;
  /** Template key from MSG91_TEMPLATES */
  template: TemplateKey;
  /** Template variables as key-value pairs */
  variables: Record<string, string>;
}

interface Msg91Response {
  type: "success" | "error";
  message?: string;
  request_id?: string;
}

/**
 * Send an SMS via MSG91 Flow API.
 * This is the core function — all template-specific helpers call this.
 */
export async function sendSms(
  opts: SendSmsOptions,
  orgId?: string,
  actorId?: string
): Promise<Msg91Response> {
  const template = MSG91_TEMPLATES[opts.template];
  if (!template) {
    console.error(`[MSG91] Unknown template: ${opts.template}`);
    return { type: "error", message: `Unknown template: ${opts.template}` };
  }

  if (!MSG91_API_KEY) {
    console.error("[MSG91] API key not configured (MSG_91_API_KEY)");
    return { type: "error", message: "MSG91 API key not configured" };
  }

  const body = {
    template_id: template.id,
    short_url: "0",
    recipients: [
      {
        mobiles: opts.mobile,
        ...opts.variables,
      },
    ],
  };

  try {
    const res = await fetch(MSG91_FLOW_URL, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "authkey": MSG91_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json() as Msg91Response;

    if (process.env.DEBUG === "true") {
      console.log(`[MSG91] ${opts.template} → ${res.status}`, data);
    }

    // Log audit trail for external communication
    if (orgId && data.type === "success") {
      await logAudit(
        orgId,
        actorId || "00000000-0000-0000-0000-000000000000",
        "external.sms_sent",
        "sms_message",
        data.request_id || "pending",
        { 
          recipient: opts.mobile, 
          template: opts.template,
          variables: opts.variables
        }
      );
    }

    return data;
  } catch (err) {
    console.error(`[MSG91] Network error for ${opts.template}:`, err);
    return { type: "error", message: "Network error" };
  }
}

// ─── Convenience Helpers ─────────────────────────────────────────────────────

/** Send OTP verification code to a customer */
export async function sendOtp(mobile: string, customerName: string, otp: string) {
  return sendSms({
    mobile,
    template: "OTP",
    variables: { var1: customerName, var2: otp },
  });
}

/** Send booking confirmation to a customer */
export async function sendBookingConfirmation(
  mobile: string,
  businessName: string,
  dateTime: string,
  manageLink: string,
) {
  return sendSms({
    mobile,
    template: "BOOKING_CONFIRMATION",
    variables: { var1: businessName, var2: dateTime, var3: manageLink },
  });
}

/** Send appointment confirmation with contact number (DLT template) */
export async function sendAppointmentConfirmation(
  mobile: string,
  businessName: string,
  dateTime: string,
  contactNumber: string,
) {
  return sendSms({
    mobile,
    template: "APPOINTMENT_CONFIRMATION_DLT",
    variables: { salonname: businessName, dateandtime: dateTime, saloncontactnumber: contactNumber },
  });
}

/** Send appointment reminder */
export async function sendAppointmentReminder(mobile: string, businessName: string, dateTime: string) {
  return sendSms({
    mobile,
    template: "APPOINTMENT_REMINDER",
    variables: { salonspa: businessName, dateandtime: dateTime },
  });
}

/** Send reschedule notification to customer */
export async function sendRescheduleNotification(
  mobile: string,
  customerName: string,
  businessName: string,
  newDateTime: string,
) {
  return sendSms({
    mobile,
    template: "USER_RESCHEDULED",
    variables: { var1: customerName, var2: businessName, var3: newDateTime },
  });
}

/** Notify partner about new booking */
export async function notifyPartnerNewBooking(
  mobile: string,
  customerName: string,
  dateTime: string,
  service: string,
) {
  return sendSms({
    mobile,
    template: "PARTNER_NEW_BOOKING",
    variables: { name: customerName, dateandtime: dateTime, service },
  });
}

/** Send partner onboarding confirmation */
export async function sendPartnerOnboarding(mobile: string, partnerName: string, dashboardLink: string) {
  return sendSms({
    mobile,
    template: "PARTNER_ONBOARDING",
    variables: { name: partnerName, link: dashboardLink },
  });
}

/** Send partner performance report */
export async function sendPerformanceReport(
  mobile: string,
  totalAppointments: string,
  completed: string,
  earnings: string,
) {
  return sendSms({
    mobile,
    template: "PARTNER_PERFORMANCE_REPORT",
    variables: { TotalAppointments: totalAppointments, completed, earning: earnings },
  });
}

/** Send offer notification */
export async function sendOffer(mobile: string, salonName: string, offer: string, bookingLink: string) {
  return sendSms({
    mobile,
    template: "OFFER_VERIFIED",
    variables: { var1: salonName, var2: offer, var3: bookingLink },
  });
}

/** Send discount notification */
export async function sendDiscount(mobile: string, salonName: string, bookingLink: string) {
  return sendSms({
    mobile,
    template: "DISCOUNT_DLT",
    variables: { var1: salonName, var2: bookingLink },
  });
}

/** Send revisit reminder */
export async function sendRevisitReminder(mobile: string, salonName: string, bookingLink: string) {
  return sendSms({
    mobile,
    template: "REMINDER_DLT",
    variables: { salonname: salonName, link: bookingLink },
  });
}

/** Send post-visit follow-up with invoice */
export async function sendVisitFollowup(
  mobile: string,
  businessName: string,
  invoiceLink: string,
  bookingLink: string,
) {
  return sendSms({
    mobile,
    template: "VISIT_FOLLOWUP",
    variables: { name: businessName, invoicelink: invoiceLink, link: bookingLink },
  });
}
