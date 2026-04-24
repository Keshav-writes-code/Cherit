<script lang="ts">
  import DevicesLister from './devices_lister/index.svelte';
  import WorkspaceLinker from './workspace_linker/index.svelte';
  import ConnectionsList from './connections_list/index.svelte';
  import Profile from './profile/index.svelte';
</script>

<div class="mt-7">
  <Profile />

  <p
    class="text-sm color-[color-mix(in_srgb,var(--color-base-content)_70%,black)] py-5 pl-6 flex"
  >
    Nearby Devices
    <span
      class="ml-2 color-[color-mix(in_srgb,var(--color-primary)_30%,white)] loading loading-ring loading-sm text-primary"
    ></span>
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
