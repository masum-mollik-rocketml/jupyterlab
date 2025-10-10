// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import * as React from 'react';
import {addCellMenuIcon, LabIcon} from '../icon';
import {LabIconStyle} from "../style";
import { classes } from '../utils';
import ISize = LabIconStyle.ISize;

export interface IDropdownMenuItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface IDropdownMenuProps {
  label?: string;
  icon?: LabIcon;
  iconSize?: ISize;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  items: IDropdownMenuItem[];
}

export class DropdownMenu extends React.Component<IDropdownMenuProps, { open: boolean }> {
  state = { open: false };
  private _containerRef: React.RefObject<HTMLDivElement> = React.createRef();

  componentDidMount(): void {
    document.addEventListener('mousedown', this._onDocumentMouseDown, true);
  }

  componentWillUnmount(): void {
    document.removeEventListener('mousedown', this._onDocumentMouseDown, true);
  }

  private _onDocumentMouseDown = (e: MouseEvent) => {
    if (!this.state.open) {
      return;
    }
    const node = this._containerRef.current;
    if (node && e.target instanceof Node && !node.contains(e.target)) {
      this.setState({ open: false });
    }
  };

  private _toggle = () => {
    this.setState(s => ({ open: !s.open }));
  };

  private _onItemClick = (item: IDropdownMenuItem) => {
    if (!item.disabled) {
      try {
        item.onClick();
      } finally {
        this.setState({ open: false });
      }
    }
  };

  render(): JSX.Element {
    const { label = 'Menu', icon = addCellMenuIcon, className, buttonClassName, menuClassName, items, iconSize } = this.props;
    return (
      <div
        className={classes('jp-DropdownMenu', className)}
        ref={this._containerRef}
        style={{ display: 'inline-block' }}
      >
        <button
          className={classes('jp-DropdownMenu-button', buttonClassName)}
          type="button"
          onClick={this._toggle}
          aria-haspopup="true"
          aria-expanded={this.state.open}
          title={label}
        >
          <LabIcon.resolveReact icon={icon} className={'jp-Icon jp-DropdownMenu-button-icon'} elementSize={iconSize ? iconSize : 'large'} tag={'div'} />
        </button>
        {this.state.open && (
          <ul
            className={classes('jp-DropdownMenu-menu', menuClassName)}
            role="menu"
          >
            {items.map((item, idx) => (
              <li
                key={idx}
                role="menuitem"
                tabIndex={0}
                className={classes('jp-DropdownMenu-item', item.disabled ? 'lm-mod-disabled' : undefined)}
                onClick={() => this._onItemClick(item)}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ' ') && !item.disabled) {
                    e.preventDefault();
                    this._onItemClick(item);
                  }
                }}
              >
                {item.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
}

export default DropdownMenu;
