import styles from "./TeleportEditionsGrid.module.css";

interface TeleportEditionsGridProps {
  children?: React.ReactNode;
  id?: string;
}

const TeleportEditionsGrid: React.FC<TeleportEditionsGridProps> = ({
  children,
  id,
}) => {
  return (
    <section className={styles.grid} id={id}>
      <div className={styles.container}>
        <div className={styles.editionCards}>
          {children}
        </div>
      </div>
    </section>
  );
};

export default TeleportEditionsGrid;