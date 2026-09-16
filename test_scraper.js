const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
  
  const trackingNumber = 'PP272506004IN';
  console.log(`Navigating to https://myspeedpost.com/?n=${trackingNumber}...`);
  try {
    await page.goto(`https://myspeedpost.com/?n=${trackingNumber}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log("Page loaded. Waiting for selector...");
    
    // Attempt to wait for livewire update
    await new Promise(r => setTimeout(r, 6000));
    
    const html = await page.evaluate(() => document.body.innerHTML);
    const fs = require('fs');
    fs.writeFileSync('C:\\Users\\swanv\\Downloads\\swcart\\scraped_results2.html', html);
    console.log("Success. HTML saved.");
  } catch (e) {
    console.error("Error during navigation or waiting:", e);
  }
  
  await browser.close();
})();
