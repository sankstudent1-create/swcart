const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('C:/Users/swanv/Downloads/swcart/scraped_results2.html', 'utf8');
const $ = cheerio.load(html);

console.log("--- Tables ---");
$('table').each((i, table) => {
  console.log(`Table ${i}:`);
  $(table).find('tr').each((j, tr) => {
    console.log(`  Row ${j}: ` + $(tr).text().replace(/\s+/g, ' ').trim());
  });
});

console.log("--- Lists ---");
$('ul, ol').each((i, list) => {
  if ($(list).text().includes("Item Booked") || $(list).text().includes("Item Delivered") || $(list).text().includes("2026")) {
    console.log(`List ${i}:`);
    $(list).find('li').each((j, li) => {
      console.log(`  Item ${j}: ` + $(li).text().replace(/\s+/g, ' ').trim());
    });
  }
});

console.log("--- Timeline / Events classes ---");
$('.timeline, .events, .tracking-card, .timeline-item').each((i, el) => {
  console.log(`Element ${i}: ` + $(el).text().replace(/\s+/g, ' ').trim());
});
