<script lang="ts">
  import { base } from "astro:config/client";
  import type { Snippet } from "svelte";
  import { slide } from "svelte/transition";

  let {
    git_star_count,
    nav_links,
    logo,
  }: {
    git_star_count: number;
    nav_links: Record<string, string>;
    logo?: Snippet;
  } = $props();

  let y = $state(0);
  let expand_navbar_mobile = $state(false);
  let git_star_count_client_side = $state();
  (async () => {
    git_star_count_client_side = (
      await (
        await fetch("https://api.github.com/repos/Keshav-writes-code/Cherit")
      ).json()
    ).stargazers_count;
  })();
</script>

<svelte:window bind:scrollY={y} />
<header
  class="h-max w-full rounded-box mt-3 b-1 transition-all duration-600 ease-[linear(0,0.39_5.5%,0.679_11.5%,0.878_18.2%,0.947_21.9%,0.998_25.9%,1.039_32.1%,1.053_39.6%,1.007_71.3%,1)]
  {y <= 0 && !expand_navbar_mobile
    ? ' b-transparent  '
    : `lg:w-70% b-[color-mix(in_srgb,var(--color-base-content)_20%,black)] shadow-xl  bg-gray-500 bg-clip-padding backdrop-blur-3px bg-opacity-10 backdrop-saturate-120  bg-[url('data:image/svg+xml;base64,CiAgICAgIDxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWxuczpzdmdqcz0iaHR0cDovL3N2Z2pzLmRldi9zdmdqcyIgdmlld0JveD0iMCAwIDcwMCA3MDAiIHdpZHRoPSI3MDAiIGhlaWdodD0iNzAwIiBvcGFjaXR5PSIwLjE5Ij4KICAgICAgICA8ZGVmcz4KICAgICAgICAgIDxmaWx0ZXIgaWQ9Im5ubm9pc2UtZmlsdGVyIiB4PSItMjAlIiB5PSItMjAlIiB3aWR0aD0iMTQwJSIgaGVpZ2h0PSIxNDAlIiBmaWx0ZXJVbml0cz0ib2JqZWN0Qm91bmRpbmdCb3giIHByaW1pdGl2ZVVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJsaW5lYXJSR0IiPgogICAgICAgICAgICA8ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC4yIiBudW1PY3RhdmVzPSI0IiBzZWVkPSIxNSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgeD0iMCUiIHk9IjAlIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiByZXN1bHQ9InR1cmJ1bGVuY2UiPjwvZmVUdXJidWxlbmNlPgogICAgICAgICAgICA8ZmVTcGVjdWxhckxpZ2h0aW5nIHN1cmZhY2VTY2FsZT0iNCIgc3BlY3VsYXJDb25zdGFudD0iMC43IiBzcGVjdWxhckV4cG9uZW50PSIyMCIgbGlnaHRpbmctY29sb3I9IiM3OTU3QTgiIHg9IjAlIiB5PSIwJSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgaW49InR1cmJ1bGVuY2UiIHJlc3VsdD0ic3BlY3VsYXJMaWdodGluZyI+CiAgICAgICAgICAgICAgPGZlRGlzdGFudExpZ2h0IGF6aW11dGg9IjMiIGVsZXZhdGlvbj0iMTAwIj48L2ZlRGlzdGFudExpZ2h0PgogICAgICAgICAgICA8L2ZlU3BlY3VsYXJMaWdodGluZz4KICAgICAgICAgICAgPGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIgeD0iMCUiIHk9IjAlIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBpbj0ic3BlY3VsYXJMaWdodGluZyIgcmVzdWx0PSJjb2xvcm1hdHJpeCI+PC9mZUNvbG9yTWF0cml4PgogICAgICAgICAgPC9maWx0ZXI+CiAgICAgICAgPC9kZWZzPgogICAgICAgIDxyZWN0IHdpZHRoPSI3MDAiIGhlaWdodD0iNzAwIiBmaWxsPSJ0cmFuc3BhcmVudCI+PC9yZWN0PgogICAgICAgIDxyZWN0IHdpZHRoPSI3MDAiIGhlaWdodD0iNzAwIiBmaWxsPSIjNzk1N2E4IiBmaWx0ZXI9InVybCgjbm5ub2lzZS1maWx0ZXIpIj48L3JlY3Q+CiAgICAgIDwvc3ZnPgogICAg')] bg-blend-overlay`} 
  {expand_navbar_mobile && ' backdrop-brightness-40% '}
  "
  id="navbar"
>
  <div class="h-18 w-full p-4 grid grid-cols-3 lt-md:grid-cols-2">
    <a
      class="font-nightingale justify-self-start font-recoleta gap-2 h-full items-center flex text-2xl"
      href={base}
    >
      {#if logo}
        {@render logo()}
      {/if}
      <p>Cherit</p>
    </a>
    <nav
      class="flex flex-row gap-1 items-center font-semibold justify-self-center lt-md:hidden"
    >
      {#each Object.entries(nav_links) as [key, value]}
        <a class="capitalize btn btn-ghost" href={value}>{key}</a>
      {/each}
    </nav>
    <div class=" flex items-center gap-2 justify-self-end lt-md:hidden">
      <a
        href="https://github.com/Keshav-writes-code/Cherit"
        class="btn btn-ghost flex items-center font-mono"
        target="_blank"
      >
        <div class="i-mdi:github size-5.5"></div>

        {#if git_star_count_client_side}
          {git_star_count_client_side}
        {:else}
          {git_star_count}
        {/if}
      </a>
    </div>
    <div class="h-full md:hidden justify-self-end">
      <input
        id="navbar-expand"
        type="checkbox"
        class=" hidden"
        bind:checked={expand_navbar_mobile}
      />
      <label for="navbar-expand" class="h-full p-2 aspect-square btn">
        <div class="icon-off i-tabler:menu-2 size-full"></div>
        <div class="icon-on i-tabler:x size-full"></div>
      </label>
    </div>
  </div>
  {#if expand_navbar_mobile}
    {@const links_arr = Object.entries(nav_links)}
    <div class="w-full h-full" transition:slide>
      <nav class="flex flex-col gap-1 font-semibold">
        <ul class="menu menu-lg rounded-box w-full">
          {#each links_arr as [key, value], i}
            <li
              class="animate-in slide-in-b-2 fade-in-0 animate-duration-500 animate-fill-both"
              style="animation-delay: {200 + 50 * i}ms;"
            >
              <a class="capitalize" href={value}>{key}</a>
            </li>
          {/each}
          <li
            class="mt-4 animate-in slide-in-b-2 fade-in-0 animate-duration-500 animate-fill-both"
            style="animation-delay: {200 + 50 * (links_arr.length + 2)}ms;"
          >
            <a
              href="https://github.com/Keshav-writes-code/Cherit"
              class="btn flex items-center"
              target="_blank"
            >
              <div class="i-mdi:github size-5.5"></div>

              {#if git_star_count_client_side}
                {git_star_count_client_side}
              {:else}
                {git_star_count}
              {/if}
            </a>
          </li>
        </ul>
      </nav>
    </div>
  {/if}
</header>

<style>
  #navbar-expand:checked + label .icon-off {
    display: none;
  }

  #navbar-expand:not(:checked) + label .icon-on {
    display: none;
  }
</style>
