import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ data: [] });
  }

  // Fetch all messages where the user is sender or recipient,
  // grouped into threads with the other participant's profile
  const { data, error } = await supabase
    .from("internal_messages")
    .select(`
      id,
      thread_id,
      body,
      created_at,
      sender:sender_id ( id, name, email, role ),
      recipient:recipient_id ( id, name, email, role )
    `)
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build thread list — one entry per unique thread_id, 
  // with the OTHER person's profile as the title
  const threadMap = new Map<string, any>();
  for (const msg of data ?? []) {
    if (threadMap.has(msg.thread_id)) continue;

    const isISender = (msg.sender as any)?.id === userId;
    const other = isISender ? msg.recipient : msg.sender;

    threadMap.set(msg.thread_id, {
      id: msg.thread_id,
      type: "internal",
      lastMessage: msg.body,
      updatedAt: msg.created_at,
      metadata: {
        title: (other as any)?.name ?? "Unknown",
        recipient_id: (other as any)?.id,
      },
    });
  }

  return NextResponse.json({ data: Array.from(threadMap.values()) });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { message, sender_id, recipient_id } = body;

  if (!message?.trim() || !sender_id || !recipient_id) {
    return NextResponse.json(
      { error: "message, sender_id and recipient_id are required" },
      { status: 400 }
    );
  }

  // Deterministic thread ID — sort IDs so both sides share the same thread
  const sorted = [sender_id, recipient_id].sort();
  const thread_id = `direct:${sorted[0]}-${sorted[1]}`;

  const { data, error } = await supabase
    .from("internal_messages")
    .insert({ thread_id, sender_id, recipient_id, body: message.trim() })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
