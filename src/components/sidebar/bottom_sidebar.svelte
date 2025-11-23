<script lang="ts">
  let { root_path }: { root_path: string | undefined } = $props();
</script>

<div
  class="w-full b-t-1 b-t-[color-mix(in_srgb,var(--color-base-content)_22%,black)]"
>
  <ul class="menu menu-xs bg-base-200 rounded-box w-full">
    <li>
      <button>
        <div class=" i-famicons:chevron-expand size-4"></div>
        {root_path?.split("/").filter(Boolean).pop()}
      </button>
    </li>
  </ul>
</div>
