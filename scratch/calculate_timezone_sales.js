const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdHdidmhlcWd5aGN6aXRnYnltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDMwMzQsImV4cCI6MjA4NTkxOTAzNH0.LWNT7YV13sT3jEUbFFgY1_9213WuqEDvDREE0exj8BY';

async function fetchTransactionsForRange(startDateStr, endDateStr) {
  let allTransactions = [];
  let offset = 0;
  const limit = 1000;
  let keepFetching = true;

  while (keepFetching) {
    const url = `https://yqtwbvheqgyhczitgbym.supabase.co/rest/v1/transactions?select=id,created_at,total_amount&created_at=gte.${startDateStr}&created_at=lte.${endDateStr}&order=created_at.asc&limit=${limit}&offset=${offset}`;

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

async function run() {
  console.log('Calculating Sales for April 2026 with different timezone boundaries...');

  // 1. UTC Boundaries (Querying with 'Z' appended to local startOfDay/endOfDay)
  // local startOfDay(April 1) = 2026-04-01 00:00:00 (GMT+7) formatted as "2026-04-01T00:00:00Z"
  // local endOfDay(April 30) = 2026-04-30 23:59:59 (GMT+7) formatted as "2026-04-30T23:59:59Z"
  const utcStart = '2026-04-01T00:00:00Z';
  const utcEnd = '2026-04-30T23:59:59Z';
  const utcTx = await fetchTransactionsForRange(utcStart, utcEnd);
  const utcTotal = utcTx.reduce((sum, t) => sum + Number(t.total_amount), 0);

  // 2. Correct Local Boundaries (WIB / GMT+7)
  // 2026-04-01 00:00:00 WIB = 2026-03-31T17:00:00Z
  // 2026-04-30 23:59:59 WIB = 2026-04-30T16:59:59Z
  const wibStart = '2026-03-31T17:00:00Z';
  const wibEnd = '2026-04-30T16:59:59Z';
  const wibTx = await fetchTransactionsForRange(wibStart, wibEnd);
  const wibTotal = wibTx.reduce((sum, t) => sum + Number(t.total_amount), 0);

  console.log('\n--- TIMEZONE COMPARISON ---');
  console.log('UTC-based Query (Web Code approach):');
  console.log('  Count:', utcTx.length);
  console.log('  Total:', 'Rp ' + utcTotal.toLocaleString('id-ID'));
  console.log('  Range:', utcStart, 'to', utcEnd);
  
  console.log('\nWIB-based Query (Correct Local Time approach):');
  console.log('  Count:', wibTx.length);
  console.log('  Total:', 'Rp ' + wibTotal.toLocaleString('id-ID'));
  console.log('  Range:', wibStart, 'to', wibEnd);
  console.log('----------------------------\n');
}

run().catch(console.error);
