import Icon from "../Icon";
import { VideoBarProps } from "./types";
import styles from "./VideoBar.module.css";

export default function VideoBar({
  thumbnail,
  href,
  title,
  description,
}: VideoBarProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.wrapper}
    >
      <div className={styles.info}>
        <div className={styles.tag}>Video guide</div>
        <div className={styles.title}>{title}</div>
        {description && <div className={styles.description}>{description}</div>}
      </div>
      <div className={styles.thumbnail}>
        <Icon name="play2" size="lg" className={styles.icon} />
        <img
          src={thumbnail}
          width={200}
          height={113}
          alt={title}
          className={styles.objectFit}
        />
      </div>
    </a>
  );
}
