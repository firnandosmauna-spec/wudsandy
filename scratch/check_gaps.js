const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdHdidmhlcWd5aGN6aXRnYnltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDMwMzQsImV4cCI6MjA4NTkxOTAzNH0.LWNT7YV13sT3jEUbFFgY1_9213WuqEDvDREE0exj8BY';

async function checkGaps() {
  // Gap A: April 1st, 00:00 - 07:00 WIB (stored as March 31, 17:00 - 24:00 UTC)
  const urlA = `https://yqtwbvheqgyhczitgbym.supabase.co/rest/v1/transactions?select=id,created_at,total_amount&created_at=gte.2026-03-31T17:00:00Z&created_at=lt.2026-04-01T00:00:00Z`;
  
  // Gap B: May 1st, 00:00 - 07:00 WIB (stored as April 30, 17:00 - 24:00 UTC)
  const urlB = `https://yqtwbvheqgyhczitgbym.supabase.co/rest/v1/transactions?select=id,created_at,total_amount&created_at=gte.2026-04-30T17:00:00Z&created_at=lt.2026-05-01T00:00:00Z`;

  const resA = await fetch(urlA, { headers: { 'apikey': apiKey, 'Authorization': 'Bearer ' + apiKey } });
  const dataA = await resA.json();

  const resB = await fetch(urlB, { headers: { 'apikey': apiKey, 'Authorization': 'Bearer ' + apiKey } });
  const dataB = await resB.json();

  console.log('Gap A (April 1st early morning WIB): count =', dataA.length, 'total =', dataA.reduce((sum, t) => sum + Number(t.total_amount), 0));
  if (dataA.length > 0) console.log('Gap A samples:', dataA);

  console.log('Gap B (May 1st early morning WIB): count =', dataB.length, 'total =', dataB.reduce((sum, t) => sum + Number(t.total_amount), 0));
  if (dataB.length > 0) console.log('Gap B samples:', dataB);
}

checkGaps().catch(console.error);
