const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdHdidmhlcWd5aGN6aXRnYnltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDMwMzQsImV4cCI6MjA4NTkxOTAzNH0.LWNT7YV13sT3jEUbFFgY1_9213WuqEDvDREE0exj8BY';

async function fetchAllTransactions() {
  let allTransactions = [];
  let offset = 0;
  const limit = 1000;
  let keepFetching = true;

  while (keepFetching) {
    const url = `https://yqtwbvheqgyhczitgbym.supabase.co/rest/v1/transactions?select=status,payment_method,total_amount&created_at=gte.2026-04-01T00:00:00Z&created_at=lte.2026-04-30T23:59:59Z&order=created_at.asc&limit=${limit}&offset=${offset}`;

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
    const statusCounts = {};
    const statusAmounts = {};
    
    const methodCounts = {};
    const methodAmounts = {};
    
    data.forEach(t => {
      const status = t.status || 'unknown';
      const method = t.payment_method || 'unknown';
      const amount = Number(t.total_amount || 0);
      
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      statusAmounts[status] = (statusAmounts[status] || 0) + amount;
      
      methodCounts[method] = (methodCounts[method] || 0) + 1;
      methodAmounts[method] = (methodAmounts[method] || 0) + amount;
    });
    
    console.log('Grouped by Status:');
    Object.keys(statusCounts).forEach(s => {
      console.log(`  ${s}: ${statusCounts[s]} transactions, Total Amount = Rp ${statusAmounts[s].toLocaleString('id-ID')}`);
    });
    
    console.log('\nGrouped by Payment Method:');
    Object.keys(methodCounts).forEach(m => {
      console.log(`  ${m}: ${methodCounts[m]} transactions, Total Amount = Rp ${methodAmounts[m].toLocaleString('id-ID')}`);
    });
  })
  .catch(console.error);
