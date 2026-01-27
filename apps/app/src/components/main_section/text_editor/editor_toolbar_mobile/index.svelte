<script lang="ts">
  import { fade } from 'svelte/transition';
  import { get_toolbar_buttons } from './toolbar_buttons';
  import { EditorView } from '@codemirror/view';

  let {
    editor_view,
    class: classes,
  }: { editor_view: EditorView; class?: string } = $props();
  const vp = window.visualViewport;
  let elem = $state<HTMLDivElement>();
  function resize() {
    if (!vp || !elem?.parentElement) return;
    elem.parentElement.style.height = vp.height + 'px';
    window.scrollTo(0, 0);
  }
  if (vp) {
    vp.addEventListener('resize', resize);
    vp.addEventListener('scroll', resize);
    resize();
  }
</script>

<div class="absolute bottom-2 w-full px-2 h-11 {classes}" bind:this={elem}>
  <ul
    transition:fade={{ duration: 100 }}
    class="menu menu-horizontal overflow-x-auto flex-nowrap bg-[oklch(from_var(--color-base-100)_calc(l*1.2)_c_h)] b-y-1 b-t-[oklch(from_var(--color-base-100)_calc(l*1.4)_c_h)] b-b-[oklch(from_var(--color-base-100)_calc(l*0.9)_c_h)] shadow-md color-[color-mix(in_srgb,var(--color-base-content)_70%,black)] rounded-field w-full h-full p-0"
  >
    {#each get_toolbar_buttons(editor_view) as item}
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
