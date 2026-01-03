<script lang="ts">
  import { base } from "astro:config/client";
  import type { Snippet } from "svelte";

  let {
    git_star_count,
    nav_links,
    logo,
  }: {
    git_star_count: number;
    nav_links: Record<string, string>;
    logo: Snippet;
  } = $props();

  let y = $state(0);
</script>

<svelte:window bind:scrollY={y} />
<header
  class="h-18 p-4 rounded-box mt-3 b-1 transition-all duration-600 grid grid-cols-3 ease-[linear(0,0.39_5.5%,0.679_11.5%,0.878_18.2%,0.947_21.9%,0.998_25.9%,1.039_32.1%,1.053_39.6%,1.007_71.3%,1)]
  {y <= 0
    ? 'w-full b-transparent  '
    : `w-70% b-[color-mix(in_srgb,var(--color-base-content)_20%,black)] shadow-xl [backdrop-filter:_blur(3px)] bg-gray-500 bg-clip-padding backdrop-filter  backdrop-blur bg-opacity-10 backdrop-saturate-100 backdrop-contrast-100 bg-[url('data:image/svg+xml;base64,CiAgICAgIDxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWxuczpzdmdqcz0iaHR0cDovL3N2Z2pzLmRldi9zdmdqcyIgdmlld0JveD0iMCAwIDcwMCA3MDAiIHdpZHRoPSI3MDAiIGhlaWdodD0iNzAwIiBvcGFjaXR5PSIwLjE5Ij4KICAgICAgICA8ZGVmcz4KICAgICAgICAgIDxmaWx0ZXIgaWQ9Im5ubm9pc2UtZmlsdGVyIiB4PSItMjAlIiB5PSItMjAlIiB3aWR0aD0iMTQwJSIgaGVpZ2h0PSIxNDAlIiBmaWx0ZXJVbml0cz0ib2JqZWN0Qm91bmRpbmdCb3giIHByaW1pdGl2ZVVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJsaW5lYXJSR0IiPgogICAgICAgICAgICA8ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC4yIiBudW1PY3RhdmVzPSI0IiBzZWVkPSIxNSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgeD0iMCUiIHk9IjAlIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiByZXN1bHQ9InR1cmJ1bGVuY2UiPjwvZmVUdXJidWxlbmNlPgogICAgICAgICAgICA8ZmVTcGVjdWxhckxpZ2h0aW5nIHN1cmZhY2VTY2FsZT0iNCIgc3BlY3VsYXJDb25zdGFudD0iMC43IiBzcGVjdWxhckV4cG9uZW50PSIyMCIgbGlnaHRpbmctY29sb3I9IiM3OTU3QTgiIHg9IjAlIiB5PSIwJSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgaW49InR1cmJ1bGVuY2UiIHJlc3VsdD0ic3BlY3VsYXJMaWdodGluZyI+CiAgICAgICAgICAgICAgPGZlRGlzdGFudExpZ2h0IGF6aW11dGg9IjMiIGVsZXZhdGlvbj0iMTAwIj48L2ZlRGlzdGFudExpZ2h0PgogICAgICAgICAgICA8L2ZlU3BlY3VsYXJMaWdodGluZz4KICAgICAgICAgICAgPGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIgeD0iMCUiIHk9IjAlIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBpbj0ic3BlY3VsYXJMaWdodGluZyIgcmVzdWx0PSJjb2xvcm1hdHJpeCI+PC9mZUNvbG9yTWF0cml4PgogICAgICAgICAgPC9maWx0ZXI+CiAgICAgICAgPC9kZWZzPgogICAgICAgIDxyZWN0IHdpZHRoPSI3MDAiIGhlaWdodD0iNzAwIiBmaWxsPSJ0cmFuc3BhcmVudCI+PC9yZWN0PgogICAgICAgIDxyZWN0IHdpZHRoPSI3MDAiIGhlaWdodD0iNzAwIiBmaWxsPSIjNzk1N2E4IiBmaWx0ZXI9InVybCgjbm5ub2lzZS1maWx0ZXIpIj48L3JlY3Q+CiAgICAgIDwvc3ZnPgogICAg')] bg-blend-overlay `} "
  id="navbar"
>
  <a
    class="font-nightingale justify-self-start font-recoleta gap-2 h-full items-center flex text-2xl"
    href={base}
  >
    {@render logo()}
    <p>Cherit</p>
  </a>
  <nav
    class="flex flex-row gap-6 items-center font-semibold justify-self-center"
  >
    {#each Object.entries(nav_links) as [key, value]}
      <a class="capitalize" href={value}>{key}</a>
    {/each}
  </nav>
  <div class=" flex items-center gap-2 justify-self-end">
    <a
      href="https://github.com/Keshav-writes-code/Cherit"
      class="btn btn-ghost flex items-center"
      target="_blank"
    >
      <div class="i-mdi:github size-5.5"></div>
      {git_star_count}
    </a>
  </div>
</header>
