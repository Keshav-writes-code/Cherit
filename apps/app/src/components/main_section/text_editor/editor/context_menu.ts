// @unocss-include

import type { MenuItem } from '@/types';
import type { EditorView } from '@codemirror/view';
import { writeText, readText } from '@tauri-apps/plugin-clipboard-manager';
export function get_desktop_context_menu(view: EditorView): MenuItem[] {
  return [
    {
      label: 'Paste',
      icon_class: 'i-tabler:clipboard-check size-4',
      action: async () => {
        const text = await readText();
        view.dispatch(view.state.replaceSelection(text));
        view.focus();
      },
    },
    {
      label: 'Copy',
      icon_class: 'i-tabler:copy size-4',
      action: async () => {
        const state = view.state; // 'view' is your EditorView instance
        const range = state.selection.main;
        const selectedText = state.sliceDoc(range.from, range.to);
        await writeText(selectedText);
      },
    },
  ];
}
