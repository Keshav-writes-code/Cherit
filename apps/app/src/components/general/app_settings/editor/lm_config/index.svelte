<script lang="ts">
  import { Select } from 'bits-ui';
  import ListModels from './list_models.svelte';
  import { apply_ai_config } from './onclick';
  let model_providers = [
    {
      value: 'openai',
      label: 'Open AI',
      icon: 'i-ri:openai-fill',
      models_docs_link: '',
    },
    { value: 'google', label: 'Google', icon: 'i-ri:google-fill' },
    { value: 'anthropic', label: 'Anthropic', icon: 'i-ri:anthropic-fill' },
  ];
  let sel_provider = $state<string>();
  let api_key = $state<string>();
  let model_id = $state<string>();

  const selected_provider_label = $derived(
    model_providers.find((model) => model.value === sel_provider)?.label
  );
  let models_list_dialog_open = $state(false);
</script>

<div class="p-6 flex flex-col gap-3">
  <div class="flex justify-between items-center">
    <p>Select Model Provider</p>
    <Select.Root
      type="single"
      items={model_providers}
      onValueChange={(v) => (sel_provider = v)}
      allowDeselect={true}
    >
      <Select.Trigger class="input">
        {selected_provider_label || 'Select a Model'}
      </Select.Trigger>
      <Select.Portal>
        <Select.Content>
          <Select.ScrollUpButton>
            <div class="i-tabler:chevrons-up size-4"></div>
          </Select.ScrollUpButton>
          <Select.Viewport class="bg-base-100 p-2 w-60 rounded-box ">
            {#each model_providers as model}
              <!-- content here -->
              <Select.Item
                value={model.value}
                class="flex hover:bg-gray/10 transition-all items-center rounded-field p-2  h-8 w-full"
              >
                {#snippet children({ selected })}
                  <span class="flex gap-3 items-center">
                    <div class={model.icon}></div>
                    {model.label}</span
                  >
                  {#if selected}
                    <div class="ml-auto">
                      <div class="i-tabler:check size-4"></div>
                    </div>
                  {/if}
                {/snippet}
              </Select.Item>
            {/each}
            <Select.ScrollDownButton>
              <div class="i-tabler:chevrons-down size-4"></div>
            </Select.ScrollDownButton>
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  </div>
  <div class="flex justify-between items-center">
    <p>
      Enter <span class="badge badge-md {selected_provider_label || 'hidden'} "
        >{selected_provider_label}
      </span> API Key
    </p>

    <label class="input">
      <div class="i-tabler:key size-5"></div>
      <input
        type="password"
        required
        placeholder="API Key"
        title="Must be more than 8 characters, including number, lowercase letter, uppercase letter"
        bind:value={api_key}
        disabled={selected_provider_label == undefined}
      />
    </label>
  </div>
  <div class="flex justify-between items-center">
    <div class="">
      <p>
        Enter <span
          class="badge badge-md {selected_provider_label || 'hidden'} "
          >{selected_provider_label}
        </span> Model name
      </p>
      <span class="text-base-content/50 text-sm">
        click <button
          class="link link-primary"
          onclick={() => {
            models_list_dialog_open = true;
          }}
        >
          here</button
        > to see available models
      </span>
      {#if models_list_dialog_open}
        <ListModels
          model_provider={sel_provider}
          bind:models_list_dialog_open
          bind:model_name={model_id}
        />
      {/if}
    </div>

    <label class="input">
      <div class="i-carbon:network-1 size-5"></div>
      <input
        type="text"
        required
        bind:value={model_id}
        placeholder="Model name"
        title="Must be more than 8 characters, including number, lowercase letter, uppercase letter"
        disabled={!selected_provider_label || !api_key}
      />
    </label>
  </div>
  <button
    class="btn btn-primary self-end"
    disabled={!sel_provider || !api_key || !model_id}
    onclick={() => {
      if (sel_provider && api_key && model_id)
        apply_ai_config(sel_provider, api_key, model_id);
    }}>Apply</button
  >
</div>
