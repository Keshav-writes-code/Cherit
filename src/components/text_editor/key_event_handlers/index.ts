export function add_class_to_hashtags(htmlString: string): string {
  const doc = new DOMParser().parseFromString(
    `<div>${htmlString}</div>`,
    "text/html",
  );
  doc.querySelectorAll("div > div").forEach((div) => {
    if (div.textContent?.trim().startsWith("#")) {
      div.classList.add("text-4xl");
    }
  });
  return doc.querySelector("div")?.innerHTML || "";
}
