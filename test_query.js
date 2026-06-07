import { createClient } from '@supabase/supabase-js';

// Load env vars
import dotenv from 'dotenv';
dotenv.config({ path: 'c:\\Users\\USER\\Downloads\\kejaan ayah\\branch-pos-main\\.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing query with transaction_items...');
  const start1 = Date.now();
  const { data: d1, error: e1 } = await supabase
    .from('transactions')
    .select('id, transaction_items(id)')
    .limit(1000);
  console.log('With items:', Date.now() - start1, 'ms', e1 ? e1 : `Found ${d1?.length} rows`);

  console.log('Testing query WITHOUT transaction_items...');
  const start2 = Date.now();
  const { data: d2, error: e2 } = await supabase
    .from('transactions')
    .select('id')
    .limit(1000);
  console.log('Without items:', Date.now() - start2, 'ms', e2 ? e2 : `Found ${d2?.length} rows`);
}

test();
