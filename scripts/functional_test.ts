import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_ORG_ID = 'f52a3d0c-3ddc-427d-8222-326a960bebfe'; 
const TEST_ACTOR_ID = '0ea5ff35-7521-4675-af68-3dcc62153395';

async function runFunctionalSampling() {
  console.log('🚀 STARTING FUNCTIONAL SAMPLING ACROSS ALL DOMAINS');
  console.log('---------------------------------------------');

  const samples = [
    {
      domain: 'Inventory',
      rpc: 'inventory.upsert_products_v1',
      params: {
        p_actor_id: TEST_ACTOR_ID,
        p_org_id: TEST_ORG_ID,
        p_name: 'Sample Product',
        p_unit: 'pcs',
        p_purchase_price: 10,
        p_selling_price: 15,
        p_gst_rate: 18,
        p_current_stock: 100,
        p_reorder_level: 10,
        p_is_active: true
      }
    },
    {
      domain: 'Billing',
      rpc: 'billing.upsert_plans_v1',
      params: {
        p_actor_id: TEST_ACTOR_ID,
        p_org_id: TEST_ORG_ID,
        p_name: 'Pro Plan',
        p_price: 999,
        p_billing_cycle: 'monthly',
        p_is_active: true
      }
    },
    {
      domain: 'Comms',
      rpc: 'comms.upsert_messages_v1',
      params: {
        p_actor_id: TEST_ACTOR_ID,
        p_org_id: TEST_ORG_ID,
        p_content: 'Test Message',
        p_direction: 'outbound',
        p_status: 'sent',
        p_channel: 'whatsapp'
      }
    },
    {
      domain: 'Ops',
      rpc: 'ops.upsert_staff_members_v1',
      params: {
        p_actor_id: TEST_ACTOR_ID,
        p_org_id: TEST_ORG_ID,
        p_name: 'Test Staff',
        p_role: 'manager',
        p_phone: '5550101',
        p_is_active: true
      }
    },
    {
      domain: 'Orgs',
      rpc: 'orgs.upsert_branches_v1',
      params: {
        p_actor_id: TEST_ACTOR_ID,
        p_org_id: TEST_ORG_ID,
        p_name: 'East Branch',
        p_is_primary: false,
        p_status: 'active',
        p_country: 'India',
        p_timezone: 'Asia/Kolkata',
        p_accepting_bookings: true,
        p_operating_hours: {},
        p_gallery_urls: [],
        p_amenity_tags: [],
        p_social_links: {}
      }
    },
    {
      domain: 'IAM',
      rpc: 'iam.upsert_roles_v1',
      params: {
        p_actor_id: TEST_ACTOR_ID,
        p_org_id: TEST_ORG_ID,
        p_role_key: 'custom_role_' + Date.now(),
        p_display_name: 'Custom Role',
        p_is_system: false,
        p_is_custom: true
      }
    },
    {
      domain: 'CRM',
      rpc: 'crm.upsert_customers_v1',
      params: {
        p_actor_id: TEST_ACTOR_ID,
        p_org_id: TEST_ORG_ID,
        p_name: 'Jane Doe',
        p_phone: '5550202',
        p_is_active: true,
        p_loyalty_points: 0
      }
    },
    {
      domain: 'Scheduling',
      rpc: 'scheduling.upsert_waitlist_v1',
      params: {
        p_actor_id: TEST_ACTOR_ID,
        p_org_id: TEST_ORG_ID,
        p_customer_id: '0ea5ff35-7521-4675-af68-3dcc62153395', // Placeholder
        p_branch_id: TEST_ORG_ID, // Placeholder
        p_status: 'pending',
        p_party_size: 2
      }
    },
    {
      domain: 'AI',
      rpc: 'ai.upsert_chat_sessions_v1',
      params: {
        p_actor_id: TEST_ACTOR_ID,
        p_org_id: TEST_ORG_ID,
        p_user_id: TEST_ACTOR_ID,
        p_status: 'active',
        p_context: {}
      }
    },
    {
      domain: 'Platform',
      rpc: 'platform.upsert_tasks_v1',
      params: {
        p_actor_id: TEST_ACTOR_ID,
        p_org_id: TEST_ORG_ID,
        p_title: 'System Maintenance',
        p_status: 'pending',
        p_priority: 'medium'
      }
    }
  ];

  for (const sample of samples) {
    console.log(`\n🧪 Testing [${sample.domain}]: ${sample.rpc}`);
    
    const { data, error } = await supabase.rpc(sample.rpc, sample.params);
    
    if (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      if (error.details) console.error(`     Details: ${error.details}`);
    } else {
      console.log(`  ✅ Success! Created ID: ${data.id}`);
      
      // Verify Audit Log
      const { data: audit, error: auditError } = await supabase
        .from('platform.audit_logs')
        .select('action')
        .eq('target_id', data.id)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (audit && audit.length > 0) {
        console.log(`  ✅ Audit Log Verified: ${audit[0].action}`);
      } else {
        console.warn(`  ⚠️ Audit Log Missing for ${data.id}`);
      }
    }
  }

  console.log('\n---------------------------------------------');
  console.log('🏁 FUNCTIONAL SAMPLING COMPLETE');
}

runFunctionalSampling().catch(console.error);
