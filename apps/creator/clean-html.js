/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const buildDir = path.join(__dirname, "out");

function processHtmlFile(filePath) {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error(`Error reading file ${filePath}:`, err);
      return;
    }

    const $ = cheerio.load(data);

    // Remove all script tags
    $("script").remove();

    // Remove rel attribute in link tags
    $('link[rel="preload"]').removeAttr("rel");

    // Find the <link> tag and create a <script> tag
    $('link[href="/popup.js"]').each(function () {
      const scriptTag = `<script src="${$(this).attr("href")}" defer="true"></script>`;
      $(this).replaceWith(scriptTag); // Replace <link> with <script>
    });

    // Remove meta[name="next-size-adjust"]
    // $('meta[name="next-size-adjust"]').remove();

    // Keep only the essential content in the body
    const essentialContent = $("body > div").html();
    $("body").html(essentialContent);

    // Generate the final HTML
    const finalHtml = $.html();

    fs.writeFile(filePath, finalHtml, "utf8", (writeErr) => {
      if (writeErr) {
        console.error(`Error writing file ${filePath}:`, writeErr);
      } else {
        console.log(`Processed: ${filePath}`);
      }
    });
  });
}

function processDirectory(dir) {
  fs.readdir(dir, { withFileTypes: true }, (err, files) => {
    if (err) {
      console.error(`Error reading directory ${dir}:`, err);
      return;
    }

    files.forEach((file) => {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        processDirectory(fullPath);
      } else if (file.name.endsWith(".html")) {
        processHtmlFile(fullPath);
      }
    });
  });
}

processDirectory(buildDir);
