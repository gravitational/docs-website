export const getEmbedYouTubeUrl = (videoId: string, start?: number) => {
  const startParam = start !== undefined ? `&start=${start}` : "";
  return `https://www.youtube.com/embed/${videoId}?autoplay=1${startParam}`;
};
