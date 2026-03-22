<script lang="ts">
  import DevicesLister from './devices_lister/index.svelte';
</script>

<div class="mt-7">
  <p
    class="text-sm color-[color-mix(in_srgb,var(--color-base-content)_70%,black)] py-5 pl-6"
  >
    Nearby Devices
  </p>
  <ul class=" bg-base-100 rounded-box">
    <li><DevicesLister /></li>
    <li class="divider p-0 m-0 h-min px-6"></li>
  </ul>
</div>
