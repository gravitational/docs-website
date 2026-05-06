import type { IconName } from "@site/src/components/Icon/types";
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { useFAQTemplate } from "./FAQSectionsContext";

interface FAQSectionProps {
  icon: IconName;
  children: ReactNode;
}

// Extracts text content from React nodes. Ignores any HTML tags or components
const extractText = (node: ReactNode): string => {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (isValidElement<{ children?: ReactNode }>(node))
    return extractText(node.props.children);
  return "";
};

const FAQSection: React.FC<FAQSectionProps> = ({ icon, children }) => {
  const { registerSection } = useFAQTemplate();

  // Register the sections for the FAQ sidebar navigation
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const el = child as ReactElement<{ id?: string; children?: ReactNode }>;
    if (el.props.id) {
      registerSection({
        icon,
        title: extractText(el.props.children),
        id: el.props.id,
      });
    }
  });

  return <>{children}</>;
};

export default FAQSection;
