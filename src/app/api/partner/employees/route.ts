import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const excludeId = searchParams.get("exclude"); // exclude the current user from contacts list

  let query = supabase
    .from("profiles")
    .select("id, name, email, role")
    .order("role", { ascending: true });

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
