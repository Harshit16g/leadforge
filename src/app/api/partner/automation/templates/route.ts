import { NextResponse } from 'next/server';

export async function GET() {
  const verifiedTemplates = [
    {
      id: 'temp-booking-welcome',
      name: 'Showroom Inbound Intake Greeting',
      channel: 'sms',
      content: 'Welcome to HSR Motors, {{customer_name}}! We are thrilled to assist you. Your assigned advisor {{advisor_name}} will contact you shortly.'
    },
    {
      id: 'temp-hot-sla-warn',
      name: 'Hot Lead SLA Response Warning',
      channel: 'sms',
      content: 'System Alert: Lead {{customer_name}} is untouched! Please trigger immediate callback to maintain SOP targets.'
    },
    {
      id: 'temp-drive-confirm',
      name: 'Hyundai Test Drive Booking Details',
      channel: 'email',
      content: 'Hi {{customer_name}}, your test drive reservation is confirmed! Bring your driving license. See you soon!'
    },
    {
      id: 'temp-whatsapp-congratulations',
      name: 'Premium Customer Converted Deal Note',
      channel: 'whatsapp',
      content: 'Congratulations on purchasing your new Hyundai, {{customer_name}}! Thank you for choosing HSR Motors.'
    }
  ];

  return NextResponse.json({
    success: true,
    data: verifiedTemplates
  }, { status: 200 });
}
