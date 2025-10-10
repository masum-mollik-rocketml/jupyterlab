import {ITranslator, nullTranslator, TranslationBundle} from "@jupyterlab/translation";
import {cellRunnerCaretIcon, IDropdownMenuItem, ReactWidget} from "@jupyterlab/ui-components";
import DropdownMenu from "@jupyterlab/ui-components/lib/components/dropdownmenu";
import {CommandRegistry} from "@lumino/commands";
import * as React from "react";

const jpAddCellDropdownContainerClass = 'jp-AddCellDropdown-container';

export class AddCellDropdown extends ReactWidget {

    constructor(options: AddCellDropdown.IOptions) {
        super();

        this._translator = options.translator ?? nullTranslator;
        this._trans = this._translator.load('jupyterlab');

        this._commands = options.commands;
    }

    protected render(): JSX.Element {
        const codeCellOptions: IDropdownMenuItem[] = [
            {
                label: 'Add code cell above',
                onClick: () => {
                    this._commands.execute('notebook:insert-cell-above').then();
                }
            },
            {
                label: 'Add code cell below',
                onClick: () => {
                    this._commands.execute('notebook:insert-cell-below').then();
                }
            }
        ];

        const markdownCellOptions: IDropdownMenuItem[] = [
            {
                label: 'Add markdown cell above',
                onClick: () => {}
            },
            {
                label: 'Add markdown cell below',
                onClick: () => {}
            }
        ];

        return (
            <div className={jpAddCellDropdownContainerClass}>
                <DropdownMenu className={'jp-cell-runner-dropdown'} label={this._trans.__("Add code cell")} menuClassName={"float-menu-left"} items={codeCellOptions} iconSize={"small"} icon={cellRunnerCaretIcon} />
                <DropdownMenu className={'jp-cell-runner-dropdown'} label={this._trans.__("Add markdown cell")} menuClassName={"float-menu-left"} items={markdownCellOptions} iconSize={"small"} icon={cellRunnerCaretIcon} />
            </div>
        );
    }

    private _translator: ITranslator;
    private _trans: TranslationBundle;
    private _commands: CommandRegistry;
}

export namespace AddCellDropdown {
    export interface IOptions {
        /** The command registry to use when executing items. */
        commands: CommandRegistry;
        /** The translator to use for UI strings. */
        translator?: ITranslator;
    }
}
