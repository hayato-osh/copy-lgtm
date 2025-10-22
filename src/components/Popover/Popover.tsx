import * as PopoverPrimitive from "@radix-ui/react-popover";

import type {
  ComponentProps,
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

import * as styles from "./Popover.module.pcss";

type Props = ComponentPropsWithoutRef<typeof PopoverPrimitive.Root> & {
  trigger: ReactNode;
  triggerProps?: ComponentProps<typeof PopoverPrimitive.Trigger>;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

export const Popover = ({
  trigger,
  triggerProps,
  children,
  side = "top",
  align = "center",
  sideOffset = 5,
  ...props
}: Props) => {
  const { asChild = true, ...restTriggerProps } = triggerProps || {};
  return (
    <PopoverPrimitive.Root {...props}>
      <PopoverPrimitive.Trigger asChild={asChild} {...restTriggerProps}>
        {trigger}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          className={styles.content}
          style={{ zIndex: 9999 }}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};
