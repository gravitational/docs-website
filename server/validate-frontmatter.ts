export type Frontmatter = {
  [key: string]: unknown;
};

export const validateFrontmatter = (
  path: string,
  frontmatter: Frontmatter,
  allowedFields: Array<string>,
) => {
  const allowed = new Set(allowedFields);
  const actual = new Set(Object.keys(frontmatter));
  const extraFields = [...actual.difference(allowed)];
  if (extraFields.length > 0) {
    throw new Error(
      `${path} has uncrecognized frontmatter fields: ${extraFields.join(", ")}`,
    );
  }
};
