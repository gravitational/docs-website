export type Frontmatter = {
  [key: string]: unknown;
};

export const validateFrontmatter = (
  frontmatter: Frontmatter,
  allowedFields: Array<string>,
) => {};
