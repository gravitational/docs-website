const buttonFragment = `
title
sendButtonClick
href
elementID
buttonVariant
buttonSize`;

const STRAPI_URL = process.env.STRAPI_URL as string;
if (!STRAPI_URL) {
  console.warn("STRAPI_URL environment variable is not set");
}
const STRAPI_AUTH_TOKEN = process.env.STRAPI_AUTH_TOKEN as string;
if (!STRAPI_AUTH_TOKEN) {
  console.warn("STRAPI_AUTH_TOKEN environment variable is not set");
}
const STRAPI_DRAFT_DEFAULT = process.env.STRAPI_DRAFT_DEFAULT as string;

export const showDraft = (draftMode?: boolean) =>
  draftMode || STRAPI_DRAFT_DEFAULT === "true" ? "DRAFT" : "PUBLISHED";
// Used to check for unsafe characters in slugs
const characterRegexp = /["<>%{}|\\^~[\]`]/;
export const validateSlug = (slug: string) => {
  if (slug.match(characterRegexp)) {
    return false;
  } else return true;
};

export const fetchData = async (queryString: string) => {
  const abortController = new AbortController();
  if (!STRAPI_URL) return {};
  try {
    // Timeout all strapi requests after 10 seconds
    setTimeout(() => abortController.abort(), 10000);
    const result = await fetch(STRAPI_URL + "/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${STRAPI_AUTH_TOKEN}`,
      },
      body: JSON.stringify({ query: `query {${queryString}}` }),
      signal: abortController.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.data) return data.data;
        else return {};
      });

    if (!result) {
      throw new Error("No result returned from query!");
    }
    return result;
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        console.error(
          `Strapi Request was aborted after 10 seconds for query: \n${queryString}`
        );
      } else {
        throw err;
      }
    } else {
      console.error("Unexpected error:", err);
    }
    return [];
  }
};

const headerNavQuery = `
 navigation(status: ${showDraft() ? "DRAFT" : "PUBLISHED"}) {
    logo {
      url
    }
    menuItems {
      dropdownType
      link
      title
      type
      navSections {
        submenuTitleLink
        submenuTitle
        submenuSections {
          title
          subtitle
          inTwoColumns
          sectionItems {
            description
            imageTitle
            itemType
            link
            title
            highlightBadge
            customImage {
              image {
                url
              }
              imageCTA
              imageDate
              itemTitle
            }
          }
        }
      }
    }
    rightSide {
      searchButton {
        alt
        icon {
          url
        }
        url
      }
      mobileButton {
        ${buttonFragment}
      }
      ctas {
        ${buttonFragment}
      }
    }
  }
  topBanner(status: ${showDraft() ? "DRAFT" : "PUBLISHED"}) {
    firstButton {
      link
      title
    }
    secondButton {
      link
      title
    }
  }
  `;

export const getNavData = async () => {
  const data = await fetchData(headerNavQuery);
  const buttons = [];
  if (data.topBanner.firstButton) buttons.push(data.topBanner.firstButton);
  if (data.topBanner.secondButton) buttons.push(data.topBanner.secondButton);
  data.navigation.rightSide.bannerButtons = buttons;
  return data.navigation;
};

export const getBannerData = async () => {
  const query = `
  topBanner(status: ${showDraft() ? "DRAFT" : "PUBLISHED"}) {
    bannerText
    bannerType
    ctaText
    expiredCTAText
    expiredLink
    expiredText
    link
    firstButton {
      link
      title
    }
    secondButton {
      link
      title
    }
    featuredEvent {
      location
      link
      title
      start
      end
      isVirtual
    }
  }`;
  const data = await fetchData(query);
  return data.topBanner;
};
