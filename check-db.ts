import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await supabase.from('leads').select('*').limit(1);
  if (error) {
    console.error("DB Error:", error);
  } else {
    console.log("DB Success, rows:", data.length);
  }
}
main();
