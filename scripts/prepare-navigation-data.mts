import "dotenv/config";

import { resolve, join } from "path";
import { generateData } from "../server/strapi";

const DATA_FOLDER = resolve(__dirname, "../data");

generateData({
  navPath: join(DATA_FOLDER, "navbar.json"),
  eventPath: join(DATA_FOLDER, "events.json"),
});
