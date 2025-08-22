import { Decoration, DecorationSet, EditorView, ViewPlugin, WidgetType } from '@codemirror/view';
import { Extension, StateEffect, StateField } from '@codemirror/state';

/**
 * State effect to show toolbar with delay
 */
const showToolbarEffect = StateEffect.define<{from: number, to: number}>();

/**
 * State effect to hide toolbar
 */
const hideToolbarEffect = StateEffect.define<void>();

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

  ignoreEvent(event: Event): boolean {
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
    block: true
  });

  return widget.range(from);
}

/**
 * StateField to manage toolbar decorations with delay
 */
const toolbarField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },

  update(decorations, tr) {
    // Map existing decorations through document changes
    decorations = decorations.map(tr.changes);

    // Handle explicit show/hide effects
    for (let effect of tr.effects) {
      if (effect.is(showToolbarEffect)) {
        const { from, to } = effect.value;
        const toolbarWidget = createToolbarWidget(from, to);
        return Decoration.set([toolbarWidget]);
      } else if (effect.is(hideToolbarEffect)) {
        return Decoration.none;
      }
    }

    // Hide toolbar immediately if no selection
    if (tr.selection) {
      const { from, to } = tr.state.selection.main;
      if (from === to) {
        return Decoration.none;
      }
    }

    return decorations;
  },

  provide: f => EditorView.decorations.from(f)
});

/**
 * ViewPlugin to handle delayed toolbar showing
 */
const toolbarViewPlugin = ViewPlugin.fromClass(class {
  private showTimer: number | null = null;
  private lastSelection: {from: number, to: number} | null = null;

  constructor(private view: EditorView) {}

  update(update: any) {
    const { from, to } = update.state.selection.main;

    // Clear existing timer
    if (this.showTimer !== null) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }

    // If no selection, hide immediately
    if (from === to) {
      if (this.lastSelection) {
        this.view.dispatch({
          effects: hideToolbarEffect.of()
        });
        this.lastSelection = null;
      }
      return;
    }

    // If selection changed, start delay timer
    if (!this.lastSelection || this.lastSelection.from !== from || this.lastSelection.to !== to) {
      this.lastSelection = { from, to };

      // Set timer to show toolbar after delay
      this.showTimer = setTimeout(() => {
        // Check if selection is still the same when timer fires
        const currentSelection = this.view.state.selection.main;
        if (currentSelection.from === from && currentSelection.to === to && currentSelection.from !== currentSelection.to) {
          this.view.dispatch({
            effects: showToolbarEffect.of({ from, to })
          });
        }
        this.showTimer = null;
      }, 300); // 300ms delay - adjust as needed
    }
  }

  destroy() {
    if (this.showTimer !== null) {
      clearTimeout(this.showTimer);
    }
  }
});

/**
 * Extension for CodeMirror 6 displaying popup toolbar with delay
 */
export function popupToolbar(): Extension {
  return [toolbarField, toolbarViewPlugin];
}
