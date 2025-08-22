import { Decoration, DecorationSet, EditorView, WidgetType } from '@codemirror/view';
import { Extension, StateField } from '@codemirror/state';

/**
 * Custom widget class for the popup toolbar
 */
class ToolbarWidget extends WidgetType {
  constructor(private from: number, private to: number) {
    super();
  }

  toDOM(view: EditorView): HTMLElement {
    const toolbar = document.createElement("div");
    toolbar.className = "cm-popup-toolbar";
    toolbar.innerHTML = `
      <button class="cm-btn">💡 Copilot</button>
      <button class="cm-btn">Bold</button>
      <button class="cm-btn">Italic</button>
    `;

    // Style the toolbar for block layout
    Object.assign(toolbar.style, {
      display: "flex",
      gap: "4px",
      padding: "4px 8px",
      background: "white",
      border: "1px solid #ccc",
      borderRadius: "6px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
      margin: "4px 0",
      justifyContent: "center",
      alignItems: "center",
      pointerEvents: "auto"
    });

    return toolbar;
  }

  ignoreEvent(event:Event): boolean {
    console.log(event);
    return true;
  }

  eq(other: ToolbarWidget): boolean {
    return this.from === other.from && this.to === other.to;
  }

  updateDOM(dom: HTMLElement, view: EditorView): boolean {
    return true;
  }

  get estimatedHeight(): number {
    return 32;
  }

  // For block widgets
  get toBlock(): boolean {
    return true;
  }
}

/**
 * Helper function to create toolbar widget decoration
 */
function createToolbarWidget(from: number, to: number) {
  const widget = Decoration.widget({
    widget: new ToolbarWidget(from, to),
    side: -1,
    block: true  // ✅ This works with StateField!
  });

  return widget.range(from); // Position at end of selection
}

/**
 * StateField to manage toolbar decorations
 */
const toolbarField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },

  update(decorations, tr) {
    // Map existing decorations through document changes
    decorations = decorations.map(tr.changes);

    // Check if selection changed
    if (tr.selection || tr.docChanged) {
      const { from, to } = tr.state.selection.main;

      // Only show toolbar if there's a selection
      if (from === to) {
        return Decoration.none;
      }

      // Create new toolbar widget
      const toolbarWidget = createToolbarWidget(from, to);

      return Decoration.set([toolbarWidget]);
    }

    return decorations;
  },

  // ✅ This is the key: provide decorations to the editor
  provide: f => EditorView.decorations.from(f)
});

/**
 * Extension for CodeMirror 6 displaying popup toolbar using StateField
 */
export function popupToolbar(): Extension {
  return [toolbarField];
}
