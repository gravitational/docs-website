import { writeFileSync } from "fs";
import { fetchEventsFromSanity, getNavData } from "./sanity";

export type GenerateEventProps = {
  file: string; // path to file
};

export const generateEvent = async ({ file }: GenerateEventProps) => {
  let eventData = undefined;
  try {
    eventData = await fetchEventsFromSanity();
    if (!eventData) return;
  } catch (error) {
    console.error("No banner data returned");
    return;
  }
  if (eventData) {
    try {
      writeFileSync(file, JSON.stringify(eventData));
      console.log("");
      console.log("Writing event data to file...", "\n");
      console.log("FILE:", file, "\n");
    } catch (error) {
      console.error("Error writing event data to file:", error);
    }
  }
};
export const generateNavigation = async ({ file }: { file: string }) => {

};
