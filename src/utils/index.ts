export const YOUTUBE_EMBED_ORIGIN = "https://www.youtube-nocookie.com";

export const getEmbedYouTubeUrl = (videoId: string, start?: number) => {
  const startParam = start !== undefined ? `&start=${start}` : "";
  return `${YOUTUBE_EMBED_ORIGIN}/embed/${videoId}?autoplay=1&enablejsapi=1${startParam}`;
};
