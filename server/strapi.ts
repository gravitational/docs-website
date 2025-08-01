import { writeFileSync } from "fs";

const fetchUrl = "https://goteleport.com/api/data/navigation";
const fetchData = async () => {
  const abortController = new AbortController();
  try {
    // Timeout all strapi requests after 10 seconds
    setTimeout(() => abortController.abort(), 10000);
    const result = await fetch(fetchUrl, {
      headers: {
        "Content-Type": "application/json",
      },

      signal: abortController.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        return data;
      });

    if (!result) {
      throw new Error("No navigation data returned from query!");
    }
    return result;
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        console.error(`Navigation data request was aborted after 10 seconds`);
      } else {
        throw err;
      }
    } else {
      console.error("Unexpected error:", err);
    }
    return [];
  }
};

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
    if (!data?.navbardata || !data?.eventsdata) return;
  } catch (error) {
    console.error("No navigation data returned");
    return;
  }

  if (data) {
    try {
      writeFileSync(navPath, JSON.stringify(data.navbardata));
      console.log("Writing header navigation data to file: ", navPath);
    } catch (error) {
      console.error("Error writing header navigation data to file:", error);
    }
    try {
      writeFileSync(eventPath, JSON.stringify(data.eventsdata));
      console.log("Writing eventbanner data to file: ", eventPath);
    } catch (error) {
      console.error("Error writing eventbanner data to file:", error);
    }
  }
};
