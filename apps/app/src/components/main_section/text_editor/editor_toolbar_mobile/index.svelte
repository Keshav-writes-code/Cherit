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

<ul
  transition:fade={{ duration: 100 }}
  class="menu menu-horizontal bg-base-200 color-[color-mix(in_srgb,var(--color-base-content)_70%,black)] absolute bottom-0 rounded-box w-full max-w-full py-0 h-10"
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
        <div class="{item.icon_class} size-5.5"></div>
      </button>
    </li>
  {/each}
</ul>
