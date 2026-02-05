<script lang="ts">
  import { openUrl } from '@tauri-apps/plugin-opener';
  import { z } from 'zod';

  let {
    model_provider,
    models_list_dialog_open = $bindable(),
    model_name = $bindable(),
  }: {
    model_provider: string | undefined;
    models_list_dialog_open: boolean;
    model_name: string | undefined;
  } = $props();

  const ApiSchema = z.object({
    data: z.array(
      z.object({
        id: z.string(),
        owned_by: z.string(),
      })
    ),
  });

  let models = $state<Array<{ id: string; owned_by: string }>>();
  let fetch_failed = $state(false);

  fetch('https://ai-gateway.vercel.sh/v1/models')
    .then((res) => res.json())
    .then((raw) => {
      const result = ApiSchema.safeParse(raw);
      if (result.success) {
        models = result.data.data.filter(
          (model) => model.owned_by == model_provider
        );
      } else {
        fetch_failed = true;
      }
    })
    .catch((e) => (fetch_failed = true));
</script>

<dialog class="modal" open={models_list_dialog_open}>
  <div class="modal-box max-h-140 flex flex-col">
    <h3 class="font-bold text-lg mb-4">Select Model</h3>

    {#if model_provider}
      <!-- content here -->
      <ul class="menu flex-nowrap w-full min-h-0 h-full overflow-y-auto">
        {#each models as model (model.id)}
          {@const model_id_stripped = model.id.split('/')[1]}
          <li>
            <button
              onclick={() => {
                models_list_dialog_open = false;
                model_name = model_id_stripped;
              }}>{model_id_stripped}</button
            >
          </li>
        {:else}
          {#if fetch_failed}
            Failed to Load model data. <br />
            please mannualy find the model name from your Model Provider's Docs
          {:else if models && !models.length}
            No models found for {model_provider}
          {:else}
            Fetching from internet
          {/if}
        {/each}
      </ul>
    {:else}
      Please select a Model Provider first
    {/if}
    <span class=" py-1 text-base-content/50 text-sm flex gap-1">
      these models are fetched from
      <button
        onclick={async () => {
          await openUrl('https://ai-gateway.vercel.sh/v1/models');
        }}
        class="link link-primary"
      >
        <span class="flex items-center">
          here <div class="i-tabler:arrow-up-right size-4"></div>
        </span>
      </button>
    </span>

    <button
      class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
      onclick={() => (models_list_dialog_open = false)}>✕</button
    >
  </div>
</dialog>
