export const getEmbedYouTubeUrl = (url: string, options: { autoplayMutedLoop: boolean }) => {
    const videoId = url.split("v=")[1].split("?")[0];
    const optionsQuery = options.autoplayMutedLoop ? `?autoplay=1&mute=1&loop=1&controls=0&color=white&modestbranding=0&rel=0&playsinline=1&enablejsapi=1&playlist=${videoId}` : "";
    return `https://www.youtube.com/embed/${videoId}${optionsQuery}`;
  };