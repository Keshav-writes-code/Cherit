<script lang="ts">
  import { context_menu } from '@/stores/context_menu.svelte';
  import { fly } from 'svelte/transition';

  // Helper to handle click and close immediately
  function handle_click(action?: () => void) {
    if (action) action();
    context_menu.close();
  }

  // Calculate position styles (you can add logic here later to keep it on screen)
  // For now, simple fixed positioning
</script>

<svelte:window
  onclick={() => context_menu.close()}
  onscroll={() => context_menu.close()}
  onblur={() => context_menu.close()}
/>

{#if context_menu.visible}
  <ul
    transition:fly={{ duration: 100, y: -5 }}
    class="menu menu-sm b-1 w-max b-[color-mix(in_srgb,var(--color-base-content)_22%,black)] bg-base-200 rounded-box fixed z-[9999] w-56 shadow-xl border border-base-300"
    style="top: {context_menu.y}px; left: {context_menu.x}px;"
    oncontextmenu={(e) => e.preventDefault()}
  >
    {#each context_menu.items as item}
      {#if item.divider}
        <li class="my-1 border-b border-base-content/10"></li>
      {:else}
        <li>
          <button
            onclick={() => handle_click(item.action)}
            class:text-error={item.type === 'danger'}
            class:text-warning={item.type === 'warning'}
          >
            <div class={item.icon_class}></div>
            {item.label}
          </button>
        </li>
      {/if}
    {/each}
  </ul>
{/if}
