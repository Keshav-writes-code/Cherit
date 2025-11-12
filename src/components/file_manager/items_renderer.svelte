<script lang="ts">
  import type { FileNode } from "@/types";
  import ItemsRenderer from "@/components/file_manager/items_renderer.svelte";
  let {
    opened_filenode = $bindable(),
    file_tree,
    root_path,
    collapsed_state,
  }: {
    opened_filenode: FileNode | undefined;
    file_tree: FileNode[];
    root_path: string | undefined;
    collapsed_state: boolean;
  } = $props();
  const isDirectChild = (r: string, f: string) =>
    f.replace(/\/+$/, "").startsWith(r.replace(/\/+$/, "")) &&
    f
      .replace(/\/+$/, "")
      .slice(r.replace(/\/+$/, "").length)
      .split("/")
      .filter((s) => s).length === 1;
</script>

{#if root_path && file_tree[0]}
  <ul
    class="{isDirectChild(root_path, file_tree[0].path)
      ? 'menu menu-sm rounded-box w-full select-none flex-1 overflow-y-auto flex-nowrap text-[color-mix(in_srgb,var(--color-base-content)_80%,black)] text-ellipsis leading-relaxed tracking-wide'
      : 'menu-dropdown max-w-full'} relative gap-0.5 pt-0.5"
    class:menu-dropdown-show={collapsed_state}
  >
    {#each file_tree as node (node.path)}
      <li class="max-w-full relative">
        {#if node.isDirectory}
          <!-- new implementation -->
          <button
            class="menu-dropdown-toggle truncate max-w-full relative"
            class:menu-dropdown-show={collapsed_state}
            onclick={(e: MouseEvent) => {
              const target = e.currentTarget as HTMLButtonElement;
              const ul = target.nextElementSibling as HTMLUListElement;
              target.classList.toggle("menu-dropdown-show");
              ul.classList.toggle("menu-dropdown-show");
            }}
          >
            {node.name}
          </button>
          <ItemsRenderer
            bind:opened_filenode
            file_tree={node.children}
            {root_path}
            {collapsed_state}
          />
        {:else}
          <button
            class="{opened_filenode?.path === node.path
              ? 'bg-base-content/10'
              : ''} py-0.75 max-w-full hover:text-[color-mix(in_srgb,var(--color-base-content)_85%,black)] truncate block"
            onclick={() => {
              opened_filenode = node;
            }}
            >{node.name}
          </button>
        {/if}
      </li>
    {/each}
  </ul>
{/if}

<style>
  .menu-dropdown-toggle::after {
    content: none;
  }
  .menu-dropdown-toggle::before {
    content: "";
    width: 0.375rem;
    height: 0.375rem;
    box-shadow: inset 2px 2px
      color-mix(in srgb, var(--color-base-content) 40%, black);
    transform-origin: 50%;
    rotate: 135deg;
    transition-property: rotate;
    transition-duration: 0.2s;
  }

  .menu :where(li > details[open] > summary):before,
  .menu :where(li > .menu-dropdown-toggle.menu-dropdown-show):before {
    rotate: 225deg;
  }
</style>
