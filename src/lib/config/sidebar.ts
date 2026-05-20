import { SidebarConfig } from "@/components/layout/DashboardSidebar";

export const adminSidebarConfig: SidebarConfig = {
  brand: {
    name: "Leaex Admin",
    subtitle: "Platform Management",
    href: "/admin/dashboard",
  },
  groups: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/admin/dashboard", icon: "icon-[solar--widget-2-linear]" },
        { title: "Partners", url: "/admin/partners", icon: "icon-[solar--users-group-two-rounded-linear]" },
        { title: "Customers", url: "/admin/customers", icon: "icon-[solar--user-linear]" },
      ],
    },
    {
      label: "Business",
      items: [
        { title: "Revenue", url: "/admin/revenue", icon: "icon-[solar--dollar-minimalistic-linear]" },
        { title: "Sessions Report", url: "/admin/bookings-report", icon: "icon-[solar--calendar-linear]" },
        { title: "Plans", url: "/admin/plans", icon: "icon-[solar--document-text-linear]" },
        { title: "Features", url: "/admin/plans/features", icon: "icon-[solar--layers-linear]" },
        { title: "Trials", url: "/admin/trials", icon: "icon-[solar--stopwatch-linear]" },
      ],
    },
    {
      label: "Operations",
      items: [
        { title: "Partner Pipeline", url: "/admin/operations", icon: "icon-[solar--route-linear]" },
        { title: "Communications", url: "/admin/communications", icon: "icon-[solar--chat-round-dots-linear]" },
        { title: "Notifications", url: "/admin/notifications", icon: "icon-[solar--bell-linear]" },
        { title: "Escalations", url: "/admin/escalations", icon: "icon-[solar--danger-triangle-linear]" },
        { title: "IAM", url: "/admin/iam", icon: "icon-[solar--shield-user-linear]" },
      ],
    },
    {
      label: "System",
      items: [
        { title: "Audit Log", url: "/admin/audit-log", icon: "icon-[solar--history-linear]" },
        { title: "Settings", url: "/admin/settings", icon: "icon-[solar--settings-linear]" },
      ],
    },
  ],
};

export const partnerSidebarConfig: SidebarConfig = {
  brand: {
    name: "Leaex Partner",
    subtitle: "Business Manager",
    href: "/partner/dashboard",
  },
  groups: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/partner/dashboard", icon: "icon-[solar--widget-2-linear]" },
        { title: "Walk-in", url: "/partner/walkin", icon: "icon-[solar--hiking-bold]" },
      ],
    },
    {
      label: "Sessions",
      items: [
        { title: "Sessions", url: "/partner/bookings", icon: "icon-[solar--calendar-linear]" },
        { title: "Schedule", url: "/partner/scheduler", icon: "icon-[solar--calendar-mark-linear]" },
        { title: "Day Closing", url: "/partner/day-closing", icon: "icon-[solar--sun-2-linear]" },
      ],
    },
    {
      label: "CRM",
      items: [
        { title: "Customers", url: "/partner/customers", icon: "icon-[solar--users-group-two-rounded-linear]" },
        { title: "Messages", url: "/partner/messages", icon: "icon-[solar--chat-round-dots-linear]" },
        { title: "Contact Requests", url: "/partner/contact-requests", icon: "icon-[solar--phone-linear]" },
        { title: "Reviews", url: "/partner/reviews", icon: "icon-[solar--star-linear]" },
      ],
    },
    {
      label: "Business",
      items: [
        { title: "Revenue", url: "/partner/revenue", icon: "icon-[solar--graph-up-linear]" },
        { title: "Payments", url: "/partner/payments", icon: "icon-[solar--card-linear]" },
        { title: "Payroll", url: "/partner/payroll", icon: "icon-[solar--wallet-money-linear]", featureKey: "payroll_automation" },
        { title: "Expenses", url: "/partner/expenses", icon: "icon-[solar--wallet-linear]" },
        { title: "Services", url: "/partner/services", icon: "icon-[solar--scissors-linear]" },
      ],
    },
    {
      label: "Organisation",
      items: [
        { title: "Organisation", url: "/partner/organisation", icon: "icon-[solar--buildings-2-linear]" },
        { title: "Branches", url: "/partner/branches", icon: "icon-[solar--shop-linear]", featureKey: "max_branches" },
        { title: "Employees", url: "/partner/employees", icon: "icon-[solar--users-group-rounded-linear]", featureKey: "max_employees" },
        { title: "Staff Requests", url: "/partner/staff-requests", icon: "icon-[solar--inbox-linear]" },
        { title: "Inventory", url: "/partner/inventory", icon: "icon-[solar--box-linear]", featureKey: "inventory_management" },
      ],
    },
    {
      label: "Marketing",
      items: [
        { title: "Campaigns", url: "/partner/campaigns", icon: "icon-[solar--volume-loud-bold-duotone]" },
        { title: "Automation", url: "/partner/automation", icon: "icon-[solar--history-line-duotone]" },
        { title: "Marketing", url: "/partner/marketing", icon: "icon-[solar--chart-2-bold]" },
        { title: "QR Code", url: "/partner/qr-code", icon: "icon-[solar--qr-code-bold-duotone]" },
      ],
    },
    {
      label: "More",
      items: [
        { title: "AI Assistant", url: "/partner/ai-assistant", icon: "icon-[solar--stars-minimalistic-linear]" },
        { title: "Integrations", url: "/partner/integrations", icon: "icon-[solar--link-round-linear]" },
        { title: "Settings", url: "/partner/settings", icon: "icon-[solar--settings-linear]" },
        { title: "Help", url: "/partner/help", icon: "icon-[solar--question-circle-linear]" },
      ],
    },
  ],
};
