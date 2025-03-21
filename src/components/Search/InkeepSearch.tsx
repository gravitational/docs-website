import React, { useState, useRef, useCallback, useEffect } from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import BrowserOnly from "@docusaurus/BrowserOnly";
import type {
  InkeepAIChatSettings,
  InkeepSearchSettings,
  InkeepModalSearchAndChatProps,
  InkeepBaseSettings,
  AIChatFunctions,
  SearchFunctions,
} from "@inkeep/cxkit-react";

import styles from "./InkeepSearch.module.css";
import InkeepSearchIconSvg from "./inkeepIcon.svg";


export function InkeepSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [CustomTrigger, setCustomTrigger] = useState(null);

  useEffect(() => {
    (async () => {
      const { InkeepModalSearchAndChat } = await import("@inkeep/cxkit-react");
      setCustomTrigger(() => InkeepModalSearchAndChat);
    })();
  }, []);

  const { siteConfig } = useDocusaurusContext();

  const inkeepConfig = siteConfig.customFields.inkeepConfig as {
    apiKey: string;
  };

  const inkeepBaseSettings: InkeepBaseSettings = {
    apiKey: inkeepConfig.apiKey || '',
    organizationDisplayName: "Teleport",
    primaryBrandColor: "#512FC9",
    aiApiBaseUrl: "https://goteleport.com/inkeep-proxy",
    privacyPreferences: {
      optOutAllAnalytics: true,
    },
    transformSource: (source) => {
      const isDocs =
      source.contentType === 'docs' ||
      source.type === 'documentation'
      if (!isDocs) {
        return source
      }
    return {
      ...source,
      tabs: ['Docs', ...(source.tabs ?? [])],
      icon: { builtIn: 'IoDocumentTextOutline' },
    }
    },
    colorMode: {
      forcedColorMode: "light",
    },
    theme: {
      zIndex: {
        overlay: "2100",
        modal: "2200",
        popover: "2300",
        skipLink: "2400",
        toast: "2500",
        tooltip: "2600",
      },
    },
  };

  const chatCallableFunctionsRef = useRef<AIChatFunctions | null>(null);
  const searchCallableFunctionsRef = useRef<SearchFunctions | null>(null);

  const handleChange = useCallback(
    (str: string) => {
      chatCallableFunctionsRef.current?.updateInputMessage(str);
      searchCallableFunctionsRef.current?.updateQuery(str);
      setMessage(str);
      if (str) {
        setIsOpen(true);
      }
    },
    []
  );


  const inkeepCustomTriggerProps: InkeepModalSearchAndChatProps = {
    baseSettings: {
      ...inkeepBaseSettings,
    },
    aiChatSettings: {
      ...inkeepAIChatSettings,
      chatFunctionsRef: chatCallableFunctionsRef,
      onInputMessageChange: handleChange,
    },
    searchSettings: {
      ...inkeepSearchSettings,
      searchFunctionsRef: searchCallableFunctionsRef,
      onQueryChange: handleChange,
    },
    modalSettings: {
      onOpenChange: setIsOpen,
      isOpen: isOpen,
    },
  };

  return (
    <div>
      <div className={styles.wrapper}>
        <InkeepSearchIconSvg className={styles.icon} />
        <input
          type="text"
          className={styles.input}
          onChange={(e) => handleChange(e.target.value)}
          onClick={() => setIsOpen(true)}
          placeholder="Search Docs"
          value={message}
        />
      </div>
      <BrowserOnly fallback={<div />}>
        {() => {
          return (
            CustomTrigger && <CustomTrigger {...inkeepCustomTriggerProps} />
          );
        }}
      </BrowserOnly>
    </div>
  );
}

const inkeepAIChatSettings: InkeepAIChatSettings = {
  aiAssistantName: 'Teleport',
  aiAssistantAvatar: 'https://goteleport.com/static/pam-standing.svg',
};

const inkeepSearchSettings: InkeepSearchSettings = {
  placeholder: 'Search Docs',
  tabs: [
    ['Docs', { isAlwaysVisible: true }],
    ['GitHub', { isAlwaysVisible: true }],
  ],
  shouldOpenLinksInNewTab: true,
  view: 'dual-pane',
};
