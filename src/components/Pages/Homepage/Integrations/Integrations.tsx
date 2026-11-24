import React, { useMemo, useState } from "react";
import styles from "./Integrations.module.css";
import cn from "classnames";
import ArrowRightSvg from "@site/src/components/Icon/teleport-svg/arrow-circle-right.svg";
import Link from "@docusaurus/Link";
import Icon from "@site/src/components/Icon";
import SearchInput from "@site/src/components/SearchInput";
import FilterDropdown from "./FilterDropdown";
import {
  ALL_FILTER_ID,
  countIntegrationsByFilter,
  filterIntegrations,
  type IntegrationFilter,
} from "./filterIntegrations";

interface Integration {
  title: string;
  description?: string;
  href?: string;
  iconColor?: string;
  iconComponent: any;
  // Ids of the filters this integration belongs to
  tags?: string[];
}

interface AdditionalLinks {
  title: string;
  links: Array<{ title: string; href: string }>;
}

interface IntegrationsProps {
  title?: string;
  secondaryTitle?: string;
  layout: "row" | "column" | "row-condensed";
  className?: string;
  integrations: Integration[];
  mainLink?: { title: string; href: string };
  additionalLinks?: AdditionalLinks;
  desktopColumnsCount?: number;
  noBackgroundColor?: boolean;
  narrowPadding?: boolean;
  // Display a search input that filters integrations by title and description
  enableSearch?: boolean;
  // Categories shown in a dropdown, along with the number of integrations
  // in each. Selecting one shows only the integrations tagged with its id.
  // Integrations without a matching tag are listed under "Other".
  filters: IntegrationFilter[];
}

interface IntegrationCardProps extends Integration {
  layout?: IntegrationsProps["layout"];
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  title,
  description,
  href,
  iconColor,
  iconComponent,
  layout = "column",
}) => {
  const Icon = iconComponent;
  const isRowLayout = (layout as string).includes("row");
  const cardContent = (
    <>
      <div
        className={cn(styles.integrationIcon, {
          [styles.defaultIcon]: !iconColor && !isRowLayout,
          [styles.iconRow]: isRowLayout,
          [styles.iconRowCondensed]: layout === "row-condensed",
          [styles.bgColor]: iconColor,
        })}
        style={{ backgroundColor: iconColor }}
      >
        <Icon className={styles.iconSvg} />
      </div>
      <div
        className={cn(styles.integrationItemContent, {
          [styles.hasDescription]: description,
          [styles.rowLayout]: isRowLayout,
          [styles.iconRowCondensed]: layout === "row-condensed",
        })}
      >
        <h3 className={styles.integrationTitle}>{title}</h3>
        {description && (
          <p className={styles.integrationDescription}>{description}</p>
        )}
      </div>
    </>
  );

  return href ? (
    <Link
      to={href}
      className={cn(styles.integrationItem, {
        [styles.defaultIcon]: !iconColor && !isRowLayout,
        [styles.rowLayout]: isRowLayout,
        [styles.iconRowCondensed]: layout === "row-condensed",
      })}
      style={
        {
          "--layout": (layout as string).replace("-condensed", ""),
        } as React.CSSProperties
      }
    >
      {cardContent}
    </Link>
  ) : (
    <div
      className={cn(styles.integrationItem, styles.integrationItemNoLink, {
        [styles.defaultIcon]: !iconColor && !isRowLayout,
        [styles.rowLayout]: isRowLayout,
        [styles.iconRowCondensed]: layout === "row-condensed",
      })}
      style={
        {
          "--layout": (layout as string).replace("-condensed", ""),
        } as React.CSSProperties
      }
    >
      {cardContent}
    </div>
  );
};

const Integrations: React.FC<IntegrationsProps> = ({
  title = "Integrations",
  secondaryTitle,
  className = "",
  integrations,
  layout = "column",
  mainLink,
  additionalLinks,
  desktopColumnsCount = 5,
  noBackgroundColor = false,
  narrowPadding = false,
  enableSearch = false,
  filters = [],
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilterId, setSelectedFilterId] = useState(ALL_FILTER_ID);

  // "All" followed by each category with its number of integrations matching
  // the search, and "Other" for integrations outside the categories.
  // Categories without any integrations are left out.
  const filterOptions = useMemo(
    () => [
      { value: ALL_FILTER_ID, label: "All" },
      ...countIntegrationsByFilter(integrations, filters, searchQuery).map(
        (filter) => ({
          value: filter.id,
          label: `${filter.name} (${filter.count})`,
        }),
      ),
    ],
    [integrations, filters, searchQuery],
  );
  const hasFilters = filterOptions.length > 1;

  const visibleIntegrations = useMemo(
    () =>
      filterIntegrations(integrations, {
        query: searchQuery,
        filterId: selectedFilterId,
        filters,
      }),
    [integrations, searchQuery, selectedFilterId, filters],
  );

  return (
    <section
      className={cn(styles.integrations, className, {
        [styles.noBackgroundColor]: noBackgroundColor,
        [styles.narrowPadding]: narrowPadding,
      })}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            {title && <h2 className={styles.title}>{title}</h2>}
            {secondaryTitle && (
              <h3 className={styles.secondaryTitle}>{secondaryTitle}</h3>
            )}
          </div>
          {mainLink && (
            <Link to={mainLink.href} className={styles.mainLink}>
              {mainLink.title}
            </Link>
          )}
        </div>
        {(enableSearch || hasFilters) && (
          <div className={styles.controls}>
            {hasFilters && (
              <FilterDropdown
                className={styles.filter}
                triggerClassName={styles.filterTrigger}
                options={filterOptions}
                value={selectedFilterId}
                onChange={setSelectedFilterId}
                label="Filter integrations by category"
              />
            )}
            {enableSearch && (
              <SearchInput
                className={cn(styles.search, {
                  [styles.searchWithFilter]: hasFilters,
                })}
                inputClassName={styles.searchInput}
                query={searchQuery}
                onQueryChange={setSearchQuery}
                placeholder="Search integrations"
                label="Search integrations"
                clearButtonLabel="Clear integrations search"
              />
            )}
          </div>
        )}
        {visibleIntegrations.length === 0 && (enableSearch || hasFilters) ? (
          <p className={styles.noResults} role="status">
            {searchQuery.trim() ? (
              <>No integrations found for &ldquo;{searchQuery.trim()}&rdquo;.</>
            ) : (
              "No integrations found."
            )}
          </p>
        ) : (
          <div
            className={styles.grid}
            style={
              {
                "--desktop-column-count": desktopColumnsCount,
              } as React.CSSProperties
            }
          >
            {visibleIntegrations.map((integration) => (
              <IntegrationCard
                key={`${integration.title}-${integration.href ?? ""}`}
                layout={layout}
                {...integration}
              />
            ))}
          </div>
        )}
        {additionalLinks && (
          <div className={styles.additionalLinks}>
            {additionalLinks.title && (
              <p className={styles.additionalLinksTitle}>
                {additionalLinks.title}
              </p>
            )}
            <ul className={styles.additionalLinksList}>
              {additionalLinks?.links?.map((link, i) => (
                <li key={i}>
                  <Link to={link.href}>
                    <ArrowRightSvg /> {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};

export default Integrations;
