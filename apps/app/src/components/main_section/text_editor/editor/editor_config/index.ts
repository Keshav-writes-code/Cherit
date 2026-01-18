import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { GFM } from '@lezer/markdown';
import {
  prosemarkBasicSetup,
  prosemarkBaseThemeSetup,
  prosemarkMarkdownSyntaxExtensions,
  softIndentExtension,
} from '@prosemark/core';
import { htmlBlockExtension } from '@prosemark/render-html';
import { languages } from '@codemirror/language-data';
import { indentUnit } from '@codemirror/language';
import { defaultKeymap } from '@codemirror/commands';
import { custom_keymaps } from './keymaps';
import { obsidian_theme } from './theme';

export function create_editor(
  text_content: string,
  html_element: HTMLElement,
  is_contents_changed_state?: boolean
): EditorView {
  return new EditorView({
    doc: text_content,
    parent: html_element,
    extensions: [
      custom_keymaps,
      keymap.of(defaultKeymap),
      EditorView.lineWrapping,
      EditorState.tabSize.of(8),
      indentUnit.of('\t'),
      softIndentExtension,
      obsidian_theme,
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !is_contents_changed_state) {
          is_contents_changed_state = true;
        }
      }),
      markdown({
        codeLanguages: languages,
        extensions: [GFM, prosemarkMarkdownSyntaxExtensions],
      }),
      prosemarkBasicSetup(),
      prosemarkBaseThemeSetup(),
      htmlBlockExtension,
    ],
  });
}
