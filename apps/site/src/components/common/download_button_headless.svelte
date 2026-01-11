<script lang="ts">
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";

  interface Props {
    class?: string;
    children?: Snippet;
  }
  let { class: classes, children }: Props = $props();

  let owner = "keshav-writes-code";
  let repo = "cherit";

  // Default to the generic releases page
  let downloadUrl = $state(
    `https://github.com/${owner}/${repo}/releases/latest`,
  );
  let label = $state("Download");

  onMount(async () => {
    // 1. Detect OS immediately (no API needed) to set the Label and Fallback URL
    const ua = navigator.userAgent.toLowerCase();
    let filenamePart = ""; // Used to guess the 'latest' filename

    if (ua.includes("android")) {
      label = "Download for Android";
      filenamePart = "android-universal.apk";
    } else if (ua.includes("win")) {
      label = "Download for Windows";
      filenamePart = "windows-x64.exe";
    } else if (ua.includes("mac")) {
      label = "Download for macOS";
      filenamePart = "darwin-x64.dmg"; // Assuming intel/universal fallback
    } else if (ua.includes("linux")) {
      label = "Download for Linux";
      // Specific distro checks
      if (
        ua.includes("debian") ||
        ua.includes("ubuntu") ||
        ua.includes("mint")
      ) {
        filenamePart = "linux-amd64.deb";
      } else if (ua.includes("fedora") || ua.includes("red hat")) {
        filenamePart = "linux-x86_64.rpm";
      } else {
        filenamePart = "linux-amd64.AppImage";
      }
    } else {
      label = "Download"; // Unknown OS
    }

    // 2. Try to verify the exact asset URL via API
    // (This ensures the asset actually exists on the latest release)
    try {
      const resp = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
      );

      if (resp.ok) {
        const { assets } = await resp.json();

        // Try to find the exact detected file in the asset list
        // We search for the specific part determined above (e.g. ".deb" or "universal.apk")
        if (filenamePart) {
          // We use the specific `filenamePart` logic to filter your known naming convention
          // This handles your request for "cherit-latest-linux.deb" vs versioned ones
          // depending on what actually exists in the release.
          const match = assets.find(
            (a: any) =>
              a.name.toLowerCase().endsWith(filenamePart.toLowerCase()) || // Exact match suffix
              a.name.toLowerCase().includes(filenamePart.toLowerCase()), // Partial match
          );

          if (match) {
            downloadUrl = match.browser_download_url;
          } else {
            // If we couldn't find the exact file in the API list,
            // but we know your build process uploads "cherit-latest-...",
            // we can try to construct the URL manually using the tag from the JSON
            // or just fall back to the generic latest download link structure:
            // https://github.com/user/repo/releases/latest/download/filename
            downloadUrl = `https://github.com/${owner}/${repo}/releases/latest/download/cherit-latest-${filenamePart.replace("cherit-latest-", "")}`;
            // Note: The logic above is a safety net.
            // Ideally, the API `match` works best.
          }
        }
      }
      // If API fails (403/Rate Limit), we leave downloadUrl as the main releases page
      // but the Label is already set correctly ("Download for Windows")!
    } catch (e) {
      console.error("Auto-download check failed", e);
    }
  });
</script>

<a href={downloadUrl} class={classes} target="_blank" rel="noopener noreferrer">
  <div class="i-tabler:download size-6"></div>
  {label}
  {#if children}
    {@render children()}
  {/if}
</a>
