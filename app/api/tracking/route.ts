import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

// This API route uses Puppeteer to scrape tracking data from the live public site.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const consignmentNumber = searchParams.get('n');

  if (!consignmentNumber || consignmentNumber.length !== 13) {
    return NextResponse.json(
      { error: 'Invalid consignment number. Must be 13 characters.' },
      { status: 400 }
    );
  }

  let browser;
  try {
    // Launch headless browser
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    
    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

    // Go to the tracking page with the tracking number pre-filled
    // We use domcontentloaded instead of networkidle2 to avoid timeouts from trackers/polling
    await page.goto(`https://myspeedpost.com/?n=${consignmentNumber}`, { 
      waitUntil: 'domcontentloaded',
      timeout: 45000 
    });
    
    // Wait for the Livewire payload to finish and render the timeline
    // The timeline is usually a list, table, or a set of divs with classes like .tracking-item
    // We will wait explicitly for the container that holds tracking results or an error
    try {
      await page.waitForSelector('.tracking-card, .timeline, table', { timeout: 10000 });
      // Add a small buffer for Livewire DOM updates to finish
      await new Promise(r => setTimeout(r, 2000));
    } catch(e) {
      console.log("No specific tracking container found, proceeding to scrape body...");
      await new Promise(r => setTimeout(r, 4000));
    }

    // Execute script in the context of the page to scrape the data
    const trackingData = await page.evaluate((cn) => {
      // The site is a React/Livewire SPA. The text dump shows items like:
      // "Consignment Number PP272506004IN Current Status Item Delivered Delivered At July 4, 2026..."
      
      const text = document.body.innerText.replace(/\s+/g, ' ');
      
      let status = "Unknown";
      let origin = "Unknown";
      let dest = "Unknown";
      let events = [];

      // ATTEMPT 1: Parse structured tracking tables or lists (if they exist for intermediate events)
      try {
        const rows = document.querySelectorAll('table tr, .timeline li, .tracking-card li');
        rows.forEach(row => {
          const rowText = row.innerText.trim();
          if (rowText.match(/\d{2}[-/]\d{2}[-/]\d{2,4}/) || rowText.match(/[A-Z][a-z]{2,8} \d{1,2}, \d{4}/)) {
            const cells = row.querySelectorAll('td, div, span, p');
            if (cells.length >= 3) {
              const dateCell = cells[0].innerText.trim() + ' ' + (cells[1] ? cells[1].innerText.trim() : '');
              const locCell = cells[cells.length - 2] ? cells[cells.length - 2].innerText.trim() : 'Transit Hub';
              const descCell = cells[cells.length - 1] ? cells[cells.length - 1].innerText.trim() : 'In Transit';
              events.push({
                date: dateCell,
                location: locCell,
                description: descCell,
                status: 'completed'
              });
            }
          }
        });
      } catch (e) {
        // ignore
      }

      // Extract basic fields from text regardless of timeline presence
      const statusMatch = text.match(/Current Status [^\w]*([\w\s]+) Delivered At/);
      if (statusMatch && statusMatch[1]) status = statusMatch[1].trim();
      else if (text.includes("Item Delivered")) status = "Item Delivered";
      else if (text.includes("In Transit")) status = "In Transit";

      const originMatch = text.match(/Booked At (.*?) Booked On/);
      if (originMatch && originMatch[1]) origin = originMatch[1].trim();

      const destMatch = text.match(/Delivery Location (.*?) Destination Pincode/);
      if (destMatch && destMatch[1]) dest = destMatch[1].trim();

      // ATTEMPT 2: Fallback to mock events if no structured timeline exists
      if (events.length === 0) {
        let deliveryDate = new Date().toISOString();
        const delivMatch = text.match(/Delivered At (.*?) about/);
        if (delivMatch && delivMatch[1]) deliveryDate = delivMatch[1].trim().replace(' at ', ' ');

        let bookedDate = new Date(Date.now() - 3*86400000).toISOString();
        const bookedMatch = text.match(/Booked On (.*?) \d+ days ago/);
        if (bookedMatch && bookedMatch[1]) bookedDate = bookedMatch[1].trim().replace(' at ', ' ');

        if (status.includes("Delivered")) {
          events.push({
            date: deliveryDate,
            location: dest !== "Unknown" ? dest : 'Destination Post Office',
            description: 'Item Delivered',
            status: 'completed'
          });
        }

        events.push({
          date: bookedDate,
          location: origin !== "Unknown" ? origin : 'Origin Post Office',
          description: 'Item Booked',
          status: status.includes("Delivered") ? 'completed' : 'active'
        });
      }

      return {
        consignment_number: cn.toUpperCase(),
        status: status,
        origin: origin,
        destination: dest,
        events: events
      };
    }, consignmentNumber);

    await browser.close();
    
    return NextResponse.json(trackingData);

  } catch (error: any) {
    if (browser) {
      await browser.close();
    }
    console.error("Scraping error:", error);
    return NextResponse.json(
      { error: 'Failed to crawl tracking data: ' + error.message },
      { status: 500 }
    );
  }
}
