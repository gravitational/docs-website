import styles from "./TextWithMedia.module.css";
import cn from "classnames";
import { getEmbedYouTubeUrl } from "@site/src/utils";

interface TextWithMediaProps {
  className?: string;
  title?: string;
  image?: any;
  videoSrc?: string;
  youtubeVideoId?: string;
  children: React.ReactNode;
}

const TextWithMedia: React.FC<TextWithMediaProps> = ({
  className = "",
  title,
  image,
  videoSrc,
  youtubeVideoId,
  children,
}) => {
  return (
    <section className={cn(styles.textWithMedia, className)}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.text}>{children}</div>
        </div>
        <div className={cn(styles.media, { [styles.youtube]: youtubeVideoId })}>
          {image && <img src={image} alt={title} className={styles.image} />}
          {videoSrc && (
            <video src={videoSrc} title={title} className={styles.video} autoPlay muted loop />
          )}
          {youtubeVideoId && (
            <iframe
              className={styles.video}
              src={getEmbedYouTubeUrl(youtubeVideoId)}
              title={title}
              frameBorder="0"
              allowFullScreen
            ></iframe>
          )}
        </div>
      </div>
    </section>
  );
};

export default TextWithMedia;
