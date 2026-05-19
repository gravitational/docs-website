export default function useDocusaurusContext() {
  return {
    siteConfig: {
      title: "Docs",
      url: "https://goteleport.com",
      baseUrl: "/docs/",
      customFields: {
        inkeepConfig: {
            apiKey: "fake-api-key",
        }
      },
    },
  };
}
