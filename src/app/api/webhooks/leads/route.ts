import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { runLeadAutomationRules } from '@/app/actions/leads';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Unified Extraction & Normalisation (Facebook, Google, WhatsApp, Website, etc.)
    const name = body.name || body.fullName || body.leadName;
    const email = body.email || body.emailAddress;
    const phone = body.phone || body.phoneNumber || body.tel;
    const businessName = body.business_name || body.company || body.businessName || 'Individual Buyer';
    const source = body.source || 'website';
    const status = body.status || 'new';
    const priority = body.priority || 'medium';
    const health = body.health || 'warm';
    
    let rawNotes = body.notes || body.message || body.inquiry || '';
    const carModel = body.car_model || body.vehicle || '';
    const budget = body.budget || '';
    const fuel = body.fuel || '';
    const financing = body.financing || '';

    // Enforce strong validation
    if (!name) {
      return NextResponse.json({ error: 'Name is required for lead ingestion.' }, { status: 400 });
    }

    const supabase = await createClient();

    // 2. Duplicate Detection Strategy (Email or Phone check on active leads)
    if (email || phone) {
      let query = supabase.from('leads').select('*').eq('archived', false);
      
      if (email && phone) {
        query = query.or(`email.eq.${email},phone.eq.${phone}`);
      } else if (email) {
        query = query.eq('email', email);
      } else {
        query = query.eq('phone', phone);
      }

      const { data: existingLeads } = await query.limit(1);

      if (existingLeads && existingLeads.length > 0) {
        const existingLead = existingLeads[0];

        // Instead of duplicate insertion, update existing lead's interaction logs & interest notes
        const updateData: any = {
          score: Math.min(100, (existingLead.score || 50) + 15), // Bump score due to re-engagement
          last_interaction_at: new Date().toISOString()
        };

        await supabase.from('leads').update(updateData).eq('id', existingLead.id);

        // Record a merge suggestion interaction timeline audit trail
        const detailMsg = `Inbound Re-engagement via ${source}.\nModel Interest: ${carModel || 'N/A'}\nNotes: ${rawNotes}`;
        await supabase.from('interactions').insert([
          {
            lead_id: existingLead.id,
            type: 'note',
            content: `Duplicate Detection Alert: Lead re-engaged. System auto-merged incoming records from source [${source}].\nDetails:\n${detailMsg}`
          }
        ]);

        // Run automation rules to evaluate updates
        try {
          await runLeadAutomationRules();
        } catch (e) {
          console.error(e);
        }

        // Trigger Event callback for lead update
        try {
          const origin = new URL(request.url).origin;
          await fetch(`${origin}/api/webhooks/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventType: 'status.changed',
              leadId: existingLead.id,
              metadata: { source, action: 'duplicate_merge_score_bump' }
            })
          });
        } catch (e) {
          console.error('Failed to trigger update event', e);
        }

        return NextResponse.json({
          success: true,
          action: 'merged',
          leadId: existingLead.id,
          message: `Duplicate detected. Automatically merged incoming data into Lead Profile of ${existingLead.name}.`
        }, { status: 200 });
      }
    }

    // 3. Dynamic Auto-Assignment Engine (Round-Robin amongst active sales reps)
    let assignedTo = null;
    const { data: salesReps } = await supabase
      .from('profiles')
      .select('id, name, role')
      .eq('role', 'sales');

    if (salesReps && salesReps.length > 0) {
      // Get count of existing non-archived leads to deterministically distribute leads
      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('archived', false);
      
      const nextRepIndex = (count || 0) % salesReps.length;
      assignedTo = salesReps[nextRepIndex].id;
    }

    // Serialize interest parameters into notes column to protect dynamic schema
    const serializedNotes = JSON.stringify({
      notes: rawNotes,
      vehicle: carModel || 'Hyundai Creta',
      budget: budget || '₹12L - ₹16L',
      fuel: fuel || 'Petrol',
      financing: financing || 'Needs Assistance',
      location: body.location || 'Bengaluru Showroom'
    });

    // 4. CRM Ingestion
    const { data: newLead, error: insertError } = await supabase
      .from('leads')
      .insert([
        {
          name,
          email: email || null,
          phone: phone || null,
          business_name: businessName,
          source,
          status,
          priority,
          health,
          score: body.score || 60,
          notes: serializedNotes,
          assigned_to: assignedTo,
          last_interaction_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Webhook Lead Insertion Error:', insertError);
      return NextResponse.json({ error: 'Database Ingestion failed.' }, { status: 500 });
    }

    // Insert initial lifecycle audit log interaction
    await supabase.from('interactions').insert([
      {
        lead_id: newLead.id,
        type: 'note',
        content: `Lead created successfully via Unified Ingest Webhook [Source: ${source}]. Auto-assigned to sales representative.`
      }
    ]);

    // Run active background workflows synchronously to apply dynamic SLA, routing, and VIP rules instantly
    try {
      await runLeadAutomationRules();
    } catch (e) {
      console.error('Failed to run lead automation rules synchronously', e);
    }

    // Refetch the updated lead state containing the VIP assignment upgrades
    const { data: finalLead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', newLead.id)
      .single();

    const resultLead = finalLead || newLead;

    // 5. Trigger Outbound Event Webhook System
    try {
      const origin = new URL(request.url).origin;
      await fetch(`${origin}/api/webhooks/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'lead.created',
          leadId: resultLead.id,
          metadata: {
            source,
            assignedTo: resultLead.assigned_to
          }
        })
      });
    } catch (e) {
      console.error('Failed to trigger webhook event dispatch', e);
    }

    return NextResponse.json({
      success: true,
      action: 'created',
      lead: resultLead
    }, { status: 201 });

  } catch (error) {
    console.error('Webhook lead ingestion parsing error:', error);
    return NextResponse.json({ error: 'Malformed or invalid JSON payload.' }, { status: 400 });
  }
}
