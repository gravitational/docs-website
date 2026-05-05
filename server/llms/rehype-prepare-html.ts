import { Root, Element, Text, Comment } from "hast";
import { Plugin } from "unified";
import { visitParents, SKIP } from "unist-util-visit-parents";

/*
 * Process html components for cleaner markdown ouput.
 *
 * Admonition: wrap the block in horizontal rule separators and turn the title into uppercase text
 * Tabs: place tab content directly after the label
 * Var: prevent duplicate text by keeping only the placeholder text
 * Code blocks: extract text content and replace with clean <pre><code> structure
 * Card links: prevent duplicate links in the markdown output
 * Heading anchor links: remove hash-link anchors from headings
 * Irrelevant components: remove interactive UI components (thumbsFeedback, checkpoint, docsHeader)
 * H1 repositioning: move the h1 heading to the top of the document
 */

type CodeBlockEntry = {
  outerWrapper: Element;
  outerParent: Element | Root;
  pre: Element;
};

type AnchorEntry = {
  node: Element;
  parent: Element | Root;
};

const rehypePrepareHTML: Plugin<[], Root, Root> = function () {
  return (tree: Root) => {
    const irrelevantClassPrefixes = [
      "thumbsFeedback",
      "checkpoint",
      "docsHeader",
    ]; // Add any other class prefixes in order to remove irrelevant components, if needed

    // --- Track nodes for post-processing ---
    const toRemove: Array<{
      node: Element | Comment;
      parent: Element | Root;
    }> = [];

    let h1: Element | null = null;
    let headerElement: Element | null = null;
    let headerParent: Element | Root | null = null;

    const varNodes: Array<{ node: Element; parent: Element | Root }> = [];
    const admonitionNodes: Array<{
      node: Element;
      parent: Element | Root;
    }> = [];
    const tabNodes: Element[] = [];

    const codeBlocks: CodeBlockEntry[] = [];

    const anchorEntries = new Map<Element, AnchorEntry>(); // track <a> tags that wrap around content (card links)

    // ----------- Collect nodes to modify or remove -----------

    visitParents(tree, (node, ancestors) => {
      // *** Empty comments ***
      if (node.type === "comment") {
        if ((node as Comment).value.trim() === "") {
          const parent = ancestors[ancestors.length - 1] as Element | Root;
          toRemove.push({ node: node as Comment, parent });
        }
        return;
      }

      if (node.type !== "element") return;

      const element = node as Element;
      const parent = ancestors[ancestors.length - 1] as Element | Root;
      const classes = element.properties?.className;
      const classArray = Array.isArray(classes) ? classes : [];

      // *** Irrelevant components ***
      if (
        classArray.some((c) =>
          irrelevantClassPrefixes.some((prefix) =>
            String(c).startsWith(prefix),
          ),
        )
      ) {
        toRemove.push({ node: element, parent });
        return SKIP; // don't traverse children (e.g. avoids capturing an h1 inside a removed node)
      }

      // *** Headings ***
      if (/^h[1-6]$/.test(element.tagName)) {
        // Remove hash-link anchor children in-place
        element.children = element.children.filter((child) => {
          if (child.type !== "element") return true;
          const childEl = child as Element;
          if (childEl.tagName !== "a") return true;
          const childClasses = childEl.properties?.className;
          const childClassArray = Array.isArray(childClasses)
            ? childClasses
            : [];
          return !childClassArray.includes("hash-link");
        });

        // H1 tracking / duplicate removal
        if (element.tagName === "h1") {
          if (!h1) {
            h1 = element;
            // Find the nearest <header> ancestor
            for (let i = ancestors.length - 1; i >= 0; i--) {
              const ancestor = ancestors[i];
              if (
                ancestor.type === "element" &&
                (ancestor as Element).tagName === "header"
              ) {
                headerElement = ancestor as Element;
                headerParent = ancestors[i - 1] as Element | Root;
                break;
              }
            }
            if (!headerElement) {
              headerParent = parent;
            }
          } else {
            toRemove.push({ node: element, parent });
          }
        }

        // Card link detection: find nearest <a> ancestor
        for (let i = ancestors.length - 1; i >= 0; i--) {
          const ancestor = ancestors[i];
          if (ancestor.type !== "element") continue;
          const ancestorEl = ancestor as Element;
          if (ancestorEl.tagName !== "a") continue;
          if (!anchorEntries.has(ancestorEl)) {
            const anchorParent = ancestors[i - 1] as Element | Root;
            anchorEntries.set(ancestorEl, {
              node: ancestorEl,
              parent: anchorParent,
            });
          }
          break;
        }

        return;
      }

      // *** Var component ***
      if (classArray.some((c) => String(c) === "wrapper-input")) {
        varNodes.push({ node: element, parent });
        return;
      }

      // *** Admonition ***
      if (classArray.some((c) => String(c) === "theme-admonition")) {
        admonitionNodes.push({ node: element, parent });
        return;
      }

      // *** Tabs ***
      if (classArray.some((c) => String(c) === "theme-tabs-container")) {
        tabNodes.push(element);
        return;
      }

      // *** Code blocks ***
      // Identify the code blocks by looking for the code_* css module class
      // outerParent > outerWrapper > innerDiv > pre
      if (
        element.tagName === "pre" &&
        classArray.some((c) => String(c).startsWith("code_")) &&
        ancestors.length >= 3
      ) {
        const outerWrapper = ancestors[ancestors.length - 2] as Element;
        const outerParent = ancestors[ancestors.length - 3] as Element | Root;
        codeBlocks.push({ outerWrapper, outerParent, pre: element });
        return;
      }
    });

    // ----------- Post-processing: removals & modifications -----------

    // Apply removals: irrelevant components, empty comments, duplicate h1s
    for (const { node, parent } of toRemove) {
      parent.children = parent.children.filter((child) => child !== node);
    }

    // *** Var component: replace with just the placeholder text ***
    for (const { node, parent } of varNodes) {
      let placeholder = "";
      for (const child of node.children) {
        if (child.type === "element") {
          const childEl = child as Element;
          if (childEl.tagName === "input" && childEl.properties?.placeholder) {
            placeholder = String(childEl.properties.placeholder);
            break;
          }
        }
      }
      const idx = parent.children.indexOf(node);
      if (idx >= 0) {
        const textNode: Text = { type: "text", value: placeholder };
        parent.children.splice(idx, 1, textNode);
      }
    }

    // *** Admonition: add <hr> separators and capitalize the type title ***
    for (const { node, parent } of admonitionNodes) {
      for (const child of node.children) {
        if (child.type !== "element") continue;
        const childEl = child as Element;
        const childClasses = childEl.properties?.className;
        const childClassArray = Array.isArray(childClasses) ? childClasses : [];
        if (
          !childClassArray.some((c) =>
            String(c).startsWith("admonitionHeading"),
          )
        )
          continue;
        for (const headingChild of childEl.children) {
          if (headingChild.type === "text") {
            const textNode = headingChild as Text;
            const trimmed = textNode.value.trim();
            if (trimmed) {
              textNode.value = trimmed.toUpperCase();
            }
          }
        }
        break;
      }

      const hr = (): Element => ({
        type: "element",
        tagName: "hr",
        properties: {},
        children: [],
      });
      const idx = parent.children.indexOf(node);
      if (idx >= 0) {
        parent.children.splice(idx, 0, hr()); // insert before
        parent.children.splice(idx + 2, 0, hr()); // insert after
      }
    }

    // *** Tabs: restructure so each tab title is directly followed by the content ***
    for (const element of tabNodes) {
      const tabItems: Element[] = [];
      const tabPanels: Element[] = [];

      for (const child of element.children) {
        if (child.type !== "element") continue;
        const childEl = child as Element;
        if (
          childEl.tagName === "ul" &&
          childEl.properties?.role === "tablist"
        ) {
          for (const li of childEl.children) {
            if (li.type === "element" && (li as Element).tagName === "li") {
              tabItems.push(li as Element);
            }
          }
        } else {
          for (const panelChild of childEl.children) {
            if (panelChild.type !== "element") continue;
            const panelEl = panelChild as Element;
            if (panelEl.properties?.role === "tabpanel") {
              tabPanels.push(panelEl);
            }
          }
        }
      }

      const newChildren: Element[] = [];
      for (let i = 0; i < tabItems.length; i++) {
        const label: Element = {
          type: "element",
          tagName: "strong",
          properties: {},
          children: tabItems[i].children,
        };
        newChildren.push(label);
        if (tabPanels[i]) {
          newChildren.push(tabPanels[i]);
        }
      }

      element.children = newChildren;
    }

    // *** Code blocks: make sure the code blocks show up as expected ***
    {
      function extractInnerText(node: Element): string {
        let text = "";
        for (const child of node.children) {
          if (child.type === "text") {
            text += (child as Text).value;
          } else if (child.type === "element") {
            text += extractInnerText(child as Element);
          }
        }
        return text;
      }

      for (const { outerWrapper, outerParent, pre } of codeBlocks) {
        // Locate the scroll_* div inside the pre
        let scrollDiv: Element | null = null;
        for (const child of pre.children) {
          if (child.type !== "element") continue;
          const el = child as Element;
          const elClasses = el.properties?.className;
          const elClassArray = Array.isArray(elClasses) ? elClasses : [];
          if (elClassArray.some((c) => String(c).startsWith("scroll_"))) {
            scrollDiv = el;
            break;
          }
        }
        if (!scrollDiv) continue;

        // Extract each line of the code block
        const lines: string[] = [];
        for (const child of scrollDiv.children) {
          if (child.type !== "element") continue;
          const el = child as Element;
          const elClasses = el.properties?.className;
          const elClassArray = Array.isArray(elClasses) ? elClasses : [];

          if (elClassArray.some((c) => String(c).startsWith("command_"))) {
            for (const cmdChild of el.children) {
              if (cmdChild.type !== "element") continue;
              const cmdEl = cmdChild as Element;
              const cmdClasses = cmdEl.properties?.className;
              const cmdClassArray = Array.isArray(cmdClasses) ? cmdClasses : [];
              if (!cmdClassArray.some((c) => String(c).startsWith("line_")))
                continue;
              const prefix =
                cmdEl.properties?.dataContent != null
                  ? String(cmdEl.properties.dataContent)
                  : "";
              lines.push(prefix + extractInnerText(cmdEl));
            }
          } else if (
            elClassArray.some(
              (c) =>
                String(c).startsWith("line_") ||
                String(c).startsWith("comment_"),
            )
          ) {
            lines.push(extractInnerText(el));
          }
        }

        const cleanPre: Element = {
          type: "element",
          tagName: "pre",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "code",
              properties: {},
              children: [{ type: "text", value: lines.join("\n") }],
            },
          ],
        };

        const idx = outerParent.children.indexOf(outerWrapper);
        if (idx >= 0) {
          outerParent.children.splice(idx, 1, cleanPre);
        }
      }
    }

    // *** Card links: only headings keep the link ***
    // Prevents the same link from being repeated multiple times in custom card components with an <a> wrapper.
    {
      function collectNodes(
        node: Element,
        href: Element["properties"][string],
      ): Element[] {
        const results: Element[] = [];
        for (const child of node.children) {
          if (child.type !== "element") continue;
          const childEl = child as Element;
          if (/^h[1-6]$/.test(childEl.tagName)) {
            results.push({
              type: "element",
              tagName: "a",
              properties: { href },
              children: [childEl],
            });
          } else if (/^(p)$/.test(childEl.tagName)) {
            results.push(childEl);
          } else if (/^(img|svg)$/.test(childEl.tagName)) {
            continue;
          } else {
            const nested = collectNodes(childEl, href);
            if (nested.length > 0) {
              results.push(...nested);
            } else {
              // Keep other elements as is
              results.push(childEl);
            }
          }
        }
        return results;
      }

      for (const { node, parent } of anchorEntries.values()) {
        const href = node.properties?.href;
        const newNodes = collectNodes(node, href);
        const idx = parent.children.indexOf(node);
        if (idx >= 0) {
          parent.children.splice(idx, 1, ...newNodes);
        }
      }
    }

    // *** H1 repositioning: move the h1 to the top of the document ***
    if (h1 && headerParent) {
      const nodeToRemove = headerElement ?? h1;
      const parent = headerParent as Element;
      parent.children = parent.children.filter(
        (child) => child !== nodeToRemove,
      );
      parent.children.unshift(h1);
    }
  };
};

export default rehypePrepareHTML;
