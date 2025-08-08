// Tile.tsx
import React from "react";
import styles from "./Tile.module.css";

interface TileProps {
  icon: React.ReactNode;
  to: string;
  name: string;
}

export default function Tile({ icon, to, name }: TileProps) {
  return (
    <>
      <a href={to} className={styles.tile}>
        {icon}
        {name}
      </a>
    </>
  );
}
