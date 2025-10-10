import {ITranslator, nullTranslator, TranslationBundle} from "@jupyterlab/translation";
import {
    cellBottomPlusIcon,
    cellRunnerCaretIcon,
    IDropdownMenuItem,
    LabIcon,
    ReactWidget
} from "@jupyterlab/ui-components";
import DropdownMenu from "@jupyterlab/ui-components/lib/components/dropdownmenu";
import {CommandRegistry} from "@lumino/commands";
import * as React from "react";

const jpAddCellDropdownContainerClass = 'jp-AddCellDropdown-container';
const jpAddCellDropdownItemClass = 'jp-AddCellDropdown-item';
const jpAddCellDropdownLeftClass = 'jp-AddCellDropdown-item-left';
const jpAddCellDropdownItemLabelClass = 'jp-AddCellDropdown-item-label';
const jpAddCellDropdownItemDropdownClass = 'jp-AddCellDropdown-item-dropdown';

export class AddCellDropdown extends ReactWidget {

    constructor(options: AddCellDropdown.IOptions) {
        super();

        this._translator = options.translator ?? nullTranslator;
        this._trans = this._translator.load('jupyterlab');

        this._commands = options.commands;
    }

    protected render(): JSX.Element {
        const insertCodeCellAbove = () => {
            return () => {
                this._commands.execute('notebook:insert-cell-above').then();
            };
        }

        const insertCodeCellBelow = () => {
            return () => {
                this._commands.execute('notebook:insert-cell-below').then();
            };
        }

        const codeCellOptions: IDropdownMenuItem[] = [
            {
                label: 'Add code cell above',
                onClick: insertCodeCellAbove()
            },
            {
                label: 'Add code cell below',
                onClick: insertCodeCellBelow()
            }
        ];

        const insertMarkdownCellAbove = () => {
            return () => {
                this._commands.execute('notebook:insert-cell-above').then(_ => {
                    this._commands.execute('notebook:change-cell-to-markdown').then();
                });
            };
        }

        const insertMarkdownCellBelow = () => {
            return () => {
                this._commands.execute('notebook:insert-cell-below').then(_ => {
                    this._commands.execute('notebook:change-cell-to-markdown').then();
                });
            };
        }

        const markdownCellOptions: IDropdownMenuItem[] = [
            {
                label: 'Add markdown cell above',
                onClick: insertMarkdownCellAbove()
            },
            {
                label: 'Add markdown cell below',
                onClick: insertMarkdownCellBelow()
            }
        ];

        return (
            <div className={jpAddCellDropdownContainerClass}>
                <div className={jpAddCellDropdownItemClass}>
                    <div className={jpAddCellDropdownLeftClass}>
                        <LabIcon.resolveReact className={'cell-bottom-plus-icon'} icon={cellBottomPlusIcon} elementSize={'small'} tag={'div'}/>
                        <span className={jpAddCellDropdownItemLabelClass}>Code</span>
                    </div>
                    <DropdownMenu className={jpAddCellDropdownItemDropdownClass} label={this._trans.__("Add code cell")} items={codeCellOptions} iconSize={"small"} icon={cellRunnerCaretIcon} />
                </div>
                <div className={jpAddCellDropdownItemClass}>
                    <div className={jpAddCellDropdownLeftClass}>
                        <LabIcon.resolveReact className={'cell-bottom-plus-icon'} icon={cellBottomPlusIcon} elementSize={'small'} tag={'div'}/>
                        <span className={jpAddCellDropdownItemLabelClass}>Markdown</span>
                    </div>
                    <DropdownMenu className={jpAddCellDropdownItemDropdownClass} label={this._trans.__("Add markdown cell")} items={markdownCellOptions} iconSize={"small"} icon={cellRunnerCaretIcon} />
                </div>
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
        translator?: ITranslator | null;
    }
}
