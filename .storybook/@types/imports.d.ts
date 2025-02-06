// Declare modules so Storybook can import assets as expected. Docusaurus
// handles this on its own, so we need to redeclare these modules here for
// Storybook.

declare module "*.css";

declare module "*.svg";

declare module "*.svg?react" {
  const Component: React.StatelessComponent<React.SVGAttributes<SVGElement>>;

  export default Component;
}

declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.webp" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "*.woff2" {
  const value: string;
  export default value;
}
