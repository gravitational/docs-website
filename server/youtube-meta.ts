/*
 * Gets YouTube video metadate given video ID.
 */

import { getFromSecretOrEnv } from "../utils/general";

const YOUTUBE_API_KEY = getFromSecretOrEnv("YOUTUBE_API_KEY");

const REQUEST_PATH = "videos";
const YOUTUBE_URL = "https://www.youtube.com/watch";
const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3";

const addZero = (num: number) => String(num).padStart(2, `0`);

const changeFormatDuration = (duration: string) => {
  const reptms = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
  const matches = reptms.exec(duration);
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  if (matches && matches[1]) hours = Number(matches[1]);
  if (matches && matches[2]) minutes = Number(matches[2]);
  if (matches && matches[3]) seconds = Number(matches[3]);
  const hourDuration = hours !== 0 ? `${hours}:` : "";
  return `${hourDuration}${addZero(minutes)}:${addZero(seconds)}`;
};

/* 
  This function extracts a clean description from YouTube video description text. 
  If a proper description can't be extracted, returns null.
*/
const extractYouTubeVideoDescription: (description: string) => string | null = (
  description
) => {
  if (!description || description.trim().length === 0) {
    return null;
  }

  const lines = description.split("\n");
  const descriptionLines: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // skip empty lines, lines with links and lines with timestamps.
    if (trimmedLine.length === 0) {
      continue;
    }

    if (trimmedLine.includes("http://") || trimmedLine.includes("https://")) {
      continue;
    }

    if (/^\d{1,2}:\d{2}/.test(trimmedLine)) {
      continue;
    }

    // Skip lines that include hashtags or emojis
    if (
      trimmedLine.startsWith("#") ||
      trimmedLine.startsWith("⏰") ||
      trimmedLine.startsWith("🔗") ||
      trimmedLine.startsWith("🖥️")
    ) {
      continue;
    }

    // Finally skip common section headers
    const lowerCaseLine = trimmedLine.toLowerCase();
    if (
      lowerCaseLine === "timestamps" ||
      lowerCaseLine === "mentioned links" ||
      lowerCaseLine === "links"
    ) {
      break;
    }

    descriptionLines.push(trimmedLine);
  }

  const result = descriptionLines.join(" ").trim();

  if (result.length < 20) {
    return null;
  }

  return result.split(".")[0] + ".";
};

export interface Meta {
  href: string;
}

export interface FullMeta extends Meta {
  title: string;
  duration: string;
  thumbnail: string;
  description?: string;
}

interface RawContentDetails {
  duration: string;
}

interface RawThumnailsVariant {
  url: string;
  width: number;
  height: number;
}

interface RawThumbnailsSize {
  default: RawThumnailsVariant;
  high: RawThumnailsVariant;
  maxres: RawThumnailsVariant;
  medium: RawThumnailsVariant;
  standart: RawThumnailsVariant;
}

interface RawSnippet {
  thumbnails: RawThumbnailsSize;
  title: string;
  description: string;
}

interface RawItem {
  contentDetails: RawContentDetails;
  snippet: RawSnippet;
}

interface RawVideoMeta {
  items: RawItem[];
}

const cache: Record<string, Meta | FullMeta> = {};

export async function fetchVideoMeta(id: string): Promise<Meta | FullMeta> {
  if (id in cache) {
    return cache[id];
  }

  let data: Meta | FullMeta = {
    href: `${YOUTUBE_URL}?v=${id}`,
  };

  if (YOUTUBE_API_KEY) {
    try {
      const response = await fetch(
        `${YOUTUBE_API_URL}/${REQUEST_PATH}?part=snippet&part=contentDetails&id=${id}&key=${YOUTUBE_API_KEY}`
      );

      const rawData: unknown = await response.json();
      const rawDataItem = (rawData as RawVideoMeta).items[0];

      data = {
        href: data.href,
        title: rawDataItem.snippet.title,
        description: extractYouTubeVideoDescription(
          rawDataItem.snippet.description
        ),
        thumbnail: rawDataItem.snippet.thumbnails.medium.url,
        duration: changeFormatDuration(rawDataItem.contentDetails.duration),
      };
    } catch (e) {
      console.error(e);

      if (process.env.NODE_ENV === "production") {
        throw new Error("Can't get YouTube Video meta");
      }
    }
  } else {
    data = {
      href: "#",
      title: "This is a fake video link, YouTube API key is not available",
      thumbnail: "/docs/placeholder-videobar.jpg",
      duration: "03:44",
    };
  }

  cache[id] = data;

  return data;
}
