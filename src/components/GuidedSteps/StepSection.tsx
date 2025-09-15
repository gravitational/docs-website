import styles from "./Step.module.css";

const StepSection: React.FC<{ index?: number; children: React.ReactNode }> = ({
  index,
  children,
}) => (
  <div className={styles.stepSection}>
    <div className={styles.index}>{index}</div>
    {children}
  </div>
);

export default StepSection;