/**
 * Analytics event data structure for Google Analytics tracking
 */
interface AnalyticsEvent {
  /** The specific action that occurred (e.g., 'feedback_thumb_click', 'button_click') */
  event_name: string;
  /** Broad functional grouping for related events (e.g., 'feedback', 'navigation', 'search') */
  event_category: string;
  /** Specific context within the category (e.g., 'thumbs_up', 'header_link', 'pdf_download') */
  event_label?: string;
  /** Page path where the event occurred (defaults to current page) */
  page_path?: string;
  /** Additional custom data to track with the event */
  custom_parameters?: Record<string, any>;
}

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

export type { AnalyticsEvent };