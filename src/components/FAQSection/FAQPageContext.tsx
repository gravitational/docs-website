// FAQPageContext provides shared state across a FAQ template page. It allows:
// 1. Individual FAQ sections to be registered for the FAQ sidebar navigation (./FAQSidebar.tsx)
// 2. Coordinating the search experience (updating the search query, match count, and controlling the search input)

import { createContext, useContext } from "react";
import type { RefObject } from "react";
import type { IconName } from "@site/src/components/Icon/types";

// a FAQ section represents a specific FAQ topic (e.g. Zero Trust Access).
// These sections are used to build the FAQ sidebar navigation and to link the FAQ search results to the correct section.
export interface FAQSection {
  icon: IconName;
  title: string;
  id: string;
}

interface FAQTemplateContextValue {
  // Called by each section to add itself to the page's navigation/section list.
  registerSection: (section: FAQSection) => void;
  // The current search text entered by the user.
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  // Total number of FAQ entries matching the current search query.
  matchCount: number;
  setMatchCount: (n: number) => void;
  // Ref to the search input, allowing sections to focus it programmatically.
  searchInputRef: RefObject<HTMLInputElement | null>;
}

// Default context value used when a component is rendered outside of a provider.
// The no-op functions keep consumers safe even when no FAQ page wraps them.
// The FAQPageContext Provider is initialized in src/theme/DocItem/Layout/index.tsx to allow the consumers to access the context.
const FAQPageContext = createContext<FAQTemplateContextValue>({
  registerSection: () => {},
  searchQuery: "",
  setSearchQuery: () => {},
  matchCount: 0,
  setMatchCount: () => {},
  searchInputRef: { current: null } as RefObject<HTMLInputElement | null>,
});

// Convenience hook for consuming the FAQ page context.
export const useFAQTemplate = (): FAQTemplateContextValue => {
  return useContext(FAQPageContext);
};

export default FAQPageContext;
