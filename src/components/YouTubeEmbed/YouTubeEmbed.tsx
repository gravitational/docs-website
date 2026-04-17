import { getEmbedYouTubeUrl } from "@site/src/utils";
import cn from "clsx";
import { useState } from "react";
import styles from "./YouTubeEmbed.module.css";
import Icon from "../Icon";

type YouTubeEmbedProps = {
  videoId: string;
  title?: string;
  fetchPriority?: "high" | "low";
  className?: string;
};

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  videoId,
  title,
  fetchPriority,
  className,
}) => {
  const [videoActive, setVideoActive] = useState<boolean>(false);

  if (videoActive)
    return (
      <iframe
        src={getEmbedYouTubeUrl(videoId)}
        title={title}
        allow="autoplay; encrypted-media"
        allowFullScreen
        className={cn({ [className as string]: !!className })}
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    );
  return (
    <div
      className={cn(styles.placeholderContainer, {
        [className as string]: !!className,
      })}
      onClick={() => setVideoActive(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
          setVideoActive(true);
        }
      }}
    >
      <picture className={styles.videoPlaceholder}>
        <source
          media="(max-width: 480px)"
          srcSet={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
        />
        <source
          media="(max-width: 768px)"
          srcSet={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
        />
        <img
          src={`https://img.youtube.com/vi/${videoId}/sddefault.jpg`}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          }}
          alt={title}
          width={720}
          height={480}
          fetchPriority={fetchPriority}
        />
      </picture>
      <div className={styles.playButton}>
        <Icon name="play2" size="lg" />
      </div>
    </div>
  );
};

export default YouTubeEmbed;
