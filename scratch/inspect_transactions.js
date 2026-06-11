const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdHdidmhlcWd5aGN6aXRnYnltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDMwMzQsImV4cCI6MjA4NTkxOTAzNH0.LWNT7YV13sT3jEUbFFgY1_9213WuqEDvDREE0exj8BY';

async function inspect() {
  const url = 'https://yqtwbvheqgyhczitgbym.supabase.co/rest/v1/transactions?select=id,created_at,total_amount,transaction_items(id,price,quantity,product_id,products(name,category_id))&created_at=gte.2026-04-01T00:00:00Z&limit=5';
  
  const res = await fetch(url, {
    headers: {
      'apikey': apiKey,
      'Authorization': 'Bearer ' + apiKey
    }
  });

  const data = await res.json();
  console.log('Sample transactions:', JSON.stringify(data, null, 2));
}

inspect().catch(console.error);
