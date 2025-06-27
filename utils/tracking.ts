/*=========================================================
  Google Tag Manager
=========================================================*/
export const isTagManagerEnabled = () => {
  const enabled = typeof window !== "undefined" && !!(window as any).dataLayer;
  console.debug(`[DocsEvent] isTagManagerEnabled:`, enabled);
  return enabled;
};
  
  // Wrapper around GTM calls to prevent errors then used locally with disabled GTM.
  export const DocsEvent = (
    event: string,
    payload: Record<string, unknown> = {}
  ): Promise<void> => {
    console.debug(`[DocsEvent] Called with event:`, event, payload);
    return new Promise<void>((resolve) => {
      if (isTagManagerEnabled()) {
        (window as any).dataLayer.push({
          event,
          ...payload,
  
          /**eventCallback and eventTimeout are not found in GTM official docs!
          eventCallback is a function which will execute when all tags which fire on
          the event have executed; it is scoped to this promise. Always add eventTimeout
          when you use eventCallback.
          */
          eventCallback: () => resolve(),
  
          /**eventTimeout takes a number in milliseconds as a value after which it calls eventCallback, so
          even if the tags don't fire or signal completion, eventCallback will be invoked (and
          this promise resolved)
          */
          eventTimeout: 1000,
        });
      } else {
        console.log("Docs Event", payload);
        resolve();
      }
    });
  };
  