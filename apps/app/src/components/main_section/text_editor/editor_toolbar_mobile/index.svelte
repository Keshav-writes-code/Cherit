<script lang="ts">
  import { fade } from 'svelte/transition';
  import { toolbar_buttons } from './toolbar_buttons';
  const vp = window.visualViewport;
  function resize() {
    if (!vp) return;
    document.body.style.height = vp.height + 'px';
    window.scrollTo(0, 0);
  }
  if (vp) {
    vp.addEventListener('resize', resize);
    vp.addEventListener('scroll', resize);
    resize();
  }
</script>

<div class="absolute bottom-2 w-full px-2 h-11">
  <ul
    transition:fade={{ duration: 100 }}
    class="menu menu-horizontal overflow-x-auto flex-nowrap btn-soft bg-[var(--btn-bg)] color-[color-mix(in_srgb,var(--color-base-content)_70%,black)] rounded-box w-full h-full"
  >
    {#each toolbar_buttons as item}
      <li>
        <button
          class="btn btn-ghost btn-xs p-0 px-1.5 h-full"
          aria-label={item.label}
          onpointerdown={(e) => e.preventDefault()}
          onclick={(e) => {
            e.preventDefault();
            if (item.action) item.action();
          }}
        >
          <div class="{item.icon_class} size-7"></div>
        </button>
      </li>
    {/each}
  </ul>
</div>
