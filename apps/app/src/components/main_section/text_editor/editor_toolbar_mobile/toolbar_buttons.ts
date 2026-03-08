// @unocss-include
import {
  indent_in,
  indent_out,
  insert_on_next_line,
  trigger_redo,
  trigger_undo,
  wrap_selection,
} from '../../../../lib/operations/editor';
import type { EditorView } from '@codemirror/view';

export type toolbar_button = {
  label: string;
  action?: () => void;
  type?: 'default' | 'danger' | 'warning';
  icon_class?: string;
  divider?: boolean; // To render a <hr>
};

export function get_toolbar_buttons(editor_view: EditorView): toolbar_button[] {
  return [
    {
      label: 'undo',
      icon_class: 'i-tabler:arrow-back-up',
      action: () => {
        trigger_undo(editor_view);
      },
    },
    {
      label: 'redo',
      icon_class: 'i-tabler:arrow-forward-up',
      action: () => {
        trigger_redo(editor_view);
      },
    },
    {
      label: 'indent in',
      icon_class: 'i-tabler:indent-increase',
      action: () => {
        indent_in(editor_view);
      },
    },
    {
      label: 'indent out',
      icon_class: 'i-tabler:indent-decrease',
      action: () => {
        indent_out(editor_view);
      },
    },
    {
      label: 'add checkbox',
      icon_class: 'i-tabler:checkbox',
      action: () => {
        insert_on_next_line(editor_view, '- [ ] ');
      },
    },
    {
      label: 'bold',
      icon_class: 'i-tabler:bold',
      action: () => {
        wrap_selection(editor_view, '**');
      },
    },
    {
      label: 'italic',
      icon_class: 'i-tabler:italic',
      action: () => {
        wrap_selection(editor_view, '_');
      },
    },
    {
      label: 'strikethrough',
      icon_class: 'i-tabler:strikethrough',
      action: () => {
        wrap_selection(editor_view, '*');
      },
    },
  ];
}
