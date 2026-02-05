<script lang="ts">
  import LMConfig from './lm_config/index.svelte';
</script>

<div class="mt-7">
  <p
    class="text-sm color-[color-mix(in_srgb,var(--color-base-content)_70%,black)] py-5 pl-6"
  >
    Language Model
  </p>
  <ul class=" bg-base-100 rounded-box">
    <li><LMConfig /></li>
    <li class="divider p-0 m-0 h-min px-6"></li>
  </ul>
</div>
