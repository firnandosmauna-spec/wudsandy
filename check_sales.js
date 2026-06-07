const url = 'https://yqtwbvheqgyhczitgbym.supabase.co/rest/v1/transactions?select=*&created_at=gte.2026-05-01T00:00:00Z&created_at=lte.2026-05-13T23:59:59Z';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdHdidmhlcWd5aGN6aXRnYnltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDMwMzQsImV4cCI6MjA4NTkxOTAzNH0.LWNT7YV13sT3jEUbFFgY1_9213WuqEDvDREE0exj8BY';

fetch(url, {
  headers: {
    'apikey': apiKey,
    'Authorization': 'Bearer ' + apiKey
  }
}).then(res => res.json()).then(data => console.log('May 1-13 Data count:', data.length, data.slice(0, 2))).catch(console.error);

const url2 = 'https://yqtwbvheqgyhczitgbym.supabase.co/rest/v1/transactions?select=*&order=created_at.desc&limit=5';
fetch(url2, {
  headers: {
    'apikey': apiKey,
    'Authorization': 'Bearer ' + apiKey
  }
}).then(res => res.json()).then(data => console.log('Latest 5 transactions:', data.map(t => t.created_at))).catch(console.error);
