import { clsx } from "clsx";

import styles from "./Icon.module.css";
import * as icons from "./icons";
import type { IconName } from "./types";

export interface IconProps {
  name: IconName;
  size?: "xxs" | "xs" | "sm" | "sm-md" | "md" | "lg" | "xl";
  className?: string;
  inline?: boolean;
}

const Icon = ({ name, size = "md", className, inline = false }: IconProps) => {
  const IconSVG = icons[name];

  if (!IconSVG) {
    return <span className={clsx(styles.wrapper, styles[size], className)} />;
  }

  return (
    <IconSVG
      className={clsx(styles.wrapper, styles[size], className, {
        [styles.inline]: inline,
      })}
    />
  );
};

export default Icon;
