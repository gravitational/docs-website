export const DocsEvent = (
    event: string,
    payload: Record<string, unknown> = {}
): void => {
    console.debug(`[DocsEvent] Called with event:`, event, payload);

    if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
        (window as any).gtag('event', event, payload);
    } else {
        console.log("gtag not available", event, payload);
    }
};