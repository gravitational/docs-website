import styles from "./TextWithMedia.module.css";
import cn from "classnames";
import { getEmbedYouTubeUrl } from "@site/src/utils";

interface TextWithMediaProps {
  className?: string;
  title?: string;
  image?: any;
  youtubeVideoUrl?: string;
  children: React.ReactNode;
}

const TextWithMedia: React.FC<TextWithMediaProps> = ({
  className = "",
  title,
  image,
  youtubeVideoUrl,
  children,
}) => {
  return (
    <section className={cn(styles.textWithMedia, className)}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.text}>{children}</div>
        </div>
        <div className={styles.media}>
          {image && <img src={image} alt={title} className={styles.image} />}
          {youtubeVideoUrl && (
            <iframe
              src={getEmbedYouTubeUrl(youtubeVideoUrl, {
                autoplayMutedLoop: true,
              })}
              title={title}
              className={styles.video}
              allowFullScreen
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default TextWithMedia;
