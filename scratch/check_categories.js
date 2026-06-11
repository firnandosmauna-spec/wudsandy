const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdHdidmhlcWd5aGN6aXRnYnltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDMwMzQsImV4cCI6MjA4NTkxOTAzNH0.LWNT7YV13sT3jEUbFFgY1_9213WuqEDvDREE0exj8BY';

async function run() {
  // 1. Fetch categories
  const resCat = await fetch('https://yqtwbvheqgyhczitgbym.supabase.co/rest/v1/categories?select=*', {
    headers: { 'apikey': apiKey, 'Authorization': 'Bearer ' + apiKey }
  });
  const categories = await resCat.json();
  console.log('Categories:', categories);

  // 2. Fetch some products
  const resProd = await fetch('https://yqtwbvheqgyhczitgbym.supabase.co/rest/v1/products?select=id,name,category_id&limit=10', {
    headers: { 'apikey': apiKey, 'Authorization': 'Bearer ' + apiKey }
  });
  const products = await resProd.json();
  console.log('Products sample:', products);
}

run().catch(console.error);
