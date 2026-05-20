import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * POST /api/partner/ledger/[id]/restore
 * Restores an archived lead back to active ops.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase
      .from('leads')
      .update({
        archived: false,
        archived_at: null,
        archived_by: null,
      })
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Log the restore action
    await supabase.from('interactions').insert([{
      lead_id: id,
      type: 'note',
      content: 'Lead restored from Ledger back to active operations.',
    }]);

    revalidatePath('/leads');
    revalidatePath('/ledger');

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
