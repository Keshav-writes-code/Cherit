import { EditorView } from "@codemirror/view";

export const obsidian_theme = EditorView.theme({
  ".cm-gutters": {
    opacity: "0",
    transition: "opacity 0.2s ease",
  },
  ".cm-scroller:hover .cm-gutters": {
    opacity: "1",
  },
  ".cm-rendered-link": {
    textDecoration: "underline",
    cursor: "pointer",
    color: "red",
  },
  ".cm-gutterElement": {
    fontSize: "1.4rem",
    lineHeight: "3rem",
  },
  ".cm-line": {
    fontSize: "1.8rem",
    lineHeight: "3rem",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  ".cm-checkbox": {
    appearance: "none",
    width: "1.8rem",
    height: "1.8rem",
    border: "2px solid #555",
    borderRadius: "0.3rem",
    backgroundColor: "#111",
    cursor: "pointer",
    transition: "all 0.2s ease",
    position: "relative",
    verticalAlign: "text-top",
  },
  ".cm-checkbox:hover": {
    borderColor: "var(--color-accent)",
    backgroundColor: "#1a1a1a",
  },
  ".cm-checkbox:checked": {
    backgroundColor: "var(--color-accent)",
    borderColor: "var(--color-accent)",
  },
  ".cm-checkbox:checked::after": {
    content: '""',
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "4px",
    height: "8px",
    border: "solid #111",
    borderWidth: "0 2px 2px 0",
    transform: "translate(-50%, -50%) rotate(45deg)",
  },
  ".cm-line:has(.cm-checkbox:checked)": {
    textDecoration: "line-through",
  },

  ".cm-rendered-list-mark": {
    margin: "0",
  },
  ".ͼ12": {
    marginLeft: "0.5px",
  },
  ".ͼ14": {
    fontSize: "1.6rem",
    lineHeight: "3rem",
  },
  ".cm-horizontal-rule-container hr": {
    borderTop:
      "2px solid color-mix(in srgb, var(--color-base-content), black 70%)",
  },
  ".cm-horizontal-rule-container ": {
    paddingTop: "1.5rem",
    paddingBottom: "1.5rem",
  },
  ".ͼ19": {
    fontFamily: "monospace",
  },
});
