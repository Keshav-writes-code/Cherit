import { wrap_selection } from '@/lib/text_editor';
import { keymap } from '@codemirror/view';
import { undo, redo } from '@codemirror/commands';

export const custom_keymaps = keymap.of([
  { key: 'Mod-z', run: undo },
  { key: 'Mod-y', run: redo },
  { key: 'Mod-Shift-z', run: redo },
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
