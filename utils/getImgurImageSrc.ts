import puppeteer from "puppeteer";

const getImgurImageSrc = async (imgurUrl: string) => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(imgurUrl, { timeout: 0 });
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
};

export default getImgurImageSrc;
