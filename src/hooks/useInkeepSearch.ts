import { useState, useRef, useCallback, useEffect } from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import type {
  InkeepAIChatSettings,
  InkeepSearchSettings,
  InkeepModalSearchAndChatProps,
  InkeepBaseSettings,
  AIChatFunctions,
  SearchFunctions,
  InkeepCallbackEvent,
  ConversationMessage,
} from "@inkeep/cxkit-react";
import { trackEvent } from "../utils/analytics";

interface UseInkeepSearchOptions {
  version?: string;
  enableKeyboardShortcut?: boolean;
  keyboardShortcut?: string; // 'f' for ⌘+F, 'k' for ⌘+K
  enableAIChat?: boolean;
  autoOpenOnInput?: boolean; // Auto-open modal when typing
}

export function useInkeepSearch(options: UseInkeepSearchOptions = {}) {
  const {
    version,
    enableKeyboardShortcut = false,
    keyboardShortcut = "k",
    enableAIChat = false,
    autoOpenOnInput = false,
  } = options;

  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [ModalSearchAndChat, setModalSearchAndChat] = useState(null);

  const { siteConfig } = useDocusaurusContext();

  const inkeepConfig = siteConfig.customFields.inkeepConfig as {
    apiKey: string;
  };

  // Load the modal component dynamically
  useEffect(() => {
    (async () => {
      const { InkeepModalSearchAndChat } = await import("@inkeep/cxkit-react");
      setModalSearchAndChat(() => InkeepModalSearchAndChat);
    })();
  }, []);

  // Add keyboard shortcut for opening search
  useEffect(() => {
    if (!enableKeyboardShortcut) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === keyboardShortcut) {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enableKeyboardShortcut, keyboardShortcut]);

  const inkeepBaseSettings: InkeepBaseSettings = {
    apiKey: inkeepConfig.apiKey || "",
    organizationDisplayName: "Teleport",
    primaryBrandColor: "#512FC9",
    aiApiBaseUrl: "https://goteleport.com/inkeep-proxy",
    analyticsApiBaseUrl: "https://goteleport.com/inkeep-proxy/analytics",
    privacyPreferences: {
      optOutAllAnalytics: false,
    },
    transformSource: (source) => {
      const isDocs =
        source.contentType === "docs" || source.type === "documentation";
      if (!isDocs) {
        return source;
      }
      return {
        ...source,
        tabs: ["Docs", ...(source.tabs ?? [])],
        icon: { builtIn: "IoDocumentTextOutline" },
      };
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
    // reference: https://docs.inkeep.com/cloud/ui-components/customization-guides/use-your-own-analytics
    onEvent: (event: InkeepCallbackEvent) => {
      const { eventName, properties } = event;

      const eventsToTrack = [
        "user_message_submitted",
        "search_query_response_received",
        "search_result_clicked",
        "assistant_source_item_clicked",
        "assistant_negative_feedback_submitted",
        "assistant_positive_feedback_submitted",
        "assistant_message_inline_link_opened",
        "assistant_message_copied",
        "assistant_code_block_copied",
      ];

      if (!eventsToTrack.includes(eventName)) {
        return;
      }

      const getLatestMessage = (
        messages: ConversationMessage[],
        role: "assistant" | "system" | "user"
      ) => {
        return (
          messages
            .filter((msg) => msg.role === role)
            .slice(-1)[0]
            ?.content.slice(0, 100) || ""
        );
      };

      try {
        switch (eventName) {
          case "search_query_response_received": {
            if (properties.totalResults) {
              trackEvent({
                event_name: "search",
                custom_parameters: {
                  search_term: properties.searchQuery.slice(0, 100),
                  total_results: properties.totalResults,
                },
              });
            }
            break;
          }
          case "user_message_submitted": {
            trackEvent({
              event_name: `inkeep_${eventName}`,
              custom_parameters: {
                latest_user_message: getLatestMessage(
                  properties.conversation.messages,
                  "user"
                ),
              },
            });
            break;
          }
          case "search_result_clicked": {
            trackEvent({
              event_name: `inkeep_${eventName}`,
              custom_parameters: {
                search_term: properties.searchQuery.slice(0, 100),
                clicked_link_url: properties.url,
              },
            });
            break;
          }
          case "assistant_source_item_clicked": {
            trackEvent({
              event_name: `inkeep_${eventName}`,
              custom_parameters: {
                latest_user_message: getLatestMessage(
                  properties.conversation.messages,
                  "user"
                ),
                clicked_link_url: properties.link.url,
              },
            });
            break;
          }
          case "assistant_positive_feedback_submitted":
          case "assistant_negative_feedback_submitted": {
            trackEvent({
              event_name: `inkeep_${eventName}`,
              custom_parameters: {
                latest_assistant_message: getLatestMessage(
                  properties.conversation.messages,
                  "assistant"
                ),
                feedback_reason_labels:
                  properties?.reasons?.map((r) => r.label).join(", ") || "",
                feedback_reason_details:
                  properties?.reasons
                    ?.map((r) => r.details.slice(0, 100))
                    .join(", ") || "",
              },
            });
            break;
          }
          case "assistant_message_inline_link_opened": {
            trackEvent({
              event_name: `inkeep_${eventName}`,
              custom_parameters: {
                clicked_link_url: properties.url,
              },
            });
            break;
          }
          case "assistant_message_copied": {
            trackEvent({
              event_name: `inkeep_${eventName}`,
              custom_parameters: {
                latest_assistant_message: getLatestMessage(
                  properties.conversation.messages,
                  "assistant"
                ),
              },
            });
            break;
          }
          case "assistant_code_block_copied": {
            trackEvent({
              event_name: `inkeep_${eventName}`,
              custom_parameters: {
                code_value: properties.code.slice(0, 100),
                code_language: properties.language || "",
              },
            });
            break;
          }
          default:
            break;
        }
      } catch (error) {
        console.error("Error processing Inkeep event:", error);
      }
    },
  };

  const inkeepSearchSettings: InkeepSearchSettings = {
    placeholder: "Search Docs",
    tabs: [
      ["Docs", { isAlwaysVisible: true }],
      ["GitHub", { isAlwaysVisible: true }],
    ],
    shouldOpenLinksInNewTab: true,
    view: "dual-pane",
  };

  const inkeepAIChatSettings: InkeepAIChatSettings | undefined = enableAIChat
    ? {
        aiAssistantName: "Teleport",
        aiAssistantAvatar: "https://goteleport.com/static/pam-standing.svg",
      }
    : undefined;

  const chatCallableFunctionsRef = useRef<AIChatFunctions | null>(null);
  const searchCallableFunctionsRef = useRef<SearchFunctions | null>(null);

  const handleSearchChange = useCallback(
    (str: string) => {
      searchCallableFunctionsRef.current?.updateQuery(str);
      setMessage(str);
      if (autoOpenOnInput && str) {
        setIsOpen(true);
      }
    },
    [autoOpenOnInput]
  );

  const handleChatChange = useCallback(
    (str: string) => {
      chatCallableFunctionsRef.current?.updateInputMessage(str);
      setMessage(str);
      if (autoOpenOnInput && str) {
        setIsOpen(true);
      }
    },
    [autoOpenOnInput]
  );

  // Create dynamic search settings based on version
  const dynamicSearchSettings = {
    ...inkeepSearchSettings,
    searchFunctionsRef: searchCallableFunctionsRef,
    onQueryChange: handleSearchChange,
    // Add version-specific metadata if version is provided
    ...(version && {
      metadata: {
        version: version,
      },
    }),
  };

  const modalSettings = {
    onOpenChange: setIsOpen,
    isOpen: isOpen,
  };

  const inkeepModalProps: InkeepModalSearchAndChatProps = {
    baseSettings: {
      ...inkeepBaseSettings,
    },
    searchSettings: dynamicSearchSettings,
    modalSettings: modalSettings,
    ...(enableAIChat &&
      inkeepAIChatSettings && {
        aiChatSettings: {
          ...inkeepAIChatSettings,
          chatFunctionsRef: chatCallableFunctionsRef,
          onInputMessageChange: handleChatChange,
        },
      }),
  };

  return {
    isOpen,
    setIsOpen,
    ModalSearchAndChat,
    inkeepModalProps,
  };
}
