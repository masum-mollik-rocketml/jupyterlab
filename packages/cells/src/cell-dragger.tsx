import {draggerIcon, LabIcon, ReactWidget} from "@jupyterlab/ui-components";
import * as React from "react";

const CELL_MOVER_CLASS = 'jp-CellDragger';

export class CellDraggerIconWidget extends ReactWidget implements ICellDraggerIconWidget {
    constructor() {
        super();
    }
    protected render(): JSX.Element | null {
        return <div className={CELL_MOVER_CLASS} style={{cursor: 'move'}}>
            <LabIcon.resolveReact icon={draggerIcon}/>
        </div>;
    }


}

export interface ICellDraggerIconWidget extends ReactWidget {

}
