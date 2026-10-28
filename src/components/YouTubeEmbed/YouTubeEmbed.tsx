import { getEmbedYouTubeUrl, YOUTUBE_EMBED_ORIGIN } from "@site/src/utils";
import cn from "clsx";
import { useEffect, useRef, useState } from "react";
import styles from "./YouTubeEmbed.module.css";
import Icon from "../Icon";

const THUMBNAIL_BASE_URL = "https://i.ytimg.com/vi";

type YouTubeEmbedProps = {
  videoId: string;
  title?: string;
  fetchPriority?: "high" | "low";
  className?: string;
  // Jumps the video to `time` seconds whenever a new object is passed.
  seek?: { time: number };
};

// Sends a command over the same postMessage channel the YouTube IFrame API
// uses. Requires enablejsapi=1 in the embed URL.
const sendPlayerCommand = (
  iframe: HTMLIFrameElement | null,
  func: string,
  args: unknown[] = [],
) =>
  iframe?.contentWindow?.postMessage(
    JSON.stringify({ event: "command", func, args }),
    YOUTUBE_EMBED_ORIGIN,
  );

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  videoId,
  title,
  fetchPriority,
  className,
  seek,
}) => {
  const [videoActive, setVideoActive] = useState<boolean>(false);
  // Set only when the player first loads, so later seeks don't change the
  // iframe src and reload it.
  const [start, setStart] = useState<number>();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!seek) return;
    if (!videoActive) {
      setStart(seek.time);
      setVideoActive(true);
      return;
    }
    sendPlayerCommand(iframeRef.current, "seekTo", [seek.time, true]);
    sendPlayerCommand(iframeRef.current, "playVideo");
    // Only react to new seeks, not to the player becoming active.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seek]);

  if (videoActive)
    return (
      <iframe
        ref={iframeRef}
        src={getEmbedYouTubeUrl(videoId, start)}
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
          srcSet={`${THUMBNAIL_BASE_URL}/${videoId}/mqdefault.jpg`}
        />
        <source
          media="(max-width: 768px)"
          srcSet={`${THUMBNAIL_BASE_URL}/${videoId}/hqdefault.jpg`}
        />
        <img
          src={`${THUMBNAIL_BASE_URL}/${videoId}/sddefault.jpg`}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              `${THUMBNAIL_BASE_URL}/${videoId}/hqdefault.jpg`;
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
