import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// We need to use the service role key to bypass RLS to ensure the gift was actually inserted
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string);

async function main() {
  const { data: giftData, error } = await supabase
      .from('flower_gifts')
      .select('*')
      .order('created_at', { ascending: false });

  console.log("All Gifts:", JSON.stringify(giftData, null, 2));
  console.log("Error:", error);
}
main();
