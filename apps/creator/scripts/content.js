const article = document.querySelector("article");

const mainElement = document.querySelector("main");

if (mainElement) {
  const mainContent = mainElement.outerHTML;
  console.log("Main Content:", mainContent);
} else {
  console.log("No <main> element found on this page.");
}

function cleanHTML(sourceHTML) {
  // Parse the HTML string into a DOM object
  const parser = new DOMParser();
  const doc = parser.parseFromString(sourceHTML, "text/html");

  // Check if <main> exists in the parsed HTML
  //   const mainContent = doc.querySelector("main");
  const mainContent = doc.querySelector("main");

  if (!mainContent) {
    console.log("No <main> tag found");
    return [];
  }

  // Function to clean individual elements
  function cleanElement(element) {
    // Remove unnecessary attributes
    element.removeAttribute("class");
    element.removeAttribute("id");
    element.removeAttribute("style");
    Array.from(element.attributes).forEach((attr) => {
      if (attr.name.startsWith("data-")) {
        element.removeAttribute(attr.name);
      }
    });

    // If it's an anchor tag (<a>), preserve its href and text
    if (element.tagName.toLowerCase() === "a") {
      const href = element.getAttribute("href");
      const text = element.textContent.trim();
      return { tag: "a", href, text };
    }
    return null; // Return null for non-anchor elements
  }

  const cleanedLinks = [];

  // Iterate over anchor tags within <main>
  const links = mainContent.querySelectorAll("a");
  links.forEach((link) => {
    const cleaned = cleanElement(link);
    if (cleaned) {
      cleanedLinks.push(cleaned);
    }
  });

  return cleanedLinks;
}

// Example usage:
//const htmlContent = `<main><a href="/repo/docs/guides/tools">Tools</a><a href="/repo/docs/guides/single-package-workspaces">Single-package workspaces</a></main>`;
const cleanedData = cleanHTML(mainElement.outerHTML);

console.log("CLEANED DATA:", cleanedData);
