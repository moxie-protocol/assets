import puppeteer from "puppeteer";

(async () => {
  try {
    const url = "https://i.imgur.com/EFNHdMB.png";

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { timeout: 0 });
    await page.screenshot({ path: "output.png" });
    const selector = "img.image-placeholder";

    await page.waitForSelector(selector, { timeout: 0 });

    const el = await page.$eval(selector, (img) => img.getAttribute("src"));

    console.log(el);

    // close the browser instance
    await browser.close();
  } catch (error) {
    console.log(error);
  }
})();
