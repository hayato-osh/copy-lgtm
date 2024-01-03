import styles from "./Input.module.pcss";

import type { ComponentPropsWithRef } from "react";

type Props = ComponentPropsWithRef<"input">;

export const Input = (props: Props) => {
  return <input className={styles.input} {...props} />;
};
