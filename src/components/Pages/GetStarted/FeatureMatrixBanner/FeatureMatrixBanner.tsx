import styles from "./FeatureMatrixBanner.module.css";

interface FeatureMatrixBannerProps {
  title?: string;
  buttonText?: string;
  buttonHref?: string;
  className?: string;
}

const FeatureMatrixBanner: React.FC<FeatureMatrixBannerProps> = ({
  title = "Quickly compare Teleport Editions and see which edition works best for your organization",
  buttonText = "Teleport Feature Matrix",
  buttonHref = "#",
  className = "",
}) => {
  return (
    <div className={`${styles.banner} ${className}`}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h5 className={styles.title}>{title}</h5>
        </div>
        <div className={styles.buttonWrapper}>
          <a href={buttonHref} className={styles.button}>
            {buttonText}
          </a>
        </div>
      </div>
    </div>
  );
};

export default FeatureMatrixBanner;