const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('C:/Users/swanv/Downloads/swcart/scraped_results2.html', 'utf8');
const $ = cheerio.load(html);

// Print all text in main content
console.log($('main').text().replace(/\s+/g, ' ').substring(0, 1000));
