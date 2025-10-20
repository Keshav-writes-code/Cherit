<script lang="ts">
  import BreadCrumb from "@/components/breadcrumb_path/index.svelte";
  import type { FileNode } from "@/types";
  let {
    filenode,
    root_path,
  }: { filenode: FileNode | undefined; root_path: string | undefined } =
    $props();

  let html: string | undefined = $state();
  let last_pressed_key = "";

  function add_class_to_hashtags(htmlString: string): string {
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
</script>

<BreadCrumb {filenode} {root_path} />

<div
  bind:innerHTML={html}
  contenteditable="true"
  aria-label="Text editor"
  role="textbox"
  tabindex="0"
  onkeydown={({ key }) => {
    last_pressed_key = key;
  }}
  oninput={(e) => {
    switch (last_pressed_key) {
      case "#":
        console.log("# Detected");
        html = add_class_to_hashtags(e.currentTarget.innerHTML);
        break;

      default:
        break;
    }
  }}
  class="textarea w-full grow overflow-y-auto b-none outline-none shadow-none"
></div>
