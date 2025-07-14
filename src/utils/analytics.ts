/**
 * Analytics event data structure for Google Analytics tracking
 */
interface AnalyticsEvent {
  /** The specific action that occurred (e.g., 'docs_feedback_thumbs_up', 'docs_feedback_comment_thumbs_down') */
  event_name: string;
  /** Additional custom data to track with the event */
  custom_parameters?: Record<string, any>;
}

export const trackEvent = (eventData: AnalyticsEvent): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventData.event_name, {
      ...eventData.custom_parameters
    });
  }
};

export type { AnalyticsEvent };