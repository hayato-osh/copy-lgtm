import type { ComponentPropsWithoutRef } from "react";
import styles from "./Button.module.pcss";

type Props = ComponentPropsWithoutRef<"button">;

export const Button = ({ type = "button", children, ...props }: Props) => {
  return (
    <button type={type} className={styles.btn} {...props}>
      {children}
    </button>
  );
};
