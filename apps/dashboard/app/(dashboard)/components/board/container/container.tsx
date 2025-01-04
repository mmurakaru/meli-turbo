/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from '@workspace/ui/lib/utils';
import React, { forwardRef } from 'react';

import { Handle, Remove } from '../item';

import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import { Textarea } from '@workspace/ui/components/textarea';
import { Create } from '../item/components/create';
import styles from './container.module.scss';

export interface Props {
  children: React.ReactNode;
  columns?: number;
  label?: string;
  style?: React.CSSProperties;
  horizontal?: boolean;
  hover?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleProps?: React.HTMLAttributes<any>;
  scrollable?: boolean;
  shadow?: boolean;
  placeholder?: boolean;
  unstyled?: boolean;
  onClick?(): void;
  onRemove?(): void;
}

export const Container = forwardRef<HTMLDivElement, Props>(
  (
    {
      children,
      columns = 1,
      handleProps,
      horizontal,
      hover,
      onClick,
      onRemove,
      label,
      placeholder,
      style,
      scrollable,
      shadow,
      unstyled,
      ...props
    }: Props,
    ref,
  ) => {
    const Component = onClick ? 'button' : 'div';

    return (
      <Component
        {...props}
        ref={ref as any}
        style={
          {
            ...style,
            '--columns': columns,
          } as React.CSSProperties
        }
        className={cn(
          styles.Container,
          unstyled && styles.unstyled,
          horizontal && styles.horizontal,
          hover && styles.hover,
          placeholder && styles.placeholder,
          scrollable && styles.scrollable,
          shadow && styles.shadow,
        )}
        onClick={onClick}
        tabIndex={onClick ? 0 : undefined}
      >
        {label ? (
          <div className={styles.Header}>
            {label}
            <div className={styles.Actions}>
              {onRemove ? <Remove onClick={onRemove} /> : undefined}
              <Dialog>
                <DialogTrigger asChild>
                  <Create />
                </DialogTrigger>
                <DialogContent className="sm:max-w-[750px]">
                  <DialogHeader>
                    <DialogTitle className="text-sm">New step</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid w-full items-center gap-1.5">
                      <Input placeholder="Step title" />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Textarea
                        placeholder="Add text..."
                        className="max-h-[400px]"
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex items-center gap-1">
                    <div className="flex items-center gap-2">
                      <Switch id="create-more" />
                      <Label htmlFor="create-more">Create more</Label>
                    </div>
                    <Button type="submit">Create step</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Handle {...handleProps} />
            </div>
          </div>
        ) : null}
        {placeholder ? children : <ul>{children}</ul>}
      </Component>
    );
  },
);
