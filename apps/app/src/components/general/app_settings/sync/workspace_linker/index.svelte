<script lang="ts">
  import { SvelteFlow, Background, Position } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  // let nodes = $state.raw([
  //   { id: '1', position: { x: 0, y: 0 }, data: { label: '1' } },
  //   { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } },
  // ]);
  let nodes = $state.raw([
    ...Array.from({ length: 4 }, (_, i) => ({
      id: i.toString(),
      position: { x: i * 400, y: 0 },
      data: { label: `${i}th Device` },
      style:
        'background-color: oklch(.293 .066 243.157/20%); width: 230px; height: 300px;',
      type: 'group',
      class: 'light',
    })),
    ...Array.from({ length: 12 }, (_, i) => ({
      id: i.toString() + 'node',
      position: { x: 40, y: 30 + (i % 4) * 50 },
      data: { label: `Workspace ${i}` },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      parentId: `${Math.floor(i / 3)}`,
      extent: 'parent' as const,
      class: 'light',
    })),
  ]);

  let edges = $state.raw([{ id: 'e1-2', source: '1', target: '2' }]);
</script>

<div class="w-full h-100 rounded-box overflow-hidden">
  <SvelteFlow bind:nodes bind:edges fitView colorMode="dark">
    <Background />
  </SvelteFlow>
</div>
