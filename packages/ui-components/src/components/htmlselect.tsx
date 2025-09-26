// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import * as React from 'react';
import { caretDownEmptyIcon, LabIcon } from '../icon';
import { classes } from '../utils';
import { DEFAULT_STYLE_CLASS, IElementRefProps } from './interface';

export const HTML_SELECT_CLASS = 'jp-HTMLSelect';

export interface IOptionProps {
  /**
   * A space-delimited list of class names
   */
  className?: string;

  /**
   * Whether this option is non-interactive.
   */
  disabled?: boolean;

  /**
   * Label text for this option. If omitted, `value` is used as the label.
   */
  label?: string;

  /**
   * Value of this option.
   */
  value: string | number;
}

export interface IHTMLSelectProps
  extends IElementRefProps<HTMLSelectElement>,
    React.SelectHTMLAttributes<HTMLSelectElement> {
  defaultStyle?: boolean;

  iconProps?: LabIcon.IProps;

  icon?: LabIcon;

  options?: Array<string | number | IOptionProps>;
}

export class HTMLSelect extends React.Component<IHTMLSelectProps, { open: boolean; highlightedIndex: number }> {
  private _containerRef: React.RefObject<HTMLDivElement> = React.createRef();
  private _selectEl: HTMLSelectElement | null = null;

  componentDidMount(): void {
    document.addEventListener('mousedown', this._onDocumentMouseDown, true);
  }

  componentWillUnmount(): void {
    document.removeEventListener('mousedown', this._onDocumentMouseDown, true);
  }

  private _onDocumentMouseDown = (e: MouseEvent) => {
    if (!this.state?.open) {
      return;
    }
    const node = this._containerRef.current;
    if (node && e.target instanceof Node && !node.contains(e.target)) {
      this.setState({ open: false });
    }
  };

  private _getOptionsArray(options: Array<string | number | IOptionProps> = []) {
    return options.map(opt => (typeof opt === 'object' ? opt : { value: opt }));
  }

  private _getCurrentValue(htmlProps: React.SelectHTMLAttributes<HTMLSelectElement>, options: IOptionProps[]) {
    // Respect controlled value if provided, then defaultValue, else first option
    const controlled = (htmlProps as any).value;
    if (controlled !== undefined && controlled !== null) {
      return controlled as any;
    }
    const def = (htmlProps as any).defaultValue;
    if (def !== undefined && def !== null) {
      return def as any;
    }
    const childValue = this._firstChildValue(htmlProps);
    if (childValue !== undefined) {
      return childValue;
    }
    return options.length ? options[0].value : '';
  }

  private _firstChildValue(htmlProps: React.SelectHTMLAttributes<HTMLSelectElement>): string | number | undefined {
    const children: any = (htmlProps as any).children;
    // If children contain options manually, try to get first one's value prop
    if (Array.isArray(children) && children.length) {
      const first = children.find((c: any) => c && c.type === 'option');
      if (first && first.props) {
        return first.props.value ?? first.props.children;
      }
    }
    return undefined;
  }

  private _labelForValue(value: string | number, options: IOptionProps[]): string | number {
    const found = options.find(o => String(o.value) === String(value));
    return (found && (found.label ?? found.value)) ?? value;
  }

  private _onToggle = () => {
    const open = !this.state?.open;
    this.setState({ open, highlightedIndex: open ? this._currentIndex() : -1 });
  };

  private _currentIndex(): number {
    const { options = [], ...htmlProps } = this.props as any;
    const opts = this._getOptionsArray(options as any);
    const value = this._getCurrentValue(htmlProps, opts);
    return Math.max(0, opts.findIndex(o => String(o.value) === String(value)));
  }

  private _onKeyDown = (e: React.KeyboardEvent) => {
    if (this.props.disabled) {
      return;
    }
    if (!this.state) {
      this.setState({ open: false, highlightedIndex: -1 });
    }
    const { open, highlightedIndex } = this.state ?? { open: false, highlightedIndex: -1 };
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const opts = this._getOptionsArray(this.props.options || []);
      const next = open ? Math.min(opts.length - 1, highlightedIndex + 1) : this._currentIndex();
      this.setState({ open: true, highlightedIndex: next });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // const opts = this._getOptionsArray(this.props.options || []);
      const prev = open ? Math.max(0, highlightedIndex - 1) : this._currentIndex();
      this.setState({ open: true, highlightedIndex: prev });
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (open) {
        this._selectHighlighted();
      } else {
        this.setState({ open: true, highlightedIndex: this._currentIndex() });
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        this.setState({ open: false });
      }
    }
  };

  private _selectHighlighted() {
    const opts = this._getOptionsArray(this.props.options || []);
    const idx = Math.max(0, Math.min(opts.length - 1, this.state?.highlightedIndex ?? 0));
    const opt = opts[idx];
    if (opt && !opt.disabled) {
      this._selectValue(opt.value);
      this.setState({ open: false });
    }
  }

  private _selectValue = (value: string | number) => {
    const select = this._selectEl;
    if (select) {
      // Update value and dispatch native change so React onChange triggers
      const strValue = String(value);
      const option = Array.from(select.options).find(o => String(o.value) === strValue);
      if (option) {
        select.value = option.value;
      } else {
        // If not found (e.g., options provided via children), set directly
        (select as any).value = strValue;
      }
      const evt = new Event('change', { bubbles: true });
      select.dispatchEvent(evt);
    }
  };

  public render(): JSX.Element {
    const {
      className,
      defaultStyle = true,
      disabled,
      elementRef,
      iconProps,
      icon = caretDownEmptyIcon,
      options = [],
      ...htmlProps
    } = this.props as any;

    const cls = classes(
      HTML_SELECT_CLASS,
      {
        [DEFAULT_STYLE_CLASS]: defaultStyle
      },
      className
    );

    // If the HTMLSelect is integrated to a toolbar, we avoid propagating the focus
    // to the element with tabindex=0.
    const handleFocus = (event: React.FocusEvent) => {
      event.stopPropagation();
    };

    const opts = this._getOptionsArray(options);

    const hiddenSelectProps = {
      onFocus: handleFocus,
      disabled,
      ref: (node: HTMLSelectElement | null) => {
        this._selectEl = node;
        if (elementRef) {
          elementRef(node);
        }
      },
      ...htmlProps
    } as React.SelectHTMLAttributes<HTMLSelectElement> & { ref: any };

    const currentValue = this._getCurrentValue(htmlProps, opts);
    const currentLabel = this._labelForValue(currentValue, opts);

    const isOpen = this.state?.open ?? false;
    const highlightedIndex = this.state?.highlightedIndex ?? -1;

    const buttonStyle: React.CSSProperties = {
      boxSizing: 'border-box',
      width: '100%',
      height: 36,
      lineHeight: '14px',
      padding: '0 25px 0 10px',
      textAlign: 'left',
      border: 'none',
      background: 'transparent',
      color: 'var(--jp-ui-font-color0)',
      fontSize: 'var(--jp-ui-font-size1)',
      fontFamily: 'var(--jp-ui-font-family)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      outline: 'none'
    };

    const containerStyle: React.CSSProperties = { position: 'relative', padding: '0 2px' };

    const menuStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      marginTop: 37,
      background: 'var(--jp-layout-color1)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      borderRadius: 4,
      maxHeight: 240,
      overflowY: 'auto',
      border: `1px solid var(--jp-input-border-color)`
    };

    const optionStyle: React.CSSProperties = {
      padding: '6px 10px',
      cursor: 'pointer',
      background: 'transparent',
      color: 'var(--jp-ui-font-color0)'
    };

    const optionHoverStyle: React.CSSProperties = {
      ...optionStyle,
      background: 'var(--jp-layout-color2)'
    };

    // Build the hidden select options (for form value & change events)
    const optionChildren = opts.map(props => (
      <option {...props} key={props.value}>
        {props.label || props.value}
      </option>
    ));

    return (
      <div className={cls} style={containerStyle} ref={this._containerRef}>
        {/* Hidden native select to preserve value & onChange contract */}
        <select style={{ display: 'none' }} {...(hiddenSelectProps as any)}>
          {optionChildren}
          {htmlProps.children}
        </select>

        {/* Visible custom control */}
        <button
          type="button"
          style={buttonStyle}
          onClick={this._onToggle}
          onKeyDown={this._onKeyDown}
          onFocus={handleFocus}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          {currentLabel}
        </button>

        {/* Caret icon positioned similar to prior select caret */}
        <icon.react
          {...{
            tag: 'span',
            stylesheet: 'select',
            right: '4px',
            top: '8px',
            ...iconProps
          }}
        />

        {isOpen && (
          <div role="listbox" style={menuStyle}>
            {opts.map((opt, idx) => {
              const isDisabled = !!opt.disabled;
              const style = idx === highlightedIndex ? optionHoverStyle : optionStyle;
              return (
                <div
                  key={String(opt.value)}
                  role="option"
                  aria-selected={String(opt.value) === String(currentValue)}
                  onMouseEnter={() => this.setState({ highlightedIndex: idx })}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => {
                    if (!isDisabled) {
                      this._selectValue(opt.value);
                      this.setState({ open: false });
                    }
                  }}
                  style={{ ...style, cursor: isDisabled ? 'not-allowed' : style.cursor, opacity: isDisabled ? 0.6 : 1 }}
                >
                  {opt.label ?? opt.value}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
}
