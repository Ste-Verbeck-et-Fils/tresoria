const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Login first to get the token, or just inject localStorage
  await page.goto('http://localhost:5173/login');
  
  // We can inject a mock user into localStorage
  await page.evaluate(() => {
    localStorage.setItem('user', JSON.stringify({ id: 1, role: 'ADMIN', token: 'mock' }));
    localStorage.setItem('token', 'mock');
  });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:5173/depenses', { waitUntil: 'networkidle0' });
  
  await browser.close();
})();
