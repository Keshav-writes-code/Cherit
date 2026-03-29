<script lang="ts">
  import {
    SvelteFlow,
    Background,
    Position,
    type IsValidConnection,
  } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';

  let cols = $state(4);
  let rows = $state(3);

  let nodes = $derived([
    ...Array.from({ length: cols }, (_, i) => ({
      id: i.toString(),
      position: { x: i * 400, y: 0 },
      data: { label: `${i}th Device` },
      style:
        'background-color: oklch(.293 .066 243.157/20%); width: 230px; height: 300px;',
      type: 'group',
      class: 'light',
    })),
    ...Array.from({ length: cols * rows }, (_, i) => {
      const device_index = Math.floor(i / rows);
      const workspace_index = i % rows;
      return {
        id: `${device_index}-${workspace_index}`,
        position: { x: 40, y: 30 + workspace_index * 50 },
        data: { label: `Workspace ${workspace_index + 1}` },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        parentId: device_index.toString(),
        extent: 'parent' as const,
        class: 'light',
      };
    }),
  ]);

  let edges = $state.raw([]);

  const is_valid_connection: IsValidConnection = (con) => {
    if (!con.source || !con.target) return false;
    const [source_device] = con.source.split('-');
    const [target_device] = con.target.split('-');
    return source_device !== target_device;
  };
</script>

<div class="w-full h-100 rounded-box overflow-hidden">
  <SvelteFlow
    bind:nodes
    bind:edges
    fitView
    colorMode="dark"
    isValidConnection={is_valid_connection}
  >
    <Background />
  </SvelteFlow>
</div>
<input type="range" min="0" max="10" bind:value={rows} />
<input type="range" min="0" max="10" bind:value={cols} />

<style>
  :global {
    .svelte-flow__handle {
      width: 100% !important;
      height: 100% !important;
      opacity: 0 !important; /* Make them invisible */
      top: 0 !important;
      left: 0 !important;
      transform: none !important;
      border-radius: 0 !important;
    }
    .svelte-flow__handle-source {
      z-index: 10 !important;
    }
    .svelte-flow.connecting .svelte-flow__handle-target {
      z-index: 20 !important;
    }
  }
</style>
