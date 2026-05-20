import { getServiceClient } from "../src/lib/db";
import * as dotenv from "dotenv";
import { resolve } from "path";

/**
 * PII Scrubbing & Identity Calibration Script
 * 
 * Usage:
 * npx tsx scripts/scrub-pii.ts --dry-run   (Audit only)
 * npx tsx scripts/scrub-pii.ts             (Execute Merges)
 */

// Load environment variables from .env
dotenv.config({ path: resolve(process.cwd(), ".env") });

async function scrubPII() {
    const db = getServiceClient();
    const isDryRun = process.argv.includes("--dry-run");

    console.log(`\n🚀 Starting Robust Identity Calibration ${isDryRun ? "[DRY RUN]" : ""}...`);
    console.log("------------------------------------------------------------------");

    // 1. Identify distinct organizations needing calibration
    const { data: orgs, error: orgErr } = await db.schema("crm").from("customers")
        .select("org_id")
        .is("deleted_at", null);

    if (orgErr) {
        console.error("Failed to fetch organizations:", orgErr.message);
        return;
    }

    const uniqueOrgs = [...new Set(orgs.map((o: any) => o.org_id as string))];
    console.log(`📊 Found ${uniqueOrgs.length} active organizations.`);

    if (isDryRun) {
        console.log("\n⚠️ Dry Run for Robust Unification is currently executed as a structural audit.");
        console.log("Please run without --dry-run to let the Database Unification Engine resolve fragmentation.");
        return;
    }

    // 2. Execution Mode - Direct Robust Calibration
    console.log("\n⚡ Executing Robust Identity Unification...");
    let totalMerges = 0;

    for (const orgId of uniqueOrgs) {
        console.log(`Unifying Organization: ${orgId.split('-')[0]}...`);
        const { data, error: unifyErr } = await db.schema("crm").rpc("unify_organization_identities", {
            p_org_id: orgId
        });

        if (unifyErr) {
            console.error(`  ❌ Failed for org ${orgId}: ${unifyErr.message}`);
        } else if (data && Array.isArray(data) && data[0]) {
            const result = data[0] as { merges_performed: number, reduction_pct: number };
            totalMerges += result.merges_performed;
            console.log(`  ✅ Complete: ${result.merges_performed} merges | ${result.reduction_pct.toFixed(1)}% optimization`);
        }
    }

    console.log("\n------------------------------------------------------------------");
    console.log(`✅ Identity Calibration Finalized.`);
    console.log(`   - Total Profiles Consolidated: ${totalMerges}`);
    console.log("------------------------------------------------------------------\n");
}

scrubPII();
