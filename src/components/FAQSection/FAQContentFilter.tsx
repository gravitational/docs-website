import { type ReactNode, useEffect, useRef } from "react";
import { useFAQTemplate } from "./FAQSectionsContext";
import styles from "./FAQContentFilter.module.css";

/**
 * Collects an h3 Q&A group: the heading itself plus all following siblings
 * until the next h3, h2, or a FAQSection wrapper div containing an h2.
 */
function getQAGroup(heading: HTMLHeadingElement): HTMLElement[] {
  const group: HTMLElement[] = [heading];
  let next = heading.nextElementSibling as HTMLElement | null;
  while (next) {
    const tag = next.tagName;
    if (tag === "H2" || tag === "H3") break;
    // Guard against FAQSection wrappers that may contain an h2
    if (tag === "DIV" && next.querySelector(":scope > h2")) break;
    group.push(next);
    next = next.nextElementSibling as HTMLElement | null;
  }
  return group;
}

/**
 * Collects all h3 headings that belong to an h2 category section,
 * i.e. all h3 siblings following the h2 until the next h2.
 */
function getH3sUnderH2(h2: HTMLHeadingElement): HTMLHeadingElement[] {
  const h3s: HTMLHeadingElement[] = [];
  let next = h2.nextElementSibling as HTMLElement | null;
  while (next) {
    const tag = next.tagName;
    if (tag === "H2") break;
    if (tag === "DIV" && next.querySelector(":scope > h2")) break;
    if (tag === "H3") h3s.push(next as HTMLHeadingElement);
    next = next.nextElementSibling as HTMLElement | null;
  }
  return h3s;
}

/** Remove all <mark> elements previously inserted by applyHighlights. */
function clearHighlights(container: HTMLElement) {
  container
    .querySelectorAll<HTMLElement>("mark[data-faq-highlight]")
    .forEach((mark) => {
      const parent = mark.parentNode;
      if (!parent) return;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      parent.normalize();
    });
}

/** Wrap occurrences of query inside node's text nodes with <mark> elements. */
function applyHighlights(
  node: HTMLElement,
  query: string,
  highlightClass: string,
) {
  const q = query.toLowerCase();
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) {
    textNodes.push(n as Text);
  }

  textNodes.forEach((textNode) => {
    const text = textNode.textContent ?? "";
    if (!text.toLowerCase().includes(q)) return;

    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let idx = text.toLowerCase().indexOf(q, lastIndex);

    while (idx !== -1) {
      if (idx > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, idx)));
      }
      const mark = document.createElement("mark");
      mark.dataset.faqHighlight = "";
      mark.className = highlightClass;
      mark.textContent = text.slice(idx, idx + query.length);
      frag.appendChild(mark);
      lastIndex = idx + query.length;
      idx = text.toLowerCase().indexOf(q, lastIndex);
    }
    if (lastIndex < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
    textNode.parentNode?.replaceChild(frag, textNode);
  });
}

interface FAQContentFilterProps {
  children: ReactNode;
}

const FAQContentFilter: React.FC<FAQContentFilterProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { searchQuery, setHiddenSectionIds, setMatchCount } = useFAQTemplate();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Step 1: Undo all previous DOM changes
    clearHighlights(container);
    container.querySelectorAll<HTMLHeadingElement>("h2").forEach((h2) => {
      h2.style.display = "";
    });
    container.querySelectorAll<HTMLHeadingElement>("h3").forEach((heading) => {
      getQAGroup(heading).forEach((el) => {
        el.style.display = "";
      });
    });

    if (!searchQuery) {
      setHiddenSectionIds(new Set());
      setMatchCount(0);
      return;
    }

    // Step 2: Filter + highlight h3 Q&A groups
    const headings = Array.from(
      container.querySelectorAll<HTMLHeadingElement>("h3"),
    );

    let count = 0;
    headings.forEach((heading) => {
      const group = getQAGroup(heading);
      const groupText = group
        .map((el) => el.textContent ?? "")
        .join(" ")
        .toLowerCase();
      const matches = groupText.includes(searchQuery.toLowerCase());

      if (matches) count++;

      group.forEach((el) => {
        el.style.display = matches ? "" : "none";
      });

      if (matches) {
        group.forEach((el) =>
          applyHighlights(el, searchQuery, styles.highlight),
        );
      }
    });
    setMatchCount(count);

    // Step 3: Hide h2 category headings whose h3 groups are all hidden
    const hiddenIds = new Set<string>();
    container.querySelectorAll<HTMLHeadingElement>("h2").forEach((h2) => {
      const h3s = getH3sUnderH2(h2);
      const allHidden =
        h3s.length > 0 && h3s.every((h3) => h3.style.display === "none");
      h2.style.display = allHidden ? "none" : "";
      if (allHidden && h2.id) {
        hiddenIds.add(h2.id);
      }
    });
    setHiddenSectionIds(hiddenIds);
  }, [searchQuery, setHiddenSectionIds, setMatchCount]);

  return <div ref={containerRef}>{children}</div>;
};

export default FAQContentFilter;
