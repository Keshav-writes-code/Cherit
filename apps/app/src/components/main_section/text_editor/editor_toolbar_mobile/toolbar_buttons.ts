// @unocss-include
import {
  indent_in,
  indent_out,
  insert_on_next_line,
  trigger_redo,
  trigger_undo,
  wrap_selection,
} from '@/lib/text_editor';
import { editor_view } from '../editor_state.svelte';

export type toolbar_button = {
  label: string;
  action?: () => void;
  type?: 'default' | 'danger' | 'warning';
  icon_class?: string;
  divider?: boolean; // To render a <hr>
};

export const toolbar_buttons: toolbar_button[] = [
  {
    label: 'undo',
    icon_class: 'i-tabler:arrow-back-up',
    action: () => {
      trigger_undo(editor_view.data);
    },
  },
  {
    label: 'redo',
    icon_class: 'i-tabler:arrow-forward-up',
    action: () => {
      trigger_redo(editor_view.data);
    },
  },
  {
    label: 'indent in',
    icon_class: 'i-tabler:indent-increase',
    action: () => {
      indent_in(editor_view.data);
    },
  },
  {
    label: 'indent out',
    icon_class: 'i-tabler:indent-decrease',
    action: () => {
      indent_out(editor_view.data);
    },
  },
  {
    label: 'add checkbox',
    icon_class: 'i-tabler:checkbox',
    action: () => {
      insert_on_next_line(editor_view.data, '- [ ] ');
    },
  },
  {
    label: 'bold',
    icon_class: 'i-tabler:bold',
    action: () => {
      wrap_selection(editor_view.data, '**');
    },
  },
  {
    label: 'italic',
    icon_class: 'i-tabler:italic',
    action: () => {
      wrap_selection(editor_view.data, '_');
    },
  },
  {
    label: 'strikethrough',
    icon_class: 'i-tabler:strikethrough',
    action: () => {
      wrap_selection(editor_view.data, '*');
    },
  },
];
