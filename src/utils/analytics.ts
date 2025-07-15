/**
 * Analytics event data structure for Google Analytics tracking
 */
interface AnalyticsEvent {
  /** The specific action that occurred (e.g., 'docs_feedback_thumbs_up', 'docs_feedback_comment_thumbs_down') */
  event_name: string;
  /** Additional custom data to track with the event */
  custom_parameters?: Record<string, any>;
  /** Function to submit the data. Intended to replace window.gtag if provided. **/
  gtag?: (command: string, name: string, params: any) => {};
}

export type { AnalyticsEvent };

// trackEvent reports eventData to Google Analytics. It uses the default gtag
// function unless one is supplied in eventData. If gtag is unavailable, e.g.,
// in a local preview site, trackEvent logs the event data to the console.
export const trackEvent = (eventData: AnalyticsEvent): void => {
  const gtagFn = eventData.gtag || window.gtag || logGtag;

  gtagFn("event", eventData.event_name, {
    ...eventData.custom_parameters,
  });
};

// collectGtagCalls returns a function with the same signature as gtag. The
// function pushes gtag calls to an array field of window so we can make test
// assertions against them. For this to work, there must be a way to pass this
// function to a component to call instead of the gtag function from gtag.js,
// such as passing it as a prop.
//
// The length of the window.gtagCalls array indicates the number of gtag calls.
// Each element contains the gtag command, e.g., "get", "event", or "set", along
// with the parameters passed to the command.
export const collectGtagCalls = () => {
  // Reset the collector so we don't include events from other stories
  window.gtagCalls = [];
  return (command: string, name: string, params: any) => {
    window.gtagCalls.push({
      command: command,
      name: name,
      params: params,
    });
  };
};

// logGtag prints the arguments and payload of a gtag call to the console. Used
// for local debugging.
const logGtag = (command: string, name: string, params: any) => {
  const gtagCall = {
    command: command,
    name: name,
    params: params,
  };
  console.log("gtag called with: %o", gtagCall);
};

export enum copyButtonScope {
  other = 0,
  line,
  snippet,
}

interface CodeSnippetGtagEvent {
  name: "code_copy_button";
  params: CodeSnippetGtagEventParams;
}

interface CodeSnippetGtagEventParams {
  label: string;
  scope: string;
}

export const makeCodeSnippetGtagEvent = (
  scope: copyButtonScope,
  label: string,
): CodeSnippetGtagEvent => {
  return {
    name: "code_copy_button",
    params: {
      scope: scope,
      label: label,
    },
  };
};
