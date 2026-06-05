import puppeteer from "puppeteer";

export async function generateInvoice(html, outputPath) {
  try {
    console.log("🟢 Starting Puppeteer");

    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: puppeteer.executablePath(),
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ]
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0"
    });

    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true
    });

    await browser.close();

    console.log("✅ PDF generated:", outputPath);
  } catch (err) {
    console.error("❌ Puppeteer error:", err);
    throw err;
  }
}
