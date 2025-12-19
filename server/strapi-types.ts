export type StrapiBtn = {
  title: string;
  href: string;
  elementId: string;
  buttonSize?: "small" | "medium" | "large" | "xl" | "xxl";
  buttonVariant?: "text" | "outlined" | "contained" | "secondary" | "primary";
  sendButtonClick: boolean;
};
export type NavSectionItem = {
  description: string;
  imageTitle: string;
  itemType: string | "normal" | "image";
  link: string;
  title: string;
  highlightBadge?: boolean | null;
  customImage: {
    image: { url: string };
    imageCTA: string;
    imageDateText: string;
    itemTitle: string;
  };
};
type NavSection = {
  title: string;
  subtitle: string;
  inTwoColumns?: boolean;
  sectionItems: NavSectionItem[];
};

export type NavigationItem = {
  title: string;
  type: string | "dropdown" | "link";
  link?: string;
  dropdownType?: string | "aio" | "submenus" | "simple";
  navSections: {
    submenuTitle?: string | null;
    submenuTitleLink?: string;
    submenuSections: NavSection[];
  }[];
  panel?: {
    panelTitle?: {
      title?: string;
      subtitle?: string;
      icon?: {
        url: string;
        alternativeText?: string;
      };
    };
    panelFeaturedItem?: {
      title?: string;
      item?: {
        cta?: StrapiBtn;
        text?: string;
        image?: {
          url: string;
          alternativeText?: string;
        };
      };
    };
    columns?: {
      items?: {
        link?: {
          title: string;
          link?: string;
        };
        subItems?: {
          title: string;
          link?: string;
        }[];
      }[];
    }[];
  };
};
export type BannerButtons = {
  title: string;
  link: string;
}[];
export type HeaderNavigation = {
  logo: { url: string };
  menuItems: NavigationItem[] | null;
  rightSide: {
    searchButton: { alt: string; icon: { url: string }; url: string } | null;
    ctas: StrapiBtn[];
    mobileButton?: StrapiBtn;
    bannerButtons: BannerButtons;
  } | null;
};
