// emitFunc emits an event to Google Analytics or a custom sink.
type emitFunc = (name: string, params: any) => {};

/**
 * Analytics event data structure for Google Analytics tracking
 */
interface AnalyticsEvent {
  /** The specific action that occurred (e.g., 'docs_feedback_thumbs_up', 'docs_feedback_comment_thumbs_down') */
  event_name: string;
  /** Additional custom data to track with the event */
  custom_parameters?: Record<string, any>;
  /** Function to submit the data. The default is to push the event to
   * window.dataLayer so Google Tag Manager can intercept it. **/
  emitEvent?: emitFunc;
}

export type { AnalyticsEvent };

// trackEvent reports eventData to Google Analytics. It uses the default gtag
// function unless one is supplied in eventData. If gtag is unavailable, e.g.,
// in a local preview site, trackEvent logs the event data to the console.
export const trackEvent = (eventData: AnalyticsEvent): void => {
  let emit: emitFunc;
  if (eventData.emitEvent) {
    emit = eventData.emitEvent;
  } else if (window.dataLayer) {
    emit = (name: string, params: any) => {
      window.dataLayer.push({
        event: name,
        ...params,
      });
    };
  } else {
    emit = logEmit;
  }

  emit(eventData.event_name, {
    ...eventData.custom_parameters,
  });
};

// collectEvents returns a function with the same signature as gtag. The
// function pushes gtag calls to an array field of window so we can make test
// assertions against them. For this to work, there must be a way to pass this
// function to a component to call instead of the gtag function from gtag.js,
// such as passing it as a prop.
//
// The length of the window.gtagCalls array indicates the number of gtag calls.
// Each element contains the gtag command, e.g., "get", "event", or "set", along
// with the parameters passed to the command.
export const collectEvents = () => {
  // Reset the collector so we don't include events from other stories
  window.events = [];
  return (name: string, params: any) => {
    window.events.push({
      event: name,
      ...params,
    });
  };
};

// logEmit prints the arguments and payload of a gtag call to the console. Used
// for local debugging.
const logEmit = (name: string, params: any) => {
  const gtagCall = {
    event: name,
    ...params,
  };
  console.log("Google Analytics event emitted: %o", gtagCall);
};
