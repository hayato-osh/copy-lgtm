import type { ComponentPropsWithoutRef } from "react";
import * as styles from "./Checkbox.module.pcss";

type Props = ComponentPropsWithoutRef<"input">;

export const Checkbox = (props: Props) => {
  return <input type="checkbox" className={styles.root} {...props} />;
};
