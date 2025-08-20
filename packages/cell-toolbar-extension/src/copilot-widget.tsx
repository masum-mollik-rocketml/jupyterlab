import { ReactWidget } from '@jupyterlab/ui-components';
import { ISignal, Signal } from '@lumino/signaling';

import React, { useState } from 'react';

/**
 * React component for a counter.
 *
 * @returns The React component
 */
const CopilotComponent = (): JSX.Element => {
  const [counter, setCounter] = useState(0);

  return (
    <div>
      <p>You clicked {counter} times!</p>
      <button
        onClick={(): void => {
          setCounter(counter + 1);
        }}
      >
        Increment
      </button>
    </div>
  );
};

/**
 * A Counter Lumino Widget that wraps a CopilotComponent.
 */
export class CopilotWidget extends ReactWidget {
  /**
   * Constructs a new CounterWidget.
   */
  constructor() {
    super();
    this.id = 'copilot-widget';
    this.addClass('jp-react-widget');
    this.addClass('copilot-widget');
  }

  render(): JSX.Element {
    return (<>
      <div onClick={(): void => {
        this._stateChanged.emit();
      }}>Hello</div>
      <CopilotComponent  />
    </>);
  }

  private _stateChanged = new Signal<CopilotWidget, void>(this);

  public get stateChanged(): ISignal<CopilotWidget, void> {
    return this._stateChanged;
  }
}
