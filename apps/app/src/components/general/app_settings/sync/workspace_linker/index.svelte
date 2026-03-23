<script lang="ts">
  import { SvelteFlow, Background } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  let nodes = $state.raw([
    { id: '1', position: { x: 0, y: 0 }, data: { label: '1' } },
    { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } },
  ]);

  let edges = $state.raw([{ id: 'e1-2', source: '1', target: '2' }]);
</script>

<div class="w-full h-100">
  <SvelteFlow bind:nodes bind:edges fitView>
    <Background />
  </SvelteFlow>
</div>
