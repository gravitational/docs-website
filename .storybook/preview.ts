import { Preview } from "@storybook/react-webpack5";

// See the following documentation for how this configuration loads CSS styles
// for Storybook stories:
// https://storybook.js.org/docs/configure/styling-and-css#import-bundled-css-recommended
import "../src/styles/variables.css";
import "../src/styles/fonts-ubuntu.css";
import "../src/styles/global.css";
import "../src/styles/media.css";
import "../src/styles/fonts-lato.css";

const preview: Preview = {
  parameters: {},
};

export default preview;
