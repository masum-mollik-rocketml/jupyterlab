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
   * Create a custom toolbar widget item.
   * 
   * #### Notes
   * It displays an icon and text in a row layout.
   */
  export function createCustomWidget(sessionContext: ISessionContext): Widget {
    const el = ReactWidget.create(
      <Private.ToolbarMemoryIndicatorWidgetComponent sessionContext={sessionContext}/>
    );
    el.addClass('jp-MemoryIndicator');
    return el;
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
  export namespace ToolbarMemoryIndicatorWidgetComponent {
    /**
     * Interface for KernelNameComponent props.
     */
    export interface IProps {
      sessionContext: ISessionContext;
    }
  }
  /**
   * React component for a custom toolbar widget.
   * 
   * This displays an icon and text in a row layout.
   */
  export function ToolbarMemoryIndicatorWidgetComponent(props: ToolbarMemoryIndicatorWidgetComponent.IProps): JSX.Element {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' , margin: '0px 8px'}}>
        <UseSignal
          signal={props.sessionContext.kernelChanged}
          initialSender={props.sessionContext}
        >
          {sessionContext => (
            <memoryUsageIcon.react />
          )}
        </UseSignal>

        <span style={{ fontSize: '13px' }}>Memory Usage</span>
      </div>
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

          {sessionContext => (
            <cpuUsageIcon.react />
          )}
        </UseSignal>

        <span style={{ fontSize: '13px' }}>CPU Usage</span>
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
