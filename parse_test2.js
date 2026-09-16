const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('C:/Users/swanv/Downloads/swcart/scraped_results2.html', 'utf8');
const $ = cheerio.load(html);

// Let's dump all text to see what rendered
fs.writeFileSync('C:/Users/swanv/Downloads/swcart/rendered_text.txt', $('body').text().replace(/\s+/g, ' '));
