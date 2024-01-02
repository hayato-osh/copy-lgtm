import styles from "./Button.module.pcss";

import type { ComponentPropsWithoutRef } from "react";

type Props = ComponentPropsWithoutRef<"button">;

export const Button = ({ type = "button", children, ...props }: Props) => {
  return (
    // eslint-disable-next-line react/button-has-type
    <button type={type} className={styles.btn} {...props}>
      {children}
    </button>
  );
};
