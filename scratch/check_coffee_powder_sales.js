const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdHdidmhlcWd5aGN6aXRnYnltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDMwMzQsImV4cCI6MjA4NTkxOTAzNH0.LWNT7YV13sT3jEUbFFgY1_9213WuqEDvDREE0exj8BY';
const COFFEE_POWDER_CATEGORY_ID = 'ccde4373-c563-4339-b0fe-efa2ef007129';

async function run() {
  // Query all transaction_items for transactions in April 2026
  const url = 'https://yqtwbvheqgyhczitgbym.supabase.co/rest/v1/transaction_items?select=id,price,quantity,product_name,product_id,products(name,category_id),transactions!inner(created_at)&transactions.created_at=gte.2026-04-01T00:00:00Z&transactions.created_at=lte.2026-04-30T23:59:59Z';
  
  const res = await fetch(url, {
    headers: {
      'apikey': apiKey,
      'Authorization': 'Bearer ' + apiKey
    }
  });

  if (!res.ok) {
    throw new Error('HTTP error ' + res.status);
  }

  const items = await res.json();
  console.log('Total transaction items in April 2026:', items.length);

  let coffeePowderItems = items.filter(item => {
    return item.products?.category_id === COFFEE_POWDER_CATEGORY_ID;
  });

  console.log('Coffee Powder items sold in April 2026:', coffeePowderItems.length);
  if (coffeePowderItems.length > 0) {
    console.log('Coffee Powder items sample:', coffeePowderItems.slice(0, 5));
    const totalCoffeeSales = coffeePowderItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    console.log('Total coffee powder sales amount:', totalCoffeeSales);
  }
}

run().catch(console.error);
