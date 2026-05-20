import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "scratch/internal_messages.json");

// Ensure scratch directory exists
function ensureDb() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ threads: [], messages: [] }, null, 2));
  }
}

export interface Thread {
  id: string;
  type: 'booking' | 'contact_request' | 'internal' | 'admin_support';
  lastMessage: string;
  updatedAt: string;
  metadata: {
    title: string;
    booking_id?: string;
    contact_request_id?: string;
    recipient_id?: string;
  };
}

export interface Message {
  id: string;
  thread_id: string;
  body: string;
  sender_role: string;
  sender_id?: string;
  direction: 'inbound' | 'outbound';
  created_at: string;
}

export function getMessagesDb() {
  ensureDb();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return { threads: [], messages: [] };
  }
}

export function saveMessagesDb(data: { threads: Thread[]; messages: Message[] }) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Fetch all threads
export function getThreads(): Thread[] {
  const db = getMessagesDb();
  return db.threads.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

// Fetch messages for a thread
export function getThreadMessages(threadId: string): Message[] {
  const db = getMessagesDb();
  return db.messages.filter((m: any) => m.thread_id === threadId).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

// Add a new message (and upsert thread)
export function addInternalMessage({
  senderId,
  senderRole,
  recipientId,
  recipientName,
  body,
  threadType = "internal"
}: {
  senderId: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  body: string;
  threadType?: 'internal' | 'admin_support';
}) {
  const db = getMessagesDb();
  
  // Deterministic thread ID
  const threadId = `direct:${[senderId, recipientId].sort().join("-")}`;
  
  // Find or create thread
  let thread = db.threads.find((t: any) => t.id === threadId);
  if (!thread) {
    thread = {
      id: threadId,
      type: threadType,
      lastMessage: body,
      updatedAt: new Date().toISOString(),
      metadata: {
        title: recipientName,
        recipient_id: recipientId
      }
    };
    db.threads.push(thread);
  } else {
    thread.lastMessage = body;
    thread.updatedAt = new Date().toISOString();
  }

  const message: Message = {
    id: Math.random().toString(36).substring(2, 11),
    thread_id: threadId,
    body,
    sender_role: senderRole,
    sender_id: senderId,
    direction: "outbound",
    created_at: new Date().toISOString()
  };

  db.messages.push(message);
  saveMessagesDb(db);
  return { thread, message };
}
