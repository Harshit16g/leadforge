import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Extract lead data from payload
    const {
      name,
      email,
      phone,
      business_name,
      source = 'website',
      status = 'new',
      priority = 'medium',
      health = 'warm',
      notes
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          name,
          email,
          phone,
          business_name,
          source,
          status,
          priority,
          health,
          notes,
          score: 50 // Default initial score for webhook leads
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Webhook Lead Insertion Error:', error);
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }

    return NextResponse.json({ success: true, lead: data }, { status: 201 });
  } catch (error) {
    console.error('Webhook payload parsing error:', error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
