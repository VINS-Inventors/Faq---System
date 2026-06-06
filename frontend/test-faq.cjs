const http = require('http');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function test() {
  // Test the HTML page
  const page = await fetchUrl('http://localhost:3000/faq');
  console.log('Page status:', page.status);
  console.log('Has root div:', page.body.includes('id="root"'));
  console.log('Has FAQ text:', page.body.includes('Frequently'));
  console.log('');

  // Test the API via Vite proxy
  const api = await fetchUrl('http://localhost:3000/api/faqs');
  console.log('API status:', api.status);
  const parsed = JSON.parse(api.body);
  console.log('API is array:', Array.isArray(parsed));
  console.log('API length:', parsed.length);
  console.log('First item keys:', Object.keys(parsed[0]).join(', '));
}

test().catch(console.error);