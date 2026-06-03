// FAQContentFilter is responsible for handling the filtering and highlighting
// of FAQ content based on the user's search query. It operates directly on
// the rendered DOM elements of the FAQ content, which are authored in the source
// MDX files, compiled by Docusaurus and passed to the component as `children`.

// To avoid the need to re-author the content as structured data or dedicated components,
// FAQContentFilter uses imperative DOM manipulation to show/hide elements instead of the
// React declarative rendering approach. It is a pragmatic choice to achieve the expected
// filtering and highlighting behavior without adding excessive constraints on how the FAQ content
// should be authored.

import { type ReactNode, useEffect, useRef } from "react";
import { useFAQTemplate } from "./FAQPageContext";
import styles from "./FAQContentFilter.module.css";

// Collect the content of a Q&A group, defined as a heading (h3 or h4) and all content until the next heading of the same or higher level.
const collectQAGroup = (
  heading: HTMLHeadingElement,
  groupEndingTags: string[] = [], // Optional additional tags that should close a group
): HTMLElement[] => {
  const group: HTMLElement[] = [heading];
  let next = heading.nextElementSibling as HTMLElement | null;
  while (next) {
    const tag = next.tagName;
    if (tag === "H2" || tag === "H3" || groupEndingTags.includes(tag)) break;
    // <FAQSection> wrappers should also break the group to avoid crossing into other sections
    if (tag === "DIV" && next.querySelector(":scope > h2")) break;
    group.push(next);
    next = next.nextElementSibling as HTMLElement | null;
  }
  return group;
};

// Get the sub-headings of a heading until the next heading of the same or higher level.
// E.g. for an h3 heading, we get the following h4 headings until the next h3 or h2.
const getSubHeadings = (
  parent: HTMLHeadingElement,
  target: "H3" | "H4",
): HTMLHeadingElement[] => {
  const subHeadings: HTMLHeadingElement[] = [];
  let next = parent.nextElementSibling as HTMLElement | null;
  while (next) {
    const tag = next.tagName;
    if (tag === parent.tagName) break;
    // <FAQSection> wrappers should also break the group to avoid crossing into other sections
    if (tag === "DIV" && next.querySelector(":scope > h2")) break;
    if (tag === target) subHeadings.push(next as HTMLHeadingElement);
    next = next.nextElementSibling as HTMLElement | null;
  }
  return subHeadings;
};

// Count the non-overlapping matches for a query
const countMatches = (text: string, query: string): number => {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let count = 0;
  let idx = t.indexOf(q);
  while (idx !== -1) {
    count++;
    idx = t.indexOf(q, idx + q.length);
  }
  return count;
};

// Clear any existing highlights so that new search results can be applied
const resetHighlights = (container: HTMLElement) => {
  container
    .querySelectorAll<HTMLElement>("mark[data-faq-highlight]")
    .forEach((mark) => {
      const parent = mark.parentNode;
      if (!parent) return;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      parent.normalize();
    });
};

// Apply highlighting styles to the parts of the content that match the search query
const applyHighlights = (node: HTMLElement, query: string) => {
  const lowerCaseQuery = query.toLowerCase();
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) {
    textNodes.push(n as Text);
  }

  textNodes.forEach((textNode) => {
    const text = textNode.textContent ?? "";
    if (!text.toLowerCase().includes(lowerCaseQuery)) return;

    //  Create a document fragment with the same text but with the matching parts wrapped in <mark> elements, and replace the original text node with it. This way we can apply the highlighting styles via CSS.
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    const lowerText = text.toLowerCase();
    let idx = lowerText.indexOf(lowerCaseQuery, lastIndex);

    while (idx !== -1) {
      if (idx > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.slice(lastIndex, idx)),
        );
      }
      const mark = document.createElement("mark");
      mark.dataset.faqHighlight = "";
      mark.className = styles.highlight;
      // Using query.length is safe here as case-insensitive matching preserves length
      mark.textContent = text.slice(idx, idx + query.length);
      fragment.appendChild(mark);
      lastIndex = idx + query.length;
      idx = lowerText.indexOf(lowerCaseQuery, lastIndex);
    }
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
    textNode.parentNode?.replaceChild(fragment, textNode);
  });
};

interface FAQContentFilterProps {
  children: ReactNode;
}

// FAQContentFilter is responsible for filtering and highlighting the FAQ content based on the search query. It uses the following logic:
// A Q&A group is defined as a heading (h3 or h4) and all content until the next heading of the same or higher level.
// Q&A groups are the units that get filtered and highlighted based on the search query. The logic is as follows:
// 1. For each h3 Q&A group:
//    - If it has no h4 sub-groups, treat the entire h3 group as one unit and show/hide based on whether it contains matches with the search query.
//    - If it has h4 sub-groups, filter each h4 group independently based on the search query. The h3 heading and its intro are shown if at least one h4 group matches.
// 2. After processing all h3 groups, hide any h2 category headings whose h3 groups are all hidden.

const FAQContentFilter: React.FC<FAQContentFilterProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { searchQuery, setMatchCount } = useFAQTemplate();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Undo any possible previous DOM changes made by this filter
    resetHighlights(container);
    container.querySelectorAll<HTMLHeadingElement>("h2").forEach((h2) => {
      h2.style.display = "";
    });
    container.querySelectorAll<HTMLHeadingElement>("h3").forEach((h3) => {
      collectQAGroup(h3).forEach((el) => {
        el.style.display = "";
      });
    });
    container.querySelectorAll<HTMLHeadingElement>("h4").forEach((h4) => {
      collectQAGroup(h4).forEach((el) => {
        el.style.display = "";
      });
    });

    // If the search query is empty, we can skip the rest of the function
    if (searchQuery.length === 0) {
      setMatchCount(0);
      return;
    }

    const lowerSearchQuery = searchQuery.toLowerCase();

    const h3Headings = Array.from(
      container.querySelectorAll<HTMLHeadingElement>("h3"),
    );

    let count = 0;
    h3Headings.forEach((h3) => {
      const h4s = getSubHeadings(h3, "H4");

      // No h4 sub-groups: the entire h3 group is a Q&A unit
      if (h4s.length === 0) {
        const group = collectQAGroup(h3);
        const groupText = group
          .map((el) => el.textContent ?? "")
          .join(" ")
          .toLowerCase();
        const matches = groupText.includes(lowerSearchQuery);

        // Add the number of matches in this group to the total count
        if (matches) count += countMatches(groupText, lowerSearchQuery);

        // Show/hide the entire group based on whether it matches the search query
        group.forEach((el) => {
          el.style.display = matches ? "" : "none";
        });

        // Highlight matches if this group is shown
        if (matches) {
          group.forEach((el) => applyHighlights(el, searchQuery));
        }
      }
      // h4 sub-groups are found: filter each sub-group independently
      else {
        let h4Matches = false;

        h4s.forEach((h4) => {
          const group = collectQAGroup(h4, ["H4"]);
          const groupText = group
            .map((el) => el.textContent ?? "")
            .join(" ")
            .toLowerCase();
          const matches = groupText.includes(lowerSearchQuery);

          if (matches) {
            count += countMatches(groupText, lowerSearchQuery);
            h4Matches = true;
          }

          group.forEach((el) => {
            el.style.display = matches ? "" : "none";
          });

          if (matches) {
            group.forEach((el) => applyHighlights(el, searchQuery));
          }
        });

        // Show the h3 heading and its intro (content before the first h4) only
        // if at least one h4 group matched.
        const introGroup = collectQAGroup(h3, ["H4"]);
        introGroup.forEach((el) => {
          el.style.display = h4Matches ? "" : "none";
        });
        if (h4Matches) {
          // Check for an intro text match (there is text after the h3 heading and before the first h4).
          const intro = introGroup
            .map((el) => el.textContent ?? "")
            .join(" ")
            .toLowerCase();
          count += countMatches(intro, lowerSearchQuery);
          introGroup.forEach((el) => applyHighlights(el, searchQuery));
        }
      }
    });
    setMatchCount(count);

    // Hide h2 headings which do not have any visible Q&A groups
    container.querySelectorAll<HTMLHeadingElement>("h2").forEach((h2) => {
      const h3s = getSubHeadings(h2, "H3");
      const allHidden =
        h3s.length > 0 && h3s.every((h3) => h3.style.display === "none");
      h2.style.display = allHidden ? "none" : "";
    });
  }, [searchQuery, setMatchCount]);

  return <div ref={containerRef}>{children}</div>;
};

export default FAQContentFilter;
