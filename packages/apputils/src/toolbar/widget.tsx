// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ITranslator,
  nullTranslator,
  TranslationBundle
} from '@jupyterlab/translation';
import {
  circleEmptyIcon,
  circleIcon, cpuUsageIcon,
  LabIcon, memoryUsageIcon,
  offlineBoltIcon,
  ReactWidget,
  refreshIcon,
  stopIcon,
  ToolbarButton,
  ToolbarButtonComponent,
  UseSignal
} from '@jupyterlab/ui-components';
import { Widget } from '@lumino/widgets';
import * as React from 'react';
import { ISessionContext, SessionContextDialogs } from '../sessioncontext';
import { translateKernelStatuses } from '../kernelstatuses';
import {requestAPI} from "./handler";
/**
 * The class name added to toolbar kernel name text.
 */
const TOOLBAR_KERNEL_NAME_CLASS = 'jp-Toolbar-kernelName';

/**
 * The class name added to toolbar kernel status icon.
 */
const TOOLBAR_KERNEL_STATUS_CLASS = 'jp-Toolbar-kernelStatus';

/**
 * The namespace for Toolbar class statics.
 */
export namespace Toolbar {
  /**
   * Create an interrupt toolbar item.
   *
   * @deprecated since version v3.2
   * This is dead code now.
   */
  export function createInterruptButton(
    sessionContext: ISessionContext,
    translator?: ITranslator
  ): Widget {
    translator = translator || nullTranslator;
    const trans = translator.load('jupyterlab');
    return new ToolbarButton({
      icon: stopIcon,
      onClick: () => {
        void sessionContext.session?.kernel?.interrupt();
      },
      tooltip: trans.__('Interrupt the kernel')
    });
  }

  /**
   * Create a restart toolbar item.
   *
   * @deprecated since v3.2
   * This is dead code now.
   */
  export function createRestartButton(
    sessionContext: ISessionContext,
    dialogs?: ISessionContext.IDialogs,
    translator?: ITranslator
  ): Widget {
    translator = translator ?? nullTranslator;
    const trans = translator.load('jupyterlab');
    return new ToolbarButton({
      icon: refreshIcon,
      onClick: () => {
        void (dialogs ?? new SessionContextDialogs({ translator })).restart(
          sessionContext
        );
      },
      tooltip: trans.__('Restart the kernel')
    });
  }

  /**
   * Create a kernel name indicator item.
   *
   * #### Notes
   * It will display the `'display_name`' of the session context. It can
   * handle a change in context or kernel.
   */
  export function createKernelNameItem(
    sessionContext: ISessionContext,
    dialogs?: ISessionContext.IDialogs,
    translator?: ITranslator
  ): Widget {
    const el = ReactWidget.create(
      <Private.KernelNameComponent
        sessionContext={sessionContext}
        dialogs={dialogs ?? new SessionContextDialogs({ translator })}
        translator={translator}
      />
    );
    el.addClass('jp-KernelName');
    return el;
  }

  /**
   * Create a kernel status indicator item.
   *
   * @deprecated since v3.5
   * The kernel status indicator is now replaced by the execution status indicator.
   *
   * #### Notes
   * It will show a busy status if the kernel status is busy.
   * It will show the current status in the node title.
   * It can handle a change to the context or the kernel.
   */
  export function createKernelStatusItem(
    sessionContext: ISessionContext,
    translator?: ITranslator
  ): Widget {
    return new Private.KernelStatus(sessionContext, translator);
  }


  /**
   * Create a CPU indicator toolbar widget item.
   * 
   * #### Notes
   * It displays CPU usage information in the toolbar.
   */
  export function createCpuIndicatorWidget(sessionContext: ISessionContext): Widget {
    const el = ReactWidget.create(
      <Private.ToolbarCpuIndicatorWidgetComponent sessionContext={sessionContext} />
    );
    el.addClass('jp-CpuIndicator');
    return el;
  }
}

/**
 * A namespace for private data.
 */
namespace Private {
  /**
   * Namespace for KernelNameComponent.
   */
  export namespace KernelNameComponent {
    /**
     * Interface for KernelNameComponent props.
     */
    export interface IProps {
      sessionContext: ISessionContext;
      dialogs: ISessionContext.IDialogs;
      translator?: ITranslator;
    }
  }

  /**
   * React component for a kernel name button.
   *
   * This wraps the ToolbarButtonComponent and watches the kernel
   * session for changes.
   */

  export function KernelNameComponent(
    props: KernelNameComponent.IProps
  ): JSX.Element {
    const translator = props.translator || nullTranslator;
    const trans = translator.load('jupyterlab');
    const callback = () => {
      void props.dialogs.selectKernel(props.sessionContext);
    };
    return (
      <UseSignal
        signal={props.sessionContext.kernelChanged}
        initialSender={props.sessionContext}
      >
        {sessionContext => (
          <ToolbarButtonComponent
            className={TOOLBAR_KERNEL_NAME_CLASS}
            onClick={callback}
            tooltip={trans.__('Switch kernel')}
            label={sessionContext?.kernelDisplayName}
          />
        )}
      </UseSignal>
    );
  }


  /**
   * Namespace for KernelNameComponent.
   */
  export namespace ToolbarCpuIndicatorWidgetComponent {
    /**
     * Interface for KernelNameComponent props.
     */
    export interface IProps {
      sessionContext: ISessionContext;
    }

    export type Usage = {
      timestamp: Date | null;
      kernel_id: string;
      hostname: string;
      kernel_cpu: number;
      kernel_memory: number;
      pid: number;
      host_cpu_percent: number;
      cpu_count: number;
      host_usage_flag: boolean;
      host_virtual_memory: {
        total: number;
        available: number;
        percent: number;
        used: number;
        free: number;
      };
    };
  }

  // Internal component to manage CPU/memory polling and render values
  function CpuUsageInner({ kernelId }: { kernelId: string }): JSX.Element | null {
    // Track current kernel id to ignore late replies
    const kernelIdRef = React.useRef<string>(kernelId);
    React.useEffect(() => {
      kernelIdRef.current = kernelId;
    }, [kernelId]);

    // Reason and usage states (reason reserved for future UI use)
    const [_, setReason] = React.useState<any | undefined>(undefined);
    const [usage, setUsage] = React.useState<ToolbarCpuIndicatorWidgetComponent.Usage | undefined>(undefined);

    const requestUsage = (kid: string) => {
      return requestAPI<any>(`get_usage/${kid}`).then((data) => {
        // The kernel reply may arrive late due to lax timeouts, so we need to
        // check if it is for the current kernel
        if (kid !== kernelIdRef.current) {
          // Ignore outdated response, but preserve current reason
          return;
        }

        if (data.content?.reason) {
          const reason = data.content;
          setReason(reason);
          return;
        } else {
          setReason(undefined);
        }

        const kernelUsage: ToolbarCpuIndicatorWidgetComponent.Usage = {
          ...data.content,
          timestamp: new Date(),
          // eslint-disable-next-line camelcase
          kernel_id: kid,
        } as any;
        setUsage(kernelUsage);
      });
    };

    // Poll usage every 5 seconds when kernelId is available
    React.useEffect(() => {
      if (!kernelId) {
        return;
      }
      let disposed = false;
      const tick = () => {
        if (disposed) { return; }
        void requestUsage(kernelId).catch(() => {
          // swallow errors; keep last known value
        });
      };
      // Call immediately, then at interval
      tick();
      const handle = window.setInterval(tick, 5000);
      return () => {
        disposed = true;
        window.clearInterval(handle);
      };
    }, [kernelId]);

    if (!kernelId) {
      return null;
    }
    const show = usage && usage.kernel_id === kernelId ? usage : undefined;
    const cpuValue = show && Number.isFinite(Number(show.kernel_cpu)) ? String(show.kernel_cpu) : '\u2014';
    // Convert memory from bytes to MB with one decimal place
    const memoryValue = show && Number.isFinite(Number(show.kernel_memory))
      ? (Number(show.kernel_memory) / (1024 * 1024)).toFixed(2) + 'MB'
      : '\u2014';

    return (
      <>
        <div className={'toolbarKernelUsage'}>
          <div className={'cpu-usage-container'}>
            <cpuUsageIcon.react className={'cpu-usage-icon'}/>
            <span>{cpuValue}</span>
          </div>
          <div className={'memory-usage-container'}>
            <memoryUsageIcon.react className={'memory-usage-icon'}/>
            <span>{memoryValue}</span>
          </div>
        </div>
      </>
    );
  }

  /**
   * React component for CPU indicator toolbar widget.
   * 
   * This displays CPU usage information.
   */
  export function ToolbarCpuIndicatorWidgetComponent(props: ToolbarCpuIndicatorWidgetComponent.IProps): JSX.Element {
    return (

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' , margin: '0px 8px'}}>
        <UseSignal
          signal={props.sessionContext.kernelChanged}
          initialSender={props.sessionContext}
        >

          {sessionContext => {
            const kernelId = sessionContext?.session?.kernel?.id ?? '';
            return (
              <CpuUsageInner kernelId={kernelId} />
            );
          }}
        </UseSignal>
      </div>
    );
  }

  /**
   * A toolbar item that displays kernel status.
   *
   * @deprecated This code is not use any longer and will be removed in JupyterLab 5
   */
  export class KernelStatus extends Widget {
    /**
     * Construct a new kernel status widget.
     */
    constructor(sessionContext: ISessionContext, translator?: ITranslator) {
      super();
      this.translator = translator || nullTranslator;
      this._trans = this.translator.load('jupyterlab');
      this.addClass(TOOLBAR_KERNEL_STATUS_CLASS);
      this._statusNames = translateKernelStatuses(this.translator);
      this._onStatusChanged(sessionContext);
      sessionContext.statusChanged.connect(this._onStatusChanged, this);
      sessionContext.connectionStatusChanged.connect(
        this._onStatusChanged,
        this
      );
    }

    /**
     * Handle a status on a kernel.
     */
    private _onStatusChanged(sessionContext: ISessionContext) {
      if (this.isDisposed) {
        return;
      }

      const status = sessionContext.kernelDisplayStatus;
      const circleIconProps: LabIcon.IProps = {
        container: this.node,
        title: this._trans.__('Kernel %1', this._statusNames[status] || status),
        stylesheet: 'toolbarButton',
        alignSelf: 'normal',
        height: '24px'
      };

      // set the icon
      LabIcon.remove(this.node);
      if (
        status === 'busy' ||
        status === 'starting' ||
        status === 'terminating' ||
        status === 'restarting' ||
        status === 'initializing'
      ) {
        circleIcon.element(circleIconProps);
      } else if (
        status === 'connecting' ||
        status === 'disconnected' ||
        status === 'unknown'
      ) {
        offlineBoltIcon.element(circleIconProps);
      } else {
        circleEmptyIcon.element(circleIconProps);
      }
    }

    protected translator: ITranslator;
    private _trans: TranslationBundle;
    private readonly _statusNames: Record<
      ISessionContext.KernelDisplayStatus,
      string
    >;
  }
}
