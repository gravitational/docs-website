import { useDoc } from "@docusaurus/plugin-content-docs/client";

interface TemplateConfig {
  hideTitleSection?: boolean;
  removeTOCSidebar?: boolean;
  fullWidth?: boolean;
  showDescription?: boolean;
  isLandingPage?: boolean;
}

const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  default: {},
  "no-toc": {
    removeTOCSidebar: true,
  },
  "landing-page": {
    removeTOCSidebar: true,
    hideTitleSection: true,
    fullWidth: true,
    isLandingPage: true,
  },
  "doc-page": {
    removeTOCSidebar: true,
    fullWidth: true,
    showDescription: true,
  },
};

export function useDocTemplate(): TemplateConfig {
  const { frontMatter } = useDoc();
  const templateName = (frontMatter as any).template || "default";

  const config = TEMPLATE_CONFIGS[templateName] || TEMPLATE_CONFIGS.default;
  return {
    hideTitleSection: config.hideTitleSection ?? false,
    removeTOCSidebar: config.removeTOCSidebar ?? false,
    fullWidth: config.fullWidth ?? false,
    showDescription: config.showDescription ?? false,
    isLandingPage: config.isLandingPage ?? false,
  };
}
