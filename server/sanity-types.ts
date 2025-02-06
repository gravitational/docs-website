export type SanityCustomListProps = {
  title?: string;
  listItems: CustomListItemProps[];
};

export type CustomListItemProps = {
  text: string;
  icon: string;
  subItems: CustomListItemProps[];
};

export type SanityFeedbackQuote = {
  content: string;
  author: string;
  authorTitle: string;
  avatar: string;
  logo: string;
};

export type SanityBtn = {
  title: string;
  href: string;
  id: string;
  size?: "small" | "medium" | "large" | "xl" | "xxl";
  variant?: "text" | "outlined" | "contained" | "secondary";
  sendBtnClick: boolean;
};

type NavSection = {
  title?: string | null;
  subtitle?: string | null;
  sectionItems: {
    itemType: string | "normal" | "image";
    icon?: string | null;
    title?: string | null;
    description?: string | null;
    link: string | null;
    imageItem?: {
      imageTitle?: string | null;
      useMetadata: boolean | null;
      customImage?: {
        itemImage: string;
        itemTitle: string;
        imageCTA?: string;
        imageDate?: string;
      } | null;
    };
  }[];
  inTwoColumns?: boolean;
};

export type NavigationItem = {
  title: string;
  isDropdown: string | "dropdown" | "link";
  url?: string;
  menuType?: string | "aio" | "submenus";
  columns?:
    | {
        columnSections: NavSection[];
      }[]
    | null;
  submenus?:
    | {
        submenuTitle?: string | null;
        titleLink?: string;
        submenuSections: NavSection[];
      }[]
    | null;
};

export type HeaderNavigation = {
  navbarData: {
    logo: string | null;
    menu: NavigationItem[] | null;
    rightSide: {
      search: { searchIcon: string; searchLink: string } | null;
      CTAs: SanityBtn[];
      mobileBtn?: SanityBtn;
    } | null;
  };
  bannerButtons: {
    first: { title: string; url: string };
    second: { title: string; url: string };
  };
};
export type FooterLinkBlock = {
  title: string;
  linkList: {
    title: string;
    url: string;
  }[];
};
export type FooterLinkColumn = {
  blocks: FooterLinkBlock[];
};
export type FooterMain = {
  text: string | null;
  awards: { award: string; title: string }[] | null;
};
export type FooterInfo = {
  title: string | null;
  text: string | null;
  socialLinks:
    | {
        url: string;
        logo: string | null;
        title: string | null;
      }[]
    | null;
};
export type FooterData = {
  mainBlock: FooterMain;
  infoBlock: FooterInfo;
  linkColumns: FooterLinkColumn[];
  legalLinks: { title: string; url: string }[];
  legalText: string | null;
  logo: string;
};
