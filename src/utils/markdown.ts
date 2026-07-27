export const normalizeMarkdownPathname = (pathname: string) => {
  // root path should return "index"
  if (pathname === "" || pathname === "/") return "/index.md";
  // Remove any trailing slash for consistency
  if (pathname.endsWith("/") && pathname.length > 1)
    return `${pathname.slice(0, -1)}.md`;
  return `${pathname}.md`;
};

export const markdownAlternatePath = (
  pathname: string,
  baseUrl: string = "/",
) => {
  const root = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  // The site root under a baseUrl prefix (e.g. /docs/) maps to index.md
  // rather than replacing the trailing slash (which would yield /docs.md).
  if (pathname === root || pathname === root.slice(0, -1)) {
    return `${root}index.md`;
  }
  return normalizeMarkdownPathname(pathname);
};

export const copyPageContentAsMarkdown = async (pathname: string) => {
  const normalizedPathname = normalizeMarkdownPathname(pathname);

  try {
    const response = await fetch(normalizedPathname);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch markdown content: ${response.statusText}`,
      );
    }
    const markdownContent = await response.text();
    await navigator.clipboard.writeText(markdownContent);
  } catch (error) {
    console.error("Error copying markdown content:", error);
  }
};
