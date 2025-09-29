// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {ITranslator, nullTranslator, TranslationBundle} from "@jupyterlab/translation";
import {CommandRegistry} from "@lumino/commands";
import React from "react";
import { ReactWidget } from './vdom';
import {createButtonCaretIcon, createButtonIcon, LabIcon} from '../icon';


/**
 * A ReactWidget rendering a menu for executing commands (e.g. creating new files).
 */
export class NewFileMenu extends ReactWidget {
  constructor(options: NewFileMenu.IOptions) {
    super();
    // Keep old class for backward-compatible styling, add new one for clarity
    this.addClass('jp-NewFileDropdown');
    this.addClass('jp-NewFileMenu');

    this._translator = options.translator ?? nullTranslator;
    this._trans = this._translator.load('jupyterlab');

    this._label = options.label ?? this._trans.__('New');
    this._tooltip = options.tooltip ?? this._trans.__('Create new…');
    this._classNameButton = options.classNameButton ?? 'jp-NewFileDropdown-button';
    this._classNameOption = options.classNameOption ?? 'jp-NewFileDropdown-option';
    if (typeof options.enabled === 'function') {
      this._enabled = options.enabled;
    } else {
      const enabled = options.enabled ?? true;
      this._enabled = () => enabled;
    }

    this._commands = options.commands;
    this._items = options.items ?? [];
  }

  /** Update dropdown items programmatically */
  set items(items: ReadonlyArray<NewFileMenu.IItem>) {
    this._items = items.slice();
    this.update();
  }

  get items(): ReadonlyArray<NewFileMenu.IItem> {
    return this._items;
  }

  render(): React.ReactElement<any> {
    const disabledAll = !this._enabled();

    const menuItems = this._items.map(item => ({
      label: this._labelFor(item),
      icon: item.icon,
      onClick: () => {
        void this._commands.execute(item.command, item.args ?? {});
      },
      disabled: disabledAll || !this._isCommandEnabled(item)
    }));

    return (
      <div className="jp-NewFileDropdown-wrapper jp-NewFileMenu-wrapper" title={this._tooltip}>
        <InlineMenu
          label={this._label || this._tooltip}
          buttonClassName={this._classNameButton}
          menuClassName={this._classNameOption}
          items={menuItems}
        />
      </div>
    );
  }

  private _isCommandEnabled(item: NewFileMenu.IItem): boolean {
    try {
      if (!this._commands.listCommands().includes(item.command)) {
        return false;
      }
      // If registry supports isEnabled, check it; default to true
      // @ts-ignore - CommandRegistry has isEnabled in Lumino
      return this._commands.isEnabled ? this._commands.isEnabled(item.command, item.args) : true;
    } catch (e) {
      return false;
    }
  }

  private _labelFor(item: NewFileMenu.IItem): string {
    if (item.label) {
      return item.label;
    }
    // Try to retrieve label from command if available
    try {
      const cmd = this._commands.listCommands().includes(item.command) ? item.command : undefined;
      if (!cmd) {
        return item.id;
      }
      const label = this._commands.label(cmd, item.args);
      return typeof label === 'string' && label.length > 0 ? label : item.id;
    } catch (e) {
      return item.id;
    }
  }

  private _translator: ITranslator;
  private _trans: TranslationBundle;
  private _label: string;
  private _tooltip: string;
  private _classNameButton: string;
  private _classNameOption: string;
  private _enabled: () => boolean;
  private _items: ReadonlyArray<NewFileMenu.IItem>;
  private _commands: CommandRegistry;
}

// Internal lightweight dropdown menu for NewFileMenu with equal button/menu width
interface IInlineMenuItem {
  label: string;
  icon?: LabIcon;
  onClick: () => void;
  disabled?: boolean;
}

interface IInlineMenuProps {
  label?: string;
  buttonClassName?: string;
  menuClassName?: string;
  items: IInlineMenuItem[];
}

const InlineMenu: React.FC<IInlineMenuProps> = ({ label = 'Menu', buttonClassName, menuClassName, items }) => {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const [width, setWidth] = React.useState<number | undefined>(undefined);

  const updateWidth = React.useCallback(() => {
    const w = buttonRef.current?.offsetWidth;
    setWidth(w && w > 0 ? w : undefined);

  }, []);

  React.useEffect(() => {
    // Close on outside click
    const onDocMouseDown = (e: MouseEvent) => {
      if (!open) {
        return;
      }
      const node = containerRef.current;
      if (node && e.target instanceof Node && !node.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown, true);
    return () => document.removeEventListener('mousedown', onDocMouseDown, true);
  }, [open]);

  React.useEffect(() => {
    // Keep menu width in sync with button width
    updateWidth();
  }, [open, updateWidth]);

  React.useEffect(() => {
    // Handle window resizes
    const onResize = () => updateWidth();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [updateWidth]);

  const onItemClick = (item: IInlineMenuItem) => {
    if (!item.disabled) {
      try {
        item.onClick();
      } finally {
        setOpen(false);
      }
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      <button
        ref={buttonRef}
        className={buttonClassName}
        style={{ width: '100%' }}
        type="button"
        onClick={() => {
          setOpen(v => !v);
          // Measure immediately after next paint
          setTimeout(updateWidth, 0);
        }}
        aria-haspopup="true"
        aria-expanded={open}
        title={label}
      >
        <div className={'jp-CreateButton-text-icon-container'}>
          <LabIcon.resolveReact icon={createButtonIcon} className={'jp-NewFileMenu-ButtonIcon'} elementSize={'large'} tag={'span'} />
          <span className={'jp-NewFileMenu-buttonText'}>{label}</span>
        </div>
        <LabIcon.resolveReact icon={createButtonCaretIcon} className={'jp-NewFileMenu-ButtonCaret'} elementSize={'large'} tag={'span'} />

      </button>
      {open && (
        <ul
          className={menuClassName}
          style={{width: width !== undefined ? width : undefined}}
          role="menu"
        >
          {items.map((item, idx) => (
            <li
              key={idx}
              role="menuitem"
              tabIndex={0}
              className={item.disabled ? 'lm-mod-disabled' : undefined}
              onClick={() => onItemClick(item)}
              onKeyDown={e => {
                if ((e.key === 'Enter' || e.key === ' ') && !item.disabled) {
                  e.preventDefault();
                  onItemClick(item);
                }
              }}
              style={{ listStyle: 'none' }}
            >
              <span style={{display: "flex", alignItems: "center", flexDirection: "row", gap: "6px"}}>
                {item.icon ? (
                  <LabIcon.resolveReact icon={item.icon} className={'jp-Icon jp-NewFileMenu-itemIcon'} elementSize={'large'} tag={'span'} />
                ) : null}
                <span className={'menu-item-text'}>{item.label}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/**
 * Namespace for NewFileMenu statics.
 */
export namespace NewFileMenu {
  /** Definition of a menu entry. */
  export interface IItem {
    /** Unique id for the option. */
    id: string;
    /** Command id to execute when selected. */
    command: string;
    /** Optional command arguments. */
    args?: Readonly<{ [key: string]: any }>;
    /** Optional label to display (fallbacks to command label). */
    label?: string;
    /** Optional icon displayed before the label. */
    icon?: LabIcon;
  }

  /** Options for constructing a NewFileMenu. */
  export interface IOptions {
    /** The command registry to use when executing items. */
    commands: CommandRegistry;
    /** The translator to use for UI strings. */
    translator?: ITranslator;
    /** Label/title for the menu button tooltip. */
    label?: string;
    /** CSS class for the menu button element. */
    classNameButton?: string;
    /** CSS class for the menu list element. */
    classNameOption?: string;
    /** Tooltip shown on hover. */
    tooltip?: string;
    /** Whether the menu is enabled (can be boolean or a predicate). */
    enabled?: boolean | (() => boolean);
    /** Menu entries. */
    items?: ReadonlyArray<IItem>;
  }
}
