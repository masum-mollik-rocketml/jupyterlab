/* -----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
/**
 * @packageDocumentation
 * @module cell-toolbar-extension
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { CellBarExtension, CellBottomActionsExtension } from '@jupyterlab/cell-toolbar';
import {
  createToolbarFactory,
  IToolbarWidgetRegistry
} from '@jupyterlab/apputils';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';
import { INotebookTracker } from '@jupyterlab/notebook';
import { copilotIcon } from '@jupyterlab/ui-components';
// import { CounterWidget } from './copilot-widget';
import { Widget } from '@lumino/widgets';
import { CopilotWidget } from './copilot-widget';

const PLUGIN_ID = '@jupyterlab/cell-toolbar-extension:plugin';
const BOTTOM_PLUGIN_ID = '@jupyterlab/cell-toolbar-extension:bottom-actions-plugin';

const CommandIds = {
  /**
   * Command to render a markdown cell.
   */
  renderMarkdownCell: 'toolbar-button:render-markdown-cell',
  /**
   * Command to run a code cell.
   */
  runCodeCell: 'toolbar-button:run-code-cell'
};


const cellToolbar: JupyterFrontEndPlugin<void> = {
  id: PLUGIN_ID,
  description: 'Add the cells toolbar.',
  autoStart: true,
  requires: [INotebookTracker],
  activate: async (
    app: JupyterFrontEnd,
    tracker: INotebookTracker,
    settingRegistry: ISettingRegistry | null,
    toolbarRegistry: IToolbarWidgetRegistry | null,
    translator: ITranslator | null
  ) => {

    const { commands } = app;
    const copilotWidget = new CopilotWidget(tracker);

    /* Adds a command enabled only on code cell */
    commands.addCommand(CommandIds.runCodeCell, {
      icon: copilotIcon,
      caption: 'Run a code cell',
      execute: () => {
        /*const dialogResult = showDialog({
          title: 'Dialog title', // Can be text or a react element
          body: new CounterWidget(), // Can be text, a widget or a react element
          host: document.body, // Parent element for rendering the dialog
          buttons: [ // List of buttons
            {
              label: 'my button', // Button label
              caption: 'my button title', // Button title
              className: 'my-button', // Additional button CSS class
              accept: true, // Whether this button will discard or accept the dialog
              displayType: 'default', // applies 'default' or 'warn' styles,
              actions: [],
              iconClass: '',
              ariaLabel: '',
              iconLabel: ''
            }
          ],
          checkbox: { // Optional checkbox in the dialog footer
            label: 'check me', // Checkbox label
            caption: 'check me I\'magic', // Checkbox title
            className: 'my-checkbox', // Additional checkbox CSS class
            checked: true, // Default checkbox state
          },
          defaultButton: 0, // Index of the default button
          focusNodeSelector: '.my-input', // Selector for focussing an input element when dialog opens
          hasClose: false, // Whether to display a close button or not
          renderer: undefined // To define customized dialog structure
        })

        dialogResult.then(res => {
          console.log(res);
          console.log(tracker.activeCell)
        });*/
        function closeDialog(emitter: CopilotWidget): void {
          console.log('Hey, a Signal has been received from', emitter);
        }

        if (!copilotWidget.isAttached) {

          Widget.attach(copilotWidget, document.body);
          copilotWidget.stateChanged.connect(closeDialog, this);

        }

        commands.execute('notebook:run-cell');
      },
      isVisible: () => tracker.activeCell?.model.type === 'code'
    });


    /**
     * Load the settings for this extension
     *
     * @param setting Extension settings
     */
    function loadSetting(setting: ISettingRegistry.ISettings | null): void {
      // Read the setting and convert to the correct type
      const showCellToolbar: boolean | null =
        setting === null
          ? true
          : (setting.get('showToolbar').composite as boolean);

      extension.enabled = showCellToolbar;
    }

    const toolbarItems =
      settingRegistry && toolbarRegistry
        ? createToolbarFactory(
            toolbarRegistry,
            settingRegistry,
            CellBarExtension.FACTORY_NAME,
            cellToolbar.id,
            translator ?? nullTranslator
          )
        : undefined;

    const extension = new CellBarExtension(app.commands, toolbarItems);

    // Wait for the application to be restored and
    // for the settings for this plugin to be loaded
    if (settingRegistry !== null) {
      void Promise.all([app.restored, settingRegistry.load(PLUGIN_ID)]).then(
        ([, setting]) => {
          // Read the settings
          loadSetting(setting);

          // Listen for your plugin setting changes using Signal
          setting.changed.connect(loadSetting);
        }
      );
    }

    app.docRegistry.addWidgetExtension('Notebook', extension);
  },
  optional: [ISettingRegistry, IToolbarWidgetRegistry, ITranslator]
};

const bottomActionsPlugin: JupyterFrontEndPlugin<void> = {
  id: BOTTOM_PLUGIN_ID,
  description: 'Add bottom actions widget below outputs in each cell.',
  autoStart: true,
  activate: (app: JupyterFrontEnd, translator: ITranslator | null) => {
    const ext = new CellBottomActionsExtension(app.commands, translator);
    app.docRegistry.addWidgetExtension('Notebook', ext);
  },
  optional: [ITranslator]
};

export default [cellToolbar, bottomActionsPlugin];
