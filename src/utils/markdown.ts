export const normalizeMarkdownPathname = (pathname: string) => {
  // root path should return "index"
  if (pathname === "" || pathname === "/") return "/index.md";
  // Remove any trailing slash for consistency
  if (pathname.endsWith("/") && pathname.length > 1)
    return `${pathname.slice(0, -1)}.md`;
  return `${pathname}.md`;
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
