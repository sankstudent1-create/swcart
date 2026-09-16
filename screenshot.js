const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,1024'] 
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
  
  await page.goto(`https://myspeedpost.com/?n=PP272506004IN`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await new Promise(r => setTimeout(r, 5000));
  
  await page.screenshot({ path: 'C:/Users/swanv/Downloads/swcart/screenshot.png', fullPage: true });
  
  await browser.close();
})();
