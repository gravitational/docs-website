import { useState, useRef, useCallback, useEffect } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import type {
  InkeepAIChatSettings,
  InkeepSearchSettings,
  InkeepModalSearchAndChatProps,
  InkeepBaseSettings,
  AIChatFunctions,
  SearchFunctions,
} from '@inkeep/cxkit-react';

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
    keyboardShortcut = 'k',
    enableAIChat = false,
    autoOpenOnInput = false,
  } = options;
  
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [ModalSearchAndChat, setModalSearchAndChat] = useState(null);

  const { siteConfig } = useDocusaurusContext();

  const inkeepConfig = siteConfig.customFields.inkeepConfig as {
    apiKey: string;
  };

  // Load the modal component dynamically
  useEffect(() => {
    (async () => {
      const { InkeepModalSearchAndChat } = await import('@inkeep/cxkit-react');
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

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcut, keyboardShortcut]);

  const inkeepBaseSettings: InkeepBaseSettings = {
    apiKey: inkeepConfig.apiKey || '',
    organizationDisplayName: 'Teleport',
    primaryBrandColor: '#512FC9',
    aiApiBaseUrl: 'https://goteleport.com/inkeep-proxy',
    analyticsApiBaseUrl: 'https://goteleport.com/inkeep-proxy/analytics',
    privacyPreferences: {
      optOutAllAnalytics: false,
    },
    transformSource: (source) => {
      const isDocs =
        source.contentType === 'docs' ||
        source.type === 'documentation';
      if (!isDocs) {
        return source;
      }
      return {
        ...source,
        tabs: ['Docs', ...(source.tabs ?? [])],
        icon: { builtIn: 'IoDocumentTextOutline' },
      };
    },
    colorMode: {
      forcedColorMode: 'light',
    },
    theme: {
      zIndex: {
        overlay: '2100',
        modal: '2200',
        popover: '2300',
        skipLink: '2400',
        toast: '2500',
        tooltip: '2600',
      },
    },
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

  const inkeepAIChatSettings: InkeepAIChatSettings | undefined = enableAIChat
    ? {
        aiAssistantName: 'Teleport',
        aiAssistantAvatar: 'https://goteleport.com/static/pam-standing.svg',
      }
    : undefined;

  const chatCallableFunctionsRef = useRef<AIChatFunctions | null>(null);
  const searchCallableFunctionsRef = useRef<SearchFunctions | null>(null);

  const handleChange = useCallback(
    (str: string) => {
      chatCallableFunctionsRef.current?.updateInputMessage(str);
      searchCallableFunctionsRef.current?.updateQuery(str);
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
    onQueryChange: handleChange,
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
    ...(enableAIChat && inkeepAIChatSettings && {
      aiChatSettings: {
        ...inkeepAIChatSettings,
        chatFunctionsRef: chatCallableFunctionsRef,
        onInputMessageChange: handleChange,
      },
    }),
  };

  return {
    message,
    setMessage,
    isOpen,
    setIsOpen,
    ModalSearchAndChat,
    inkeepModalProps,
    handleChange,
  };
}