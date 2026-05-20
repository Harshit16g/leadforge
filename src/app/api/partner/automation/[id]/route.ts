import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const RULES_FILE_PATH = path.join(process.cwd(), 'src/app/api/partner/automation/rules.json');

function getRules() {
  if (!fs.existsSync(RULES_FILE_PATH)) return [];
  try {
    const data = fs.readFileSync(RULES_FILE_PATH, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (e) {
    return [];
  }
}

function saveRules(rules: any[]) {
  try {
    fs.writeFileSync(RULES_FILE_PATH, JSON.stringify(rules, null, 2), 'utf-8');
  } catch (e) {
    console.error(e);
  }
}

export async function PATCH(request: Request, context: any) {
  try {
    // Await params as required in newer Next.js versions
    const params = await context.params;
    const { id } = params;
    const body = await request.json();
    const rules = getRules();

    const idx = rules.findIndex((r: any) => r.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Automation rule not found.' }, { status: 404 });
    }

    // Merge changes
    rules[idx] = {
      ...rules[idx],
      ...body,
      updated_at: new Date().toISOString()
    };

    saveRules(rules);

    return NextResponse.json({ success: true, data: rules[idx] }, { status: 200 });
  } catch (e) {
    console.error('Failed to toggle rule state', e);
    return NextResponse.json({ error: 'Failed to update rule.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const params = await context.params;
    const { id } = params;
    let rules = getRules();

    const exists = rules.some((r: any) => r.id === id);
    if (!exists) {
      return NextResponse.json({ error: 'Rule not found.' }, { status: 404 });
    }

    rules = rules.filter((r: any) => r.id !== id);
    saveRules(rules);

    return NextResponse.json({ success: true, message: 'Rule successfully deleted.' }, { status: 200 });
  } catch (e) {
    console.error('Failed to delete rule', e);
    return NextResponse.json({ error: 'Failed to delete rule.' }, { status: 500 });
  }
}
