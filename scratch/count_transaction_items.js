const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdHdidmhlcWd5aGN6aXRnYnltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDMwMzQsImV4cCI6MjA4NTkxOTAzNH0.LWNT7YV13sT3jEUbFFgY1_9213WuqEDvDREE0exj8BY';

async function run() {
  const url = 'https://yqtwbvheqgyhczitgbym.supabase.co/rest/v1/transaction_items?select=id';
  const res = await fetch(url, {
    method: 'HEAD',
    headers: {
      'apikey': apiKey,
      'Authorization': 'Bearer ' + apiKey,
      'Prefer': 'count=exact'
    }
  });
  console.log('Transaction items count headers:', res.headers.get('content-range'));
}

run().catch(console.error);
