// Tile.tsx
import React from "react";
import styles from "./Tile.module.css";
import Link from "@docusaurus/Link";

interface TileProps {
  icon: React.ReactNode;
  to: string;
  name: string;
}

export default function Tile({ icon, to, name }: TileProps) {
  return (
    <>
      <Link href={to} className={styles.tile}>
        {icon}
        {name}
      </Link>
    </>
  );
}
