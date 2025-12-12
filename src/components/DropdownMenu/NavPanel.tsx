import { NavigationItem } from "server/strapi-types";
import Link from "../Link";
import styles from "./NavPanel.module.css";
import Icon from "../Icon";

const NavPanel = ({ panel }: { panel?: NavigationItem["panel"] }) => {
  if (!panel) {
    return null;
  }

  const { panelTitle, panelFeaturedItem, columns } = panel;

  return (
    <div className={styles.panel}>
      <div className={styles.panelLeft}>
        {panelTitle && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              paddingBottom: "16px",
              borderBottom: "0.5px solid #BBB",
            }}
          >
            {panelTitle?.icon?.url && (
              <img
                src={panelTitle?.icon?.url}
                alt={panelTitle?.icon?.alternativeText || ""}
                width={48}
                height={48}
              />
            )}
            <div className={styles.panelTitleTexts}>
              <span>{panelTitle?.title}</span>{" "}
              {panelTitle?.subtitle && (
                <>
                  <div>{" ● "}</div>
                  <span style={{ fontWeight: 400 }}>{panelTitle.subtitle}</span>
                </>
              )}
            </div>
          </div>
        )}
        <div className={styles.panelContents}>
          {columns?.map((column, colIndex) => (
            <ul
              className={styles.col}
              key={panelTitle?.title + "nav-panel-column" + colIndex}
            >
              {column.items?.map((item, itemIndex) => (
                <li
                  className={styles.li}
                  key={`panel-column-${colIndex}-item-${itemIndex}`}
                >
                  {item.link?.link ? (
                    <Link href={item.link.link}>{item.link?.title}</Link>
                  ) : (
                    <span>{item.link?.title}</span>
                  )}
                  {item.subItems && item.subItems.length > 0 && (
                    <ul
                      className={styles.subItemsList}
                      key={`
                        ${panelTitle?.title}-subitems-${colIndex}${itemIndex}`}
                    >
                      {item.subItems?.map((subItem, subItemIndex) => (
                        <li
                          className={styles.li}
                          key={`panel-column-${colIndex}-item-${itemIndex}`}
                        >
                          {subItem?.link ? (
                            <Link href={subItem.link}>{subItem.title}</Link>
                          ) : (
                            <span>{subItem.title}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      {panelFeaturedItem && (
        <div className={styles.panelRight}>
          <div>
            <span style={{ margin: "15.5px 0" }}>
              {panelFeaturedItem.title}
            </span>
          </div>
          {panelFeaturedItem.item?.image?.url && (
            <div className={styles.featuredImage}>
              <div className={styles.imageBox}>
                <img
                  src={panelFeaturedItem.item.image.url}
                  alt={panelFeaturedItem.item.image.alternativeText || ""}
                  width={189}
                  height={105}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  padding: "12px 8px 12px 16px",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <span style={{ lineHeight: "1.4" }}>
                  {panelFeaturedItem?.item.text}
                </span>
                {panelFeaturedItem.item?.cta?.href && (
                  <a
                    href={panelFeaturedItem.item.cta.href}
                    className={styles.featuredItemLink}
                  >
                    {panelFeaturedItem.item.cta?.title}
                    <Icon
                      name="arrowRight2"
                      size="xxs"
                      className={styles.arrow}
                    />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NavPanel;
