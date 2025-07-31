import { writeFileSync } from "fs";
import { fetchData } from "./strapi";

export const generateData = async ({
  navPath,
  eventPath,
}: {
  navPath: string;
  eventPath: string;
}) => {
  let data = undefined;
  try {
    data = await fetchData();
    if (!data) return;
  } catch (error) {
    console.error("No data returned");
    return;
  }

  if (data) {
    try {
      writeFileSync(navPath, JSON.stringify(data.navbardata));
      console.log("Writing header data to file: ", navPath);
    } catch (error) {
      console.error("Error writing footer data to file:", error);
    }
    try {
      writeFileSync(eventPath, JSON.stringify(data.eventsdata));
      console.log("Writing event data to file: ", eventPath);
    } catch (error) {
      console.error("Error writing footer data to file:", error);
    }
  }
};
