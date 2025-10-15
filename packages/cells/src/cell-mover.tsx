import {LabIcon, moveDownIcon, moveUpIcon, ReactWidget} from "@jupyterlab/ui-components";
import {Signal} from "@lumino/signaling";
import * as React from "react";

const CELL_MOVER_CLASS = 'jp-CellMover';

export class MoveUpWidget extends ReactWidget {
    constructor() {
        super();
    }
    protected render(): JSX.Element | null {
        return <div className={CELL_MOVER_CLASS} style={{cursor: 'pointer'}} onClick={() => {
            this.cellMovedUp.emit();
        }}>
            <LabIcon.resolveReact icon={moveUpIcon}/>
        </div>;
    }

    cellMovedUp = new Signal<this, void>(this);


}

export class MoveDownWidget extends ReactWidget {
    constructor() {
        super();
    }
    protected render(): JSX.Element | null {
        return <div className={CELL_MOVER_CLASS} style={{cursor: 'pointer'}} onClick={() => {
            this.cellMovedDown.emit();
        }}>
            <LabIcon.resolveReact icon={moveDownIcon}/>
        </div>;
    }

    cellMovedDown = new Signal<this, void>(this);


}
