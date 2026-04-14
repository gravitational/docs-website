import styles from "./Callout.module.css";

const Callout: React.FC<{
  text: string;
}> = ({ text }) => {
  return <div className={styles.callout}>{text}</div>;
};

export default Callout;
