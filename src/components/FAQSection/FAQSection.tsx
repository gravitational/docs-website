import type { IconName } from "@site/src/components/Icon/types";
import {
  Children,
  isValidElement,
  JSXElementConstructor,
  type ReactElement,
  type ReactNode,
} from "react";
import { useFAQTemplate } from "./FAQPageContext";

interface FAQSectionProps {
  icon: IconName;
  children: ReactNode;
}

const extractText = (node: ReactNode): string => {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (isValidElement<{ children?: ReactNode }>(node))
    return extractText(node.props.children);
  return "";
};

const FAQSection: React.FC<FAQSectionProps> = ({ icon, children }) => {
  const { registerSection } = useFAQTemplate();

  // Ensure the child is a single h2 element
  const h2 = Children.only(children);
  if (
    !isValidElement(h2) ||
    (h2.type as JSXElementConstructor<any>)?.name !== "h2"
  ) {
    throw new Error("FAQSection child must be a single h2 element");
  }

  // Register valid FAQ section with its title and id for the FAQ sidebar navigation
  const el = h2 as ReactElement<{ id?: string; children?: ReactNode }>;
  if (el.props.id) {
    registerSection({
      icon,
      title: extractText(el.props.children),
      id: el.props.id,
    });
  }

  return <>{children}</>;
};

export default FAQSection;
