/**
 * Exhaustive Feature catalog for plan-based entitlements.
 */
export const FEATURE_CATALOG = [
  { key: "booking_online", name: "Online Booking", description: "Allow customers to book appointments via web/app." },
  { key: "booking_walkin", name: "Walk-in Management", description: "Manage on-spot customers and queueing." },
  { key: "digital_campaigns", name: "Digital Campaigns", description: "Send automated and bulk campaigns." },
  { key: "inventory_management", name: "Inventory Management", description: "Track stock levels, consumption, and orders." },
  { key: "payroll_automation", name: "Payroll Automation", description: "Calculate and process staff salaries automatically." },
  { key: "revenue_analytics", name: "Advanced Analytics", description: "Deep financial reports and business intelligence." },
  { key: "customer_crm", name: "Customer CRM", description: "Full client database with visit history and notes." },
  { key: "staff_scheduling", name: "Staff Scheduling", description: "Roster management and shift planning." },
  { key: "loyalty_program", name: "Loyalty Program", description: "Points, rewards, and customer retention tools." },
  { key: "expense_tracking", name: "Expense Tracking", description: "Track business overheads and miscellaneous spending." },
  { key: "multi_branch", name: "Multi-Branch Support", description: "Ability to manage more than one location.", isLimit: true },
  { key: "max_employees", name: "Max Employees", description: "Staff members per branch limit.", isLimit: true },
  { key: "custom_notifications", name: "Custom Notifications", description: "Create and edit custom SMS/WA templates." },
  { key: "ai_assistant", name: "AI Business Assistant", description: "Predictive analytics and automated scheduling." },
] as const;

export type FeatureKey = typeof FEATURE_CATALOG[number]["key"];
