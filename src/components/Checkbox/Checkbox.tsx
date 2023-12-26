import * as styles from "./Checkbox.module.pcss";

import type { ComponentPropsWithoutRef } from "react";

type Props = ComponentPropsWithoutRef<"input">;

export const Checkbox = (props: Props) => {
  return <input type="checkbox" className={styles.root} {...props} />;
};
