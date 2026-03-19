import { Root, Element, Text } from "hast";
import { Plugin } from "unified";
import { visitParents } from "unist-util-visit-parents";

/*
 * Process custom components for cleaner markdown output.
 * Admonition: wrap the block in horizontal rule separators and turn the title into uppercase text
 * Tabs: place tab content directly after the label
 * Var: prevent duplicate text by keeping only the placeholder text
 * Code blocks: extract text content and replace with clean <pre><code> structure
 * Card links: prevent duplicate links in the markdown output
 */
const rehypeProcessCustomComponentsForMarkdown: Plugin<[], Root, Root> =
  function () {
    return (tree: Root) => {
      // --- Var component: replace with just the placeholder text ---
      {
        const varNodes: Array<{ node: Element; parent: Element | Root }> = [];
        visitParents(tree, "element", (node, ancestors) => {
          const element = node as Element;
          const classes = element.properties?.className;
          const classArray = Array.isArray(classes) ? classes : [];
          if (!classArray.some((c) => String(c) === "wrapper-input")) return;
          const parent = ancestors[ancestors.length - 1] as Element | Root;
          varNodes.push({ node: element, parent });
        });

        for (const { node, parent } of varNodes) {
          let placeholder = "";
          for (const child of node.children) {
            if (child.type === "element") {
              const childEl = child as Element;
              if (
                childEl.tagName === "input" &&
                childEl.properties?.placeholder
              ) {
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
      }

      // --- Admonition: add <hr> separators and capitalize the type title ---
      {
        const admonitionNodes: Array<{
          node: Element;
          parent: Element | Root;
        }> = [];
        visitParents(tree, "element", (node, ancestors) => {
          const element = node as Element;
          const classes = element.properties?.className;
          const classArray = Array.isArray(classes) ? classes : [];
          if (!classArray.some((c) => String(c) === "theme-admonition")) return;
          const parent = ancestors[ancestors.length - 1] as Element | Root;
          admonitionNodes.push({ node: element, parent });
        });

        for (const { node, parent } of admonitionNodes) {
          // Capitalize the text node inside the admonitionHeading element
          for (const child of node.children) {
            if (child.type !== "element") continue;
            const childEl = child as Element;
            const childClasses = childEl.properties?.className;
            const childClassArray = Array.isArray(childClasses)
              ? childClasses
              : [];
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
      }

      // --- Tabs: restructure so each tab title is directly followed by the content ---
      {
        const tabNodes: Element[] = [];
        visitParents(tree, "element", (node) => {
          const element = node as Element;
          const classes = element.properties?.className;
          const classArray = Array.isArray(classes) ? classes : [];
          if (!classArray.some((c) => String(c) === "theme-tabs-container"))
            return;
          tabNodes.push(element);
        });

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
      }

      // --- Code blocks: make sure the code blocks show up as expected ---
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

        type CodeBlockEntry = {
          outerWrapper: Element;
          outerParent: Element | Root;
          pre: Element;
        };
        const codeBlocks: CodeBlockEntry[] = [];

        visitParents(tree, "element", (node, ancestors) => {
          const element = node as Element;
          if (element.tagName !== "pre") return;
          const classes = element.properties?.className;
          const classArray = Array.isArray(classes) ? classes : [];
          // Identify the code blocks by looking for the code_* css module class
          if (!classArray.some((c) => String(c).startsWith("code_"))) return;
          // outerParent > outerWrapper > innerDiv > pre
          if (ancestors.length < 3) return;
          const outerWrapper = ancestors[ancestors.length - 2] as Element;
          const outerParent = ancestors[ancestors.length - 3] as Element | Root;
          codeBlocks.push({ outerWrapper, outerParent, pre: element });
        });

        for (const { outerWrapper, outerParent, pre } of codeBlocks) {
          // Locate the scroll_* div inside the pre
          let scrollDiv: Element | null = null;
          for (const child of pre.children) {
            if (child.type !== "element") continue;
            const el = child as Element;
            const classes = el.properties?.className;
            const classArray = Array.isArray(classes) ? classes : [];
            if (classArray.some((c) => String(c).startsWith("scroll_"))) {
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
            const classes = el.properties?.className;
            const classArray = Array.isArray(classes) ? classes : [];

            if (classArray.some((c) => String(c).startsWith("command_"))) {
              for (const cmdChild of el.children) {
                if (cmdChild.type !== "element") continue;
                const cmdEl = cmdChild as Element;
                const cmdClasses = cmdEl.properties?.className;
                const cmdClassArray = Array.isArray(cmdClasses)
                  ? cmdClasses
                  : [];
                if (!cmdClassArray.some((c) => String(c).startsWith("line_")))
                  continue;
                const prefix =
                  cmdEl.properties?.dataContent != null
                    ? String(cmdEl.properties.dataContent)
                    : "";
                lines.push(prefix + extractInnerText(cmdEl));
              }
            } else if (
              classArray.some(
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

      // --- card links: only headings keep the link ---
      // prevents the same link from being repeated multiple times in custom card components with an <a> wrapper.
      {
        type AnchorEntry = {
          node: Element;
          parent: Element | Root;
        };

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

        // Look for <a> tags that wrap around content
        const anchorEntries = new Map<Element, AnchorEntry>();

        visitParents(tree, "element", (node, ancestors) => {
          const element = node as Element;
          if (!/^(h[1-6])$/.test(element.tagName)) return;

          for (let i = ancestors.length - 1; i >= 0; i--) {
            const ancestor = ancestors[i];
            if (ancestor.type !== "element") continue;
            const ancestorEl = ancestor as Element;
            if (ancestorEl.tagName !== "a") continue;
            if (!anchorEntries.has(ancestorEl)) {
              const parent = ancestors[i - 1] as Element | Root;
              anchorEntries.set(ancestorEl, { node: ancestorEl, parent });
            }
            break;
          }
        });

        for (const { node, parent } of anchorEntries.values()) {
          const href = node.properties?.href;
          const newNodes = collectNodes(node, href);
          const idx = parent.children.indexOf(node);
          if (idx >= 0) {
            parent.children.splice(idx, 1, ...newNodes);
          }
        }
      }
    };
  };

export default rehypeProcessCustomComponentsForMarkdown;
