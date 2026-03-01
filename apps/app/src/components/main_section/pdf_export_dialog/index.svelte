<script lang="ts">
  import { pdf_rendered } from '@/lib/features/pdf_export';
  import { show_folder_picker } from '@/lib/file_system/picker_dialog';
  import type { Node, GenericPath } from '@/types';
  import { toast } from 'svelte-sonner';
  import type { SubmitStates } from '@/types';
  import SubmitButton from '@/components/general/submit_button/index.svelte';
  import { pdf_export_status } from '@/components/main_section/pdf_export_dialog/states.svelte';
  let { open = $bindable(), filenode }: { open: boolean; filenode: Node } =
    $props();
  let page_sizes = ['a4', 'a3', 'a5', 'letter', 'legal', 'tabloid'];
  let location_to_save: GenericPath | undefined = $state();
  let render_state: SubmitStates = $state('idle');
</script>

<!-- Put this part before </body> tag -->
<div>
  <input
    type="checkbox"
    bind:checked={open}
    id="my_modal_7"
    class="modal-toggle"
  />
  <div class="modal" role="dialog">
    <div
      class="modal-box max-w-160 prose prose-invert b-1 b-[color-mix(in_srgb,var(--color-base-content)_30%,black)]"
    >
      <h2 class="mt-0">Export to PDF</h2>
      <p>Export "{filenode.name}" to PDF with the settings below</p>
      <hr class="my-3" />
      <div class="flex items-center justify-between">
        Page size
        <select
          name=""
          id=""
          class="select h-8 bg-[oklch(from_var(--color-base-content)_calc(l*0.4)_c_h)] min-w-0 w-min select-md"
        >
          {#each page_sizes as size, i}
            <option value={i}>{size.toUpperCase()}</option>
          {/each}
        </select>
      </div>
      <hr class="my-3" />
      <div class="flex items-center justify-between">
        Where to Save?
        <button
          class="btn h-8 max-w-60 flex justify-end"
          onclick={async () => {
            const path = await show_folder_picker();
            location_to_save = path;
          }}
        >
          {decodeURIComponent(location_to_save?.path ?? '')
            .split('/')
            .filter(Boolean)
            .pop() || '...'}
        </button>
      </div>
      <div class="flex justify-end mt-10 gap-2">
        <SubmitButton
          state={render_state}
          onclick={async () => {
            if (!location_to_save)
              return toast.error('Please select a location to save the PDF');
            try {
              render_state = 'waiting';
              await pdf_rendered(filenode.name, location_to_save);
              render_state = 'success';
              setTimeout(() => {
                render_state = 'idle';
                pdf_export_status.data = false;
              }, 2000);
            } catch (error) {
              toast.error('Failed to export PDF: ' + error);
              render_state = 'error';
              setTimeout(() => {
                render_state = 'idle';
              }, 2000);
            }
          }}
          label_text_html="Export to PDF"
          class="btn w-35 btn-primary "
        />
        <button class="btn" onclick={() => (open = false)}>Cancel</button>
      </div>
      <button
        class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
        onclick={() => (open = false)}
      >
        ✕
      </button>
    </div>

    <label class="modal-backdrop" for="my_modal_7">Close</label>
  </div>
</div>
