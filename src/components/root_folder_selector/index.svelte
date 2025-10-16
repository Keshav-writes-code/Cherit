<script lang="ts">
  import { open } from "@tauri-apps/plugin-dialog";
  let state_open = $state(true);
  $effect(() => {
    if (root_path) state_open = false;
  });
  let { root_path = $bindable() }: { root_path: string | undefined } = $props();
</script>

<dialog id="my_modal_1" open={state_open} class="modal">
  <div class="modal-box p-0 size-80% max-w-none flex max-w-250">
    <div class="w-80 bg-base-content/10"></div>
    <div class="grow px-10 pt-15 flex flex-col">
      <div class="w-full flex flex-col items-center">
        <img alt="logo" class="size-30" src="logo_500.png" />
        <p class="font-[Recoleta] leading-normal mt-3 capitalize text-4xl">
          {__APP_NAME__}
        </p>
        <p class="text-gray">Version {__APP_VERSION__}</p>
      </div>
      <div class="w-full flex justify-between mt-20 b-b-neutral/30 pb-3 b-b-1">
        <div>
          <p class="leading-relaxed">Open Folder as Vault</p>
          <p class="text-sm text-gray">
            Choose an existing folder for Markdown Files
          </p>
        </div>
        <button
          class="btn btn-primary w-30"
          onclick={async () => {
            const file = await open({
              multiple: false,
              directory: true,
            });
            if (file) root_path = file;
          }}>Open</button
        >
      </div>
    </div>
  </div>
</dialog>
