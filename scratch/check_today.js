const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdHdidmhlcWd5aGN6aXRnYnltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDMwMzQsImV4cCI6MjA4NTkxOTAzNH0.LWNT7YV13sT3jEUbFFgY1_9213WuqEDvDREE0exj8BY';

async function run() {
  // Today is 2026-06-11 WIB (June 10 17:00 UTC to June 11 17:00 UTC)
  const url = 'https://yqtwbvheqgyhczitgbym.supabase.co/rest/v1/transactions?select=id,created_at,total_amount&created_at=gte.2026-06-10T17:00:00.000Z&created_at=lte.2026-06-11T16:59:59.999Z';
  const res = await fetch(url, { headers: { 'apikey': apiKey, 'Authorization': 'Bearer ' + apiKey } });
  const data = await res.json();
  console.log('Transactions today (June 11): count =', data.length, 'total =', data.reduce((sum, t) => sum + Number(t.total_amount), 0));
  
  // Let's also check the most recent transaction date in the database
  const url2 = 'https://yqtwbvheqgyhczitgbym.supabase.co/rest/v1/transactions?select=id,created_at,total_amount&order=created_at.desc&limit=5';
  const res2 = await fetch(url2, { headers: { 'apikey': apiKey, 'Authorization': 'Bearer ' + apiKey } });
  const data2 = await res2.json();
  console.log('Most recent transactions:', data2);
}

run().catch(console.error);
