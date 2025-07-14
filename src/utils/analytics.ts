/**
 * Analytics event data structure for Google Analytics tracking
 */
interface AnalyticsEvent {
  /** The specific action that occurred (e.g., 'docs_feedback_thumbs_up', 'docs_feedback_comment_thumbs_down') */
  event_name: string;
  /** Page path where the event occurred. Defaults to current page, but it is not always added to event. This makes sure it is.  */
  page_path?: string;
  /** Additional custom data to track with the event */
  custom_parameters?: Record<string, any>;
}

export const trackEvent = (eventData: AnalyticsEvent): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventData.event_name, {
      page_path: eventData.page_path || window.location.pathname,
      ...eventData.custom_parameters
    });
  }
};

export type { AnalyticsEvent };