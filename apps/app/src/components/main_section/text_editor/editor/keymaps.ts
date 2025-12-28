import { trigger_redo, trigger_undo, wrap_selection } from '@/lib/text_editor';
import { keymap } from '@codemirror/view';

export const custom_keymaps = keymap.of([
  {
    key: 'Mod-z',
    run: (view) => {
      trigger_undo(view);
      return true;
    },
  },
  {
    key: 'Mod-y',
    run: (view) => {
      trigger_redo(view);
      return true;
    },
  },
  {
    key: 'Mod-Shift-z',
    run: (view) => {
      trigger_redo(view);
      return true;
    },
  },
  {
    key: 'Mod-b',
    run: (view) => {
      wrap_selection(view, '**');
      return true; // Return true to indicate the event was handled
    },
  },
  {
    key: 'Mod-i',
    run: (view) => {
      wrap_selection(view, '_');
      return true;
    },
  },
]);
