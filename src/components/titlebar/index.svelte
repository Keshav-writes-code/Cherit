<script>
  import { getCurrentWindow } from "@tauri-apps/api/window";
  const appWindow = getCurrentWindow();
</script>

<div
  class="  w-full h-8 min-h-8 z-1 flex justify-end bg-neutral-content/10 relative"
  data-tauri-drag-region
>
  <div class="flex *:px-3.5 *:hover:bg-white/10 color-white">
    <button
      id="titlebar-minimize"
      onclick={() => {
        appWindow.minimize();
      }}
      title="minimize"
    >
      <div class="i-tabler:minus size-4"></div>
    </button>
    <button
      id="titlebar-maximize"
      onclick={() => {
        appWindow.toggleMaximize();
      }}
      title="maximize"
    >
      <div class="i-tabler:square size-3"></div>
    </button>
    <button
      id="titlebar-close"
      onclick={() => {
        appWindow.close();
      }}
      title="close"
    >
      <div class="i-tabler:x size-4"></div>
    </button>
  </div>
</div>
