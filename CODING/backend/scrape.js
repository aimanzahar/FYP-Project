const puppeteer = require('puppeteer');
const mysql = require('mysql2/promise');

async function scrapeTmT(categoryBaseUrl, dbTableName) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  let offset = 0;
  let allProducts = [];

  while (true) {
    const paginatedUrl = `${categoryBaseUrl}&per_page=${offset}`;
    console.log(`🌐 Scraping page: ${paginatedUrl}`);

    await page.goto(paginatedUrl, { waitUntil: 'networkidle2' });

    const productLinks = await page.evaluate(() => {
      const baseUrl = window.location.origin;
      return Array.from(document.querySelectorAll('.col-lg-4.col-6.add-margin-btm'))
        .map(el => new URL(el.getAttribute('href'), baseUrl).href);
    });

    const uniqueLinks = [...new Set(productLinks)].slice(0, 5); // Limit to 5 unique links

    // Break if no more products found
    if (uniqueLinks.length === 0) {
      console.log(`✅ No more products found at offset ${offset}. Stopping.`);
      break;
    }

    console.log(`🔗 Found ${uniqueLinks.length} product links`);

    for (const link of uniqueLinks) {
      const productPage = await browser.newPage();
      try {
        await productPage.goto(link, { waitUntil: 'networkidle2' });

        const productData = await productPage.evaluate(() => {
          const title = document.querySelector('.product-detail-title [itemprop="name"]')?.innerText.trim() || null;
          const price = document.querySelector('.inner-product-price .product-ori-price')?.innerText.trim() || null;
          const imageUrl = document.querySelector('.carousel-inner .carousel-item img.photo_zoom')?.src || null;
          return { title, price, imageUrl };
        });

        if (productData.title && productData.price && productData.imageUrl) {
          allProducts.push({ ...productData, url: link });
        } else {
          console.warn(`⚠️ Incomplete data for ${link}`);
        }

      } catch (err) {
        console.error(`❌ Error scraping ${link}:`, err);
      }
      await productPage.close();
      await new Promise(res => setTimeout(res, 3000)); // polite delay
    }

    offset += 24;
  }

  await browser.close();

  // Insert into MySQL
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hardwareforge'
  });

  for (const product of allProducts) {
    const price = parseFloat(product.price.replace(/[^\d.]/g, ''));
    if (isNaN(price)) continue;

    await connection.execute(
      `INSERT INTO ${dbTableName} (name, price, image_url, product_url)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       name=VALUES(name), price=VALUES(price), image_url=VALUES(image_url)`,
      [product.title, price, product.imageUrl, product.url]
    );
  }

  await connection.end();
  console.log(`✅ Scraped and saved ${allProducts.length} products.`);
}

// link and database table name
scrapeTmT('https://www.tmt.my/collections?category%5B%5D=graphics-card', 'gpus');
/*scrapeTmT('https://www.tmt.my/collections?category%5B%5D=processor', 'cpus');
scrapeTmT('https://www.tmt.my/collections?category%5B%5D=motherboard', 'motherboards');
scrapeTmT('https://www.tmt.my/collections?category%5B%5D=desktop-casing', 'cases');
scrapeTmT('https://www.tmt.my/collections?category%5B%5D=memory-ram','rams');
scrapeTmT('https://www.tmt.my/collections?category%5B%5D=ssd','storage');
scrapeTmT('https://www.tmt.my/collections?category%5B%5D=power-supply','psus');
scrapeTmT('https://www.tmt.my/collections?category%5B%5D=cooling-system','cpuCoolers');*/