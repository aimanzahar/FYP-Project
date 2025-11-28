const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false }); // set to `true` if you don't want to see the browser
  const page = await browser.newPage();

  // Replace this URL with the product page you want to scrape
  await page.goto('https://www.tmt.my/products/msi-b760m-gaming-plus-wifi-matx-motherboard', { waitUntil: 'domcontentloaded' });

  const productData = await page.evaluate(() => {
    const title = document.querySelector('.product-detail-title [itemprop="name"]')?.innerText.trim() || null;
    const price = document.querySelector('.inner-product-price .product-ori-price')?.innerText.trim() || null;
    const imageUrl = document.querySelector('.carousel-inner .carousel-item img.photo_zoom')?.src || null;

    const specs = {};
    const rows = document.querySelectorAll('.compare-product.specification table.w-100 tr');
    rows.forEach(row => {
      const th = row.querySelector('th')?.innerText.trim();
      const td = row.querySelector('td')?.innerText.trim();
      if (th && td) {
        specs[th] = td;
      }
    });

    return { title, price, imageUrl, specs };
  });

  console.log(productData);

  await browser.close();
})();
