import { createContext, useContext } from "react";
import type { IconName } from "@site/src/components/Icon/types";

export interface FAQSection {
  icon: IconName;
  title: string;
  id: string;
}

interface FAQTemplateContextValue {
  registerSection: (section: FAQSection) => void;
}

const FAQPageContext = createContext<FAQTemplateContextValue>({
  registerSection: () => {},
});

export const useFAQTemplate = (): FAQTemplateContextValue => {
  return useContext(FAQPageContext);
};

export default FAQPageContext;
