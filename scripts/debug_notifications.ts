import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string);

async function main() {
  const { data: notifs, error } = await supabase
      .from('notifications')
      .select('*')
      .limit(5);

  console.log("Notifications:", JSON.stringify(notifs, null, 2));
  console.log("Error:", error);
}
main();
