import type { ComponentPropsWithRef } from "react";
import styles from "./Input.module.pcss";

type Props = ComponentPropsWithRef<"input">;

export const Input = (props: Props) => {
  return <input className={styles.input} {...props} />;
};
