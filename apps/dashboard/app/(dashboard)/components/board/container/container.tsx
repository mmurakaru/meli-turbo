/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from '@workspace/ui/lib/utils';
import React, { forwardRef, useRef, useState } from 'react';

import { Handle, Remove } from '../item';

import { Badge } from '@workspace/ui/components/badge';
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
import { Separator } from '@workspace/ui/components/separator';
import { Switch } from '@workspace/ui/components/switch';
import { Textarea } from '@workspace/ui/components/textarea';
import useAutosizeTextArea from '@workspace/ui/hooks/use-auto-size-textarea';
import { ChevronRight, ComponentIcon } from 'lucide-react';
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

    const [value, setValue] = useState('');
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    useAutosizeTextArea(textAreaRef.current, value);

    const handleChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = evt.target?.value;

      setValue(val);
    };

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
                <DialogContent
                  className="sm:max-w-[750px] p-0 gap-0"
                  aria-describedby={undefined}
                >
                  <DialogHeader className="p-3">
                    <div className="flex items-center gap-1.5 text-foreground">
                      <Badge
                        variant="secondary"
                        className="flex gap-1.5 py-1 text-xs font-normal"
                      >
                        <ComponentIcon
                          className="size-3 stroke-violet-500"
                          strokeWidth={1}
                        />
                        Module
                      </Badge>
                      <ChevronRight
                        strokeWidth={1}
                        className="size-3"
                      />
                      <DialogTitle className="text-xs font-normal">New step</DialogTitle>
                    </div>
                  </DialogHeader>
                  <div className="grid px-3 pb-3">
                    <Input
                      placeholder="Step title"
                      className="font-medium"
                      variant="ghost"
                    />
                    <Textarea
                      placeholder="Add description..."
                      className="max-h-[400px]"
                      variant="ghost"
                      onChange={handleChange}
                      ref={textAreaRef}
                      rows={1}
                    />
                  </div>
                  <Separator />
                  <DialogFooter className="gap-1 p-3">
                    <div className="flex items-center gap-2">
                      <Switch id="create-more" />
                      <Label
                        htmlFor="create-more"
                        className="font-normal text-xs text-muted-foreground"
                      >
                        Create more
                      </Label>
                    </div>
                    <Button
                      size="sm"
                      type="submit"
                    >
                      Create step
                    </Button>
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
