<script lang="ts">
  import DevicesLister from './devices_lister/index.svelte';
  import WorkspaceLinker from './workspace_linker/index.svelte';
  import ConnectionsList from './connections_list/index.svelte';
</script>

<div class="mt-7">
  <p
    class="text-sm color-[color-mix(in_srgb,var(--color-base-content)_70%,black)] py-5 pl-6"
  >
    Nearby Devices
  </p>
  <DevicesLister />
  <p
    class="text-sm color-[color-mix(in_srgb,var(--color-base-content)_70%,black)] py-5 pl-6"
  >
    Connections Map
  </p>
  <WorkspaceLinker />
  <p
    class="text-sm color-[color-mix(in_srgb,var(--color-base-content)_70%,black)] py-5 pl-6"
  >
    Connections List
  </p>
  <ConnectionsList />
</div>
