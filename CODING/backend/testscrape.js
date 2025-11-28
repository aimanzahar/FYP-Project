const puppeteer = require("puppeteer");

async function scrapeFirstProduct() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const url = "https://www.tmt.my/collections?category%5B%5D=graphics-card";
  console.log("Navigating to:", url);
  await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });

  // Take a screenshot BEFORE waiting for the selector (for debugging)
  await page.screenshot({ path: "page.png", fullPage: true });
  console.log("📸 Screenshot saved as page.png (check what the browser sees)");

  // Wait for the first product card to appear
  await page.waitForSelector(".col-lg-4.col-6.add-margin-btm", { timeout: 30000 });

  // Click the first product
  const firstProduct = (await page.$$(".col-lg-4.col-6.add-margin-btm"))[0];
  if (!firstProduct) {
    console.log("❌ No products found!");
    await browser.close();
    return;
  }

  console.log("🖱 Clicking the first product...");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    firstProduct.click(),
  ]);

  console.log("✅ Product page loaded.");

  // Extract product info
  const product = await page.evaluate(() => {
    const titleEl = document.querySelector(".product-title");
    const priceEl = document.querySelector(".price span.money");
    const descEl = document.querySelector(".rte, .product-description");

    return {
      title: titleEl ? titleEl.innerText.trim() : "N/A",
      price: priceEl ? priceEl.innerText.trim() : "N/A",
      description: descEl ? descEl.innerText.trim().slice(0, 200) + "..." : "N/A",
      url: window.location.href,
    };
  });

  console.log("📦 Product details:");
  console.log(product);

  await browser.close();
}

scrapeFirstProduct().catch((err) => console.error("❌ Error:", err));
