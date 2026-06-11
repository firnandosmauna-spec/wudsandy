const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdHdidmhlcWd5aGN6aXRnYnltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDMwMzQsImV4cCI6MjA4NTkxOTAzNH0.LWNT7YV13sT3jEUbFFgY1_9213WuqEDvDREE0exj8BY';
const COFFEE_POWDER_CATEGORY_ID = 'ccde4373-c563-4339-b0fe-efa2ef007129';

async function fetchAllTransactions() {
  let allTransactions = [];
  let offset = 0;
  const limit = 1000;
  let keepFetching = true;

  console.log('Fetching transactions from Supabase...');
  
  while (keepFetching) {
    const url = `https://yqtwbvheqgyhczitgbym.supabase.co/rest/v1/transactions?select=id,created_at,receipt_number,payment_method,total_amount,transaction_items(price,quantity,product_id,products(category_id))&created_at=gte.2026-04-01T00:00:00Z&created_at=lte.2026-04-30T23:59:59Z&order=created_at.asc&limit=${limit}&offset=${offset}`;

    const res = await fetch(url, {
      headers: {
        'apikey': apiKey,
        'Authorization': 'Bearer ' + apiKey
      }
    });

    if (!res.ok) {
      throw new Error('HTTP error ' + res.status);
    }

    const data = await res.json();
    allTransactions = allTransactions.concat(data);
    console.log(`Fetched page with ${data.length} records. Total so far: ${allTransactions.length}`);

    if (data.length < limit) {
      keepFetching = false;
    } else {
      offset += limit;
    }
  }

  return allTransactions;
}

fetchAllTransactions()
  .then(data => {
    console.log('\n--- FETCH COMPLETED ---');
    console.log('Grand Total transactions fetched:', data.length);
    
    let rawTotalSum = 0;
    let adjustedTotalSum = 0;
    let coffeePowderTotalSum = 0;
    
    // Track transactions that have coffee powder category items
    let transactionsWithCoffeePowder = 0;
    
    data.forEach((t, index) => {
      const totalAmount = Number(t.total_amount || 0);
      rawTotalSum += totalAmount;
      
      // Calculate coffee powder total for this transaction
      let bubukKopiTotal = 0;
      let hasCoffeePowder = false;
      
      if (t.transaction_items) {
        t.transaction_items.forEach(item => {
          const categoryId = item.products?.category_id;
          if (categoryId === COFFEE_POWDER_CATEGORY_ID) {
            bubukKopiTotal += Number(item.price || 0) * Number(item.quantity || 0);
            hasCoffeePowder = true;
          }
        });
      }
      
      if (hasCoffeePowder) {
        transactionsWithCoffeePowder++;
      }
      
      const adjusted = totalAmount - bubukKopiTotal;
      coffeePowderTotalSum += bubukKopiTotal;
      
      if (adjusted > 0) {
        adjustedTotalSum += adjusted;
      }
    });
    
    console.log('\n--- SALES REPORT SUMMARY (APRIL 2026) ---');
    console.log('Raw Total Sales (Gross): Rp', rawTotalSum.toLocaleString('id-ID'));
    console.log('Total Coffee Powder Sales (Excluded): Rp', coffeePowderTotalSum.toLocaleString('id-ID'));
    console.log('Adjusted Total Sales (Net - Web/Excel): Rp', adjustedTotalSum.toLocaleString('id-ID'));
    console.log('Transactions with Coffee Powder:', transactionsWithCoffeePowder);
    console.log('-------------------------------------------\n');
  })
  .catch(err => {
    console.error('Error fetching data:', err);
  });
