<script lang="ts">
  import type { SubmitStates } from '@/types';

  type Props = {
    tooltip?: string;
    class?: string;
    state: SubmitStates;
    onclick?: Function;
    label_text_html?: string;
    label_icon?: string;
  };
  let {
    tooltip,
    class: classes,
    state,
    onclick,
    label_text_html = 'Submit',
    label_icon,
    ...props
  }: Props = $props();
</script>

<div class="tooltip h-auto" data-tip={tooltip}>
  <button
    class="
    {state == 'disabled' ? 'btn-disabled' : ''}
    {state == 'waiting' ? 'btn-info' : ''}
    {state == 'success' ? 'btn-success' : ''}
    {state == 'error' ? ' btn-error ' : ''} min-w-min btn flex gap-4 {classes} "
    onclick={(e) => {
      if (onclick) {
        onclick(e);
      }
    }}
    disabled={state == 'disabled' || state == 'waiting'}
    {...props}
  >
    {#if state == 'idle' || state == 'disabled'}
      <span class="gap-4 flex justify-center items-center">
        {#if label_icon}
          <div class="size-7 {label_icon}"></div>
        {/if}
        <p>{@html label_text_html}</p>
      </span>
    {:else if state == 'waiting'}
      <div class="i-line-md:loading-twotone-loop size-8"></div>
    {:else if state == 'success'}
      <div class="i-tabler:check size-8"></div>
    {:else if state == 'error'}
      <div class="i-tabler:alert-triangle size-8"></div>
    {:else}{/if}
  </button>
</div>
