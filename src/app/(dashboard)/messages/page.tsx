import { MessagingHub } from "@/components/messaging/MessagingHub";

/**
 * [AUDIT] Partner Unified Messaging Hub
 */

export default function PartnerMessagesPage() {
  return (
    <div className="flex flex-col flex-1 h-full max-h-full overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col h-full max-h-full overflow-hidden">
        <MessagingHub />
      </div>
    </div>
  );
}
