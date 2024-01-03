import * as styles from "./Label.module.pcss";

import type { ComponentPropsWithoutRef } from "react";

type Props = ComponentPropsWithoutRef<"label">;

export const Label = ({ children, className, ...props }: Props) => {
  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control
    <label className={`${styles.root} ${className}`} {...props}>
      {children}
    </label>
  );
};
