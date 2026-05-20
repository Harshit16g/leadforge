import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const supabase = await createClient();
  const { threadId } = await params;

  const { data, error } = await supabase
    .from("internal_messages")
    .select(`
      id,
      thread_id,
      body,
      created_at,
      sender_id,
      recipient_id,
      sender:sender_id ( id, name )
    `)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Normalise to the shape MessagingHub expects
  const messages = (data ?? []).map((m: any) => ({
    id: m.id,
    thread_id: m.thread_id,
    body: m.body,
    sender_id: m.sender_id,
    sender_name: m.sender?.name,
    direction: "outbound", // client determines inbound/outbound by comparing sender_id
    created_at: m.created_at,
  }));

  return NextResponse.json({ data: messages });
}
