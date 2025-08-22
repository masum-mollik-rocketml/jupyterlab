import { ReactWidget } from '@jupyterlab/ui-components';
import { ISignal, Signal } from '@lumino/signaling';
import { INotebookTracker } from '@jupyterlab/notebook';

import React, { useState } from 'react';

/**
 * Props for CopilotComponent
 */
interface ICopilotComponentProps {
  notebookTracker: INotebookTracker;
}

/**
 * React component for Copilot prompt interface.
 *
 * @returns The React component
 */
const CopilotComponent = ({ notebookTracker }: ICopilotComponentProps): JSX.Element => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (): Promise<void> => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      // Get current notebook path from tracker
      const currentNotebook = notebookTracker.currentWidget;
      const notebookPath = currentNotebook?.context.path || "Untitled.ipynb";

      const raw = JSON.stringify({
        "notebook_path": notebookPath,
        "query": prompt,
        "model_provider": "together",
        "model_name": "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        "full_context": false,
        "cell_index": -1,
        "kernel_id": null,
        "server_url": "http://localhost:8888",
        "token": "MY_TOKEN",
        "query_type": "prompt"
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow" as RequestRedirect
      };

      const apiResponse = await fetch("http://localhost:5000/api/query", requestOptions);
      const result = await apiResponse.text();

      notebookTracker.currentWidget?.update();

      setResponse(result);
    } catch (error) {
      console.error(error);
      setResponse(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '10px' }}>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          value={prompt}
          onChange={(e): void => setPrompt(e.target.value)}
          placeholder="Enter your prompt here..."
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !prompt.trim()}
          style={{
            padding: '8px 16px',
            backgroundColor: loading ? '#ccc' : '#007cba',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
      {response && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: '#f9f9f9',
          whiteSpace: 'pre-wrap'
        }}>
          <strong>Response:</strong>
          <div>{response}</div>
        </div>
      )}
    </div>
  );
};

/**
 * A Counter Lumino Widget that wraps a CopilotComponent.
 */
export class CopilotWidget extends ReactWidget {
  /**
   * Constructs a new CopilotWidget.
   */
  constructor(notebookTracker: INotebookTracker) {
    super();
    this.id = 'copilot-widget';
    this.addClass('jp-react-widget');
    this.addClass('copilot-widget');
    this._notebookTracker = notebookTracker;
  }

  render(): JSX.Element {
    return (<>
      <div className={"text-3xl"} onClick={(): void => {
        this._stateChanged.emit();
      }}></div>
      <CopilotComponent notebookTracker={this._notebookTracker} />
    </>);
  }

  private _stateChanged = new Signal<CopilotWidget, void>(this);
  private _notebookTracker: INotebookTracker;

  public get stateChanged(): ISignal<CopilotWidget, void> {
    return this._stateChanged;
  }

  public get notebookTracker(): INotebookTracker {
    return this._notebookTracker;
  }
}
