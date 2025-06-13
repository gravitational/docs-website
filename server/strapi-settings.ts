import { writeFileSync } from "fs";
import { getNavData, getBannerData } from "./strapi";

export type GenerateEventProps = {
  file: string; // path to file
};

export const generateEvent = async ({ file }: GenerateEventProps) => {
  const writeEventData = (data: object) => {
    try {
      writeFileSync(file, JSON.stringify(data));
      console.log("Writing event data to file...", "\n");
      console.log("FILE:", file, "\n");
    } catch (error) {
      console.error("Error writing event data to file:", error);
    }
  };
  let eventData = undefined;
  eventData = await getBannerData();
  if (eventData) {
    writeEventData(eventData);
  } else {
    writeEventData({});
  }
};

export const generateNavigation = async ({ file }: { file: string }) => {
  let navData = undefined;
  try {
    navData = await getNavData();
    if (!navData) return;
  } catch (error) {
    console.error("No header navigation data returned");
    return;
  }
  if (navData) {
    try {
      writeFileSync(file, JSON.stringify(navData));
      console.log("Writing header navigation data to file: ", file);
    } catch (error) {
      console.error("Error writing header navigation data to file:", error);
    }
  }
};

