/* -----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import { Cell, CellModel, ICellModel } from '@jupyterlab/cells';
import {AddCellDropdown} from "@jupyterlab/cells/lib/add-cell-dropdown";
import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import {ITranslator} from "@jupyterlab/translation";
import {CommandRegistry} from "@lumino/commands";
import { IDisposable } from '@lumino/disposable';
import { PanelLayout } from '@lumino/widgets';
import type { IMapChange } from '@jupyter/ydoc';

/**
 * CSS class added to the bottom actions widget container.
 */
const CELL_BOTTOM_ACTIONS_CLASS = 'jp-Cell-bottomActions';

/**
 * Tracker that adds a widget below the output wrapper widget of every notebook cell.
 *
 * Note: This is intentionally minimal and mirrors CellToolbarTracker structure
 * where it makes sense, but focuses on inserting a single widget under outputs.
 */
export class CellBottomActionsTracker implements IDisposable {
  constructor(panel: NotebookPanel, commands: CommandRegistry, translator: ITranslator | null) {
    this._panel = panel;
    this._commands = commands;
    this._translator = translator

    void panel.revealed.then(() => {
      // Defer to next animation frame to ensure cells completed initial DOM setup
      requestAnimationFrame(() => {
        const notebook = panel.content;
        this._attachToAllCells(notebook);

        // React to active cell changes to cover cells created lazily or on-demand
        notebook.activeCellChanged.connect(this._onActiveCellChanged, this);

        // React to cell list changes (insert/remove)
        notebook.model?.cells.changed.connect(this._onCellsListChanged, this);

        notebook.disposed.connect(() => {
          notebook.activeCellChanged.disconnect(this._onActiveCellChanged, this);
          notebook.model?.cells.changed.disconnect(this._onCellsListChanged, this);
        });
      });
    });
  }

  get isDisposed(): boolean {
    return this._isDisposed;
  }

  dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;

    // Remove widgets we added
    const notebook = this._panel?.content;
    if (notebook) {
      for (const cell of notebook.widgets) {
        this._removeBottomActions(cell.model);
      }
    }

    this._panel = null;
  }

  /**
   * Ensure the bottom actions widget exists for the given model (cell).
   */
  private _addBottomActions(model: ICellModel): void {
    const cell = this._getCell(model);
    if (!cell || cell.isDisposed) {
      return;
    }

    const attachWidget = () => {
      const layout = cell.layout as PanelLayout;
      const existing = layout.widgets.find(w =>
        w.node.classList.contains(CELL_BOTTOM_ACTIONS_CLASS)
      );
      if (existing) {
        return;
      }

      const widget = new AddCellDropdown({commands: this._commands, translator: this._translator ?? null});
      widget.addClass(CELL_BOTTOM_ACTIONS_CLASS);

      // Insert before the footer (last widget) so it appears right under outputs
      // CodeCell layout order typically ends with footer; placing at length - 1
      // ensures it sits above the footer and below the output wrapper.
      const insertionIndex = Math.max(0, layout.widgets.length - 1);
      layout.insertWidget(insertionIndex, widget);

      // Watch for cell metadata visibility changes to hide/show accordingly
      model.metadataChanged.connect(this._onMetadataChanged, this);
    };

    // Wait for the cell to be fully ready so all intrinsic widgets are created
    const promises: Promise<unknown>[] = [cell.ready];
    Promise.all(promises)
      .then(() => {
        // Double-check the cell wasn't disposed in the meantime
        if (cell.isDisposed) {
          return;
        }
        // Defer one frame to align with CellToolbarTracker behavior
        requestAnimationFrame(() => {
          attachWidget();
        });
      })
      .catch(e => {
        console.error('Error adding bottom actions widget: ', e);
      });
  }

  private _removeBottomActions(model: ICellModel): void {
    const cell = this._getCell(model);
    if (!cell || cell.isDisposed) {
      return;
    }

    const layout = cell.layout as PanelLayout;
    const existing = layout.widgets.find(w => w.node.classList.contains(CELL_BOTTOM_ACTIONS_CLASS));
    if (existing) {
      existing.parent = null;
      existing.dispose();
    }

    // Disconnect listener if any
    if (model instanceof CellModel) {
      try {
        model.metadataChanged.disconnect(this._onMetadataChanged, this);
      } catch {
        /* no-op */
      }
    }
  }

  private _getCell(model: ICellModel | null): Cell | null {
    if (!model || !this._panel) {
      return null;
    }
    const notebook = this._panel.content as Notebook;
    // Find the cell widget corresponding to the model
    for (const widget of notebook.widgets) {
      if (widget.model === model) {
        return widget as Cell;
      }
    }
    return null;
  }

  private _onActiveCellChanged(notebook: Notebook): void {
    // Ensure all cells have the bottom actions widget
    this._attachToAllCells(notebook);
  }

  private _onCellsListChanged(): void {
    // Cells inserted/removed; re-attach as needed
    const notebook = this._panel?.content;
    if (!notebook) {
      return;
    }

    this._attachToAllCells(notebook);
  }

  private _onMetadataChanged = (model: ICellModel, args: IMapChange): void => {
    if (args.key === 'jupyter') {
      const sourceHiddenNew = (typeof args.newValue === 'object' && (args.newValue as any)?.source_hidden === true);
      const sourceHiddenOld = (typeof args.oldValue === 'object' && (args.oldValue as any)?.source_hidden === true);

      if (sourceHiddenNew) {
        // Cell just became hidden; remove widget
        this._removeBottomActions(model);
      } else if (sourceHiddenOld) {
        // Cell just became visible again; add widget
        this._addBottomActions(model);
      }
    }
  };

  private _attachToAllCells(notebook: Notebook): void {
    for (const cell of notebook.widgets) {
      // Do not add if the input is hidden and the cell might be fully hidden
      if (cell.inputHidden) {
        // Still add below outputs if desired; requirement is to add to every cell.
        // We'll proceed to add regardless of input visibility.
      }
      const layout = cell.layout as PanelLayout;
      const exists = layout.widgets.some(w => w.node.classList.contains(CELL_BOTTOM_ACTIONS_CLASS));
      if (!exists) {
        this._addBottomActions(cell.model);
      }
    }
  }

  /**
   * Whether the cell toolbar is shown, if there is enough room
   */
  get enabled(): boolean {
    return this._enabled;
  }

  /**
   * Sets whether the cell toolbar is shown, if there is enough room
   */
  set enabled(value: boolean) {
    this._enabled = value;
  }


  private _panel: NotebookPanel | null;
  private _isDisposed = false;
  private _enabled: boolean;
  private _commands: CommandRegistry;
  private _translator: ITranslator | null;
}


/**
 * Widget extension that creates a CellBottomActionsTracker each time a notebook is
 * created.
 *
 * Follow CellBarExtension structure.
 */
export class CellBottomActionsExtension implements DocumentRegistry.WidgetExtension {
  constructor(commands: CommandRegistry, translator: ITranslator | null) {
    this._commands = commands;
    this._translator = translator;

  }
  createNew(panel: NotebookPanel): IDisposable {
    return (this._tracker = new CellBottomActionsTracker(panel, this._commands, this._translator));
  }

  /**
   * Whether the cell toolbar is displayed, if there is enough room for it
   */
  get enabled(): boolean {
    return this._tracker.enabled;
  }

  /**
   * Sets whether the cell toolbar is displayed, if there is enough room for it
   */
  set enabled(value: boolean) {
    if (this._tracker) {
      this._tracker.enabled = value;
    }
  }

  private _tracker: CellBottomActionsTracker;
  private _commands: CommandRegistry;
  private _translator: ITranslator | null;
}
