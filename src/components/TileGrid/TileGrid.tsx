import React from 'react';
import styles from './TileGrid.module.css';
import Tile from '../Tile';

interface TileGridProps {
  tiles: {
    icon: React.ReactNode;
    to: string;
    name: string;
  }[];
}

export default function TileGrid({ tiles }: TileGridProps) {
  return (
    <div className={styles.gridContainer}>
      {tiles.map((tile, index) => (
          <Tile key={index} icon={tile.icon} to={tile.to} name={tile.name} />
      ))}
    </div>
  );
}