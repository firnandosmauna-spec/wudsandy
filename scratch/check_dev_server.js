async function run() {
  try {
    const res = await fetch('http://localhost:8080');
    console.log('Dev server status:', res.status);
  } catch (err) {
    console.error('Dev server is offline:', err.message);
  }
}
run();
