// TypeScript interfaces for analytics events
interface AnalyticsEvent {
  event_name: string;
  event_category: string;
  event_label?: string;
  page_path?: string;
  custom_parameters?: Record<string, any>;
}

// Generic gtag wrapper with safety checks
export const trackEvent = (eventData: AnalyticsEvent): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventData.event_name, {
      event_category: eventData.event_category,
      event_label: eventData.event_label,
      page_path: eventData.page_path || window.location.pathname,
      ...eventData.custom_parameters
    });
  }
};

// Export interface for use in other components
export type { AnalyticsEvent };