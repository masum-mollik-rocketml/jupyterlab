import {ITranslator, nullTranslator, TranslationBundle} from "@jupyterlab/translation";
import {CommandRegistry} from "@lumino/commands";
import React from "react";
import {cellRunnerCaretIcon, cellRunnerIcon, LabIcon} from "../icon";
import DropdownMenu, {IDropdownMenuItem} from "./dropdownmenu";
import {ReactWidget} from "./vdom";

export class CellRunnerButton extends ReactWidget {
    constructor(options: CellRunnerButton.IOptions) {
        super();
        // Keep old class for backward-compatible styling, add new one for clarity
        // this.addClass('jp-NewFileDropdown');
        // this.addClass('jp-NewFileMenu');

        this._translator = options.translator ?? nullTranslator;
        this._trans = this._translator.load('jupyterlab');
        this._tooltip = options.tooltip ?? this._trans.__('Create new…');

        this._commands = options.commands;
    }

    runCell = () => {
        this._commands.execute('notebook:run-cell');

    };

    render(): React.ReactElement<any> {
        const items:IDropdownMenuItem[] = [
            {
                label: 'Run all above',
                onClick: () => {
                    this._commands.execute('notebook:run-all-above').then();
                }
            },
            {
                label: 'Run all below',
                onClick: () => {
                    this._commands.execute('notebook:run-all-below').then();
                }
            }
        ]
        return (
            <div className="jp-cell-runner" onClick={(event) => {event.stopPropagation()}} title={this._tooltip}>
                <div className={'jp-cell-runner-play'} onClick={() => this.runCell()}>
                    <LabIcon.resolveReact icon={cellRunnerIcon} elementSize={'small'} tag={'span'}/>
                </div>
                <DropdownMenu className={'jp-cell-runner-dropdown'} label={this._trans.__("Add cell")} menuClassName={"float-menu-left"} items={items} iconSize={"small"} icon={cellRunnerCaretIcon} />
            </div>
        );
    }

    private _commands: CommandRegistry;
    private _translator: ITranslator;
    private _trans: TranslationBundle;
    private _tooltip: string;
}

export namespace CellRunnerButton {
    export interface IOptions {
        /** The command registry to use when executing items. */
        commands: CommandRegistry;
        /** The translator to use for UI strings. */
        translator?: ITranslator;
        /** Tooltip shown on hover. */
        tooltip?: string;
    }
}
