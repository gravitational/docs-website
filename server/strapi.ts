const fetchUrl = "https://goteleport.com/api/data/navigation";
export const fetchData = async () => {
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
      throw new Error("No result returned from query!");
    }
    return result;
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        console.error(`Request was aborted after 10 seconds`);
      } else {
        throw err;
      }
    } else {
      console.error("Unexpected error:", err);
    }
    return [];
  }
};
