const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
  
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('livewire') || url.includes('api') || url.includes('myspeedpost.com')) {
      try {
        const text = await response.text();
        if (text.includes('PP272506004IN') || text.includes('timeline') || text.includes('events')) {
          console.log(`\n\n--- MATCH IN URL: ${url} ---\n`);
          console.log(text.substring(0, 3000)); // Log first 3000 chars of the matching payload
        }
      } catch (e) {
        // ignore opaque responses or errors
      }
    }
  });
  
  console.log("Navigating...");
  await page.goto(`https://myspeedpost.com/?n=PP272506004IN`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await new Promise(r => setTimeout(r, 8000));
  
  await browser.close();
})();
