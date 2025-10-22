import type { ComponentPropsWithoutRef } from "react";
import * as styles from "./Label.module.pcss";

type Props = ComponentPropsWithoutRef<"label">;

export const Label = ({ children, className, ...props }: Props) => {
  return (
    <label className={`${styles.root} ${className}`} {...props}>
      {children}
    </label>
  );
};
