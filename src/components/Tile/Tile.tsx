// Tile.tsx
import React from "react";
import styles from "./Tile.module.css";

interface TileProps {
  icon: React.ReactNode;
  to: string;
  name: string;
  tooltip?: string;
}

export default function Tile({ icon, to, name, tooltip }: TileProps) {
  const ariaLabel = tooltip ? `${name}: ${tooltip}` : name;
  return (
    <a href={to} className={styles.tile} title={tooltip} aria-label={ariaLabel}>
      {icon}
      {name}
    </a>
  );
}
