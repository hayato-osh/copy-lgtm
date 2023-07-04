import * as PopoverPrimitive from "@radix-ui/react-popover";

import {
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import * as styles from "./Popover.module.pcss";

type Props = ComponentPropsWithoutRef<typeof PopoverPrimitive.Root> & {
  trigger: ReactNode;
  triggerProps?: ComponentProps<typeof PopoverPrimitive.Trigger>;
};

export const Popover = ({
  trigger,
  triggerProps,
  children,
  ...props
}: Props) => {
  const { asChild = true, ...restTriggerProps } = triggerProps || {};
  return (
    <PopoverPrimitive.Root {...props}>
      <PopoverPrimitive.Trigger asChild={asChild} {...restTriggerProps}>
        {trigger}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Content sideOffset={5} className={styles.content}>
        {children}
        <PopoverPrimitive.Arrow className={styles.arrow} />
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
};
