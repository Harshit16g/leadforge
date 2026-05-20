import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const realisticLeads = [
  {
    name: "Arjun Mehta",
    email: "arjun.m@example.com",
    phone: "+91 9876543210",
    source: "facebook",
    status: "new",
    priority: "high",
    health: "hot",
    score: 85,
    notes: "Customer comparing with Seltos. Very interested in Hyundai Creta SX (O) Diesel. Wants to exchange old i20.",
  },
  {
    name: "Priya Saini",
    email: "priya.saini88@gmail.com",
    phone: "+91 8765432109",
    source: "website",
    status: "contacted",
    priority: "medium",
    health: "warm",
    score: 65,
    notes: "Needs automatic diesel under ₹18L. Looked at Venue N-Line online.",
  },
  {
    name: "Rohit Khanna",
    email: "rkhanna.tech@company.in",
    phone: "+91 7654321098",
    source: "google",
    status: "new",
    priority: "low",
    health: "cold",
    score: 90, // High score but untouched = overdue
    notes: "Requested quote for Tucson Platinum. Mentioned corporate lease option. (Overdue SLA)",
  },
  {
    name: "Ananya Desai",
    email: "ananya.d@studio.in",
    phone: "+91 6543210987",
    source: "offline",
    status: "negotiation",
    priority: "high",
    health: "hot",
    score: 75,
    notes: "Walk-in. Loved the i20 N-Line. Discussing financing options via HDFC.",
  },
  {
    name: "Suresh Reddy",
    email: "suresh.reddy@logistics.co",
    phone: "+91 9988776655",
    source: "google",
    status: "qualified",
    priority: "medium",
    health: "warm",
    score: 55,
    notes: "Fleet purchase inquiry. Looking for 3x Aura SX CNG. Sent initial bulk pricing.",
  },
  {
    name: "Kavita Iyer",
    email: "kiyer@personal.com",
    phone: "+91 8877665544",
    source: "facebook",
    status: "converted",
    priority: "high",
    health: "hot",
    score: 95,
    notes: "Purchased Creta EX. Delivery scheduled for next week.",
  },
  {
    name: "Mohammad Tariq",
    email: "m.tariq@biz.in",
    phone: "+91 7766554433",
    source: "referral",
    status: "lost",
    priority: "medium",
    health: "cold",
    score: 20,
    notes: "Bought Kia Seltos instead due to better immediate availability.",
  }
];

async function seed() {
  console.log("Wiping existing data...");
  const { error: delError } = await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
  if (delError) {
    console.error("Failed to wipe:", delError);
    return;
  }

  console.log("Inserting realistic leads...");
  const { data, error } = await supabase.from('leads').insert(realisticLeads).select();
  
  if (error) {
    console.error("Failed to insert:", error);
    return;
  }

  console.log(`Successfully seeded ${data.length} realistic leads.`);

  // Insert a few interactions for Arjun Mehta (First lead)
  if (data && data.length > 0) {
    const arjun = data.find(d => d.name === "Arjun Mehta");
    if (arjun) {
      await supabase.from('interactions').insert([
        { lead_id: arjun.id, type: 'call', content: "Initial call. Customer wants to trade in 2018 i20. Highly inclined towards Creta SX(O) Diesel. Wants valuation tomorrow." },
        { lead_id: arjun.id, type: 'note', content: "Sent brochure on WhatsApp." }
      ]);
      console.log("Added interactions for Arjun Mehta.");
    }
  }
}

seed();
