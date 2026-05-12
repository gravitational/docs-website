import { createContext, useContext } from "react";
import type { RefObject } from "react";
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
  matchCount: number;
  setMatchCount: (n: number) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
}

const FAQPageContext = createContext<FAQTemplateContextValue>({
  registerSection: () => {},
  searchQuery: "",
  setSearchQuery: () => {},
  matchCount: 0,
  setMatchCount: () => {},
  searchInputRef: { current: null } as RefObject<HTMLInputElement | null>,
});

export const useFAQTemplate = (): FAQTemplateContextValue => {
  return useContext(FAQPageContext);
};

export default FAQPageContext;
