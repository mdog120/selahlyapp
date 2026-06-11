import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string);

async function main() {
  const senderId = 'be72bf54-d407-45dc-98ab-b6721a3f2173'; // Morola
  const receiverId = '8aff9069-4555-4350-8561-17bb0d3b362b'; // Younas

  // Trying to send a flower gift as Morola
  const { data, error } = await supabase.from('flower_gifts').insert({
      sender_id: senderId,
      receiver_id: receiverId,
      flower_type: 'daisy',
      status: 'pending'
  }).select();

  console.log("Insert Result:", data);
  console.log("Insert Error:", error);
}
main();
