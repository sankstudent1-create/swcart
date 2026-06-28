async function testScriptFetch() {
  const restKey = "e5287c2e8e625032961522666d3693e7";

  const urls = [
    `https://apis.mapmyindia.com/advancedmaps/v1/${restKey}/map_sdk?v=2.0`,
    `https://apis.mapmyindia.com/advancedmaps/api/${restKey}/map_sdk?v=2.0`,
    `https://apis.mappls.com/advancedmaps/api/${restKey}/map_sdk?v=2.0`,
    `https://apis.mapmyindia.com/advancedmaps/v1/${restKey}/map_sdk?v=3.0`,
    `https://apis.mappls.com/advancedmaps/api/${restKey}/map_sdk?v=3.0`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Origin": "http://localhost:3000",
          "Referer": "http://localhost:3000/"
        }
      });
      console.log(`URL: ${url}`);
      console.log(`Status: ${res.status} (${res.statusText})`);
      if (res.status === 200) {
        const text = await res.text();
        console.log(`Successfully fetched script size: ${text.length} chars.`);
      }
    } catch (e) {
      console.error(`Failed to fetch ${url}:`, e.message);
    }
  }
}

testScriptFetch();
