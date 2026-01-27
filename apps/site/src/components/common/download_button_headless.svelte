<script lang="ts">
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: classes = "", children }: Props = $props();
  const owner = "keshav-writes-code";
  const repo = "cherit";

  let ua = $state("");
  let baseUrl = `https://github.com/${owner}/${repo}/releases/latest/download`;

  onMount(() => {
    ua = navigator.userAgent.toLowerCase();
  });

  const config = $derived.by(() => {
    const file = (suffix: string) => `${baseUrl}/${repo}-${suffix}`;

    if (ua.includes("android")) {
      return {
        main: { label: "Android Arm64 (apk)", url: file("android-arm64.apk") },
        others: [{ label: "Android (apk)", url: file("android-arm.apk") }],
      };
    }
    if (ua.includes("win")) {
      return {
        main: { label: "Windows (exe)", url: file("windows-x64.exe") },
        others: [{ label: "Windows (msi)", url: file("windows-x64.msi") }],
      };
    }
    if (ua.includes("mac")) {
      return {
        main: {
          label: "macOS Apple Silicon (dmg)",
          url: file("darwin-aarch64.dmg"),
        },
        others: [
          { label: "macOS (dmg)", url: file("darwin-x64.dmg") },
          { label: "macOS (tar.gz)", url: file("darwin-x64.app.tar.gz") },
        ],
      };
    }
    if (ua.includes("linux")) {
      const isDeb =
        ua.includes("debian") || ua.includes("ubuntu") || ua.includes("mint");
      const isRpm =
        ua.includes("fedora") || ua.includes("red hat") || ua.includes("suse");

      const deb = { label: "Linux (deb)", url: file("linux-amd64.deb") };
      const rpm = { label: "Linux (rpm)", url: file("linux-x86_64.rpm") };
      const app = {
        label: "Linux (AppImage)",
        url: file("linux-amd64.AppImage"),
      };

      if (isDeb) return { main: deb, others: [rpm, app] };
      if (isRpm) return { main: rpm, others: [deb, app] };
      return { main: app, others: [deb, rpm] };
    }

    return {
      main: {
        label: "",
        url: `https://github.com/${owner}/${repo}/releases/latest`,
      },
      others: [],
    };
  });
</script>

<div class="join">
  <a href={config.main.url} class="{classes} join-item" target="_blank">
    {#if children}{@render children()}{/if}
    <span class="ml-2"
      >{config.main.label
        ? `Download for ${config.main.label}`
        : "Download"}</span
    >
  </a>

  {#if config.others.length > 0}
    <div class="dropdown dropdown-end join-item">
      <div tabindex="0" role="button" class="{classes} join-item px-3">
        <div class="i-tabler:chevron-down size-5"></div>
      </div>
      <ul
        tabindex="0"
        class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-100"
      >
        {#each config.others as item}
          <li><a href={item.url} target="_blank">{item.label}</a></li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
