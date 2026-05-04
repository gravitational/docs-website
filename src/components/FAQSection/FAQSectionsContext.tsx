import { createContext, useContext } from "react";
import type { IconName } from "@site/src/components/Icon/types";

export interface FAQSection {
  icon: IconName;
  title: string;
  id: string;
}

interface FAQTemplateContextValue {
  registerSection: (section: FAQSection) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  hiddenSectionIds: Set<string>;
  setHiddenSectionIds: (ids: Set<string>) => void;
  matchCount: number;
  setMatchCount: (n: number) => void;
}

const FAQPageContext = createContext<FAQTemplateContextValue>({
  registerSection: () => {},
  searchQuery: "",
  setSearchQuery: () => {},
  hiddenSectionIds: new Set(),
  setHiddenSectionIds: () => {},
  matchCount: 0,
  setMatchCount: () => {},
});

export const useFAQTemplate = (): FAQTemplateContextValue => {
  return useContext(FAQPageContext);
};

export default FAQPageContext;
