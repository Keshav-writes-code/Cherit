<script lang="ts">
  import CloudInfrenceConfig from './cloud/index.svelte';
  import LocalInfrenceConfig from './local/index.svelte';
</script>

<div class="tabs bg-base-300 gap-x-2 tabs-box">
  <label
    class="tab duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:color-white transition-all flex gap-1 py-3 px-5 h-max items-center capitalize"
  >
    <input type="radio" name="infrence_selector" checked={true} />
    <div class="i-tabler:shield-lock size-5"></div>
    <span class=" ">Local Infrence</span>
  </label>
  <div class="tab-content bg-base-100 border-base-300 p-6">
    <LocalInfrenceConfig />
  </div>

  <label
    class="tab duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:color-white transition-all flex gap-1 py-3 px-5 h-max items-center capitalize"
  >
    <input type="radio" name="infrence_selector" checked={true} />
    <div class="i-tabler:cloud size-5"></div>
    <span class=" ">Cloud Infrence</span>
  </label>
  <div class="tab-content bg-base-100 border-base-300 p-6">
    <CloudInfrenceConfig />
  </div>
</div>
