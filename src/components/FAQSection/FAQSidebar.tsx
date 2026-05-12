import Icon from "@site/src/components/Icon";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useFAQTemplate, type FAQSection } from "./FAQSectionsContext";
import styles from "./FAQSidebar.module.css";

const useStickyDropdown = (
  dropdownRef: React.RefObject<HTMLElement | null>,
  navRef: React.RefObject<HTMLDivElement | null>,
) => {
  const BREAKPOINT = 1401; // xl-scr breakpoint defined in src/styles.media.css
  const [isFixed, setIsFixed] = useState(false);
  const fixedStyleRef = useRef<{ left: number; width: number } | null>(null);

  useEffect(() => {
    let observer: IntersectionObserver;
    const handleResize = () => {
      const documentStyle = getComputedStyle(document.documentElement);
      const navbarHeight = parseFloat(
        documentStyle.getPropertyValue("--ifm-navbar-height"),
      );

      const nav = navRef.current;
      const dropdown = dropdownRef.current;
      if (!nav || !dropdown) return;

      const dropdownToggleHeight = dropdown.getBoundingClientRect().height;
      const fixedOffset = navbarHeight + dropdownToggleHeight + 4; // 4px is the space between the page header and the "sticky" dropdown

      observer = new IntersectionObserver(
        ([entry]) => {
          if (window.innerWidth >= BREAKPOINT) {
            setIsFixed(false);
            return;
          }
          if (!entry.isIntersecting) {
            const rect = nav.getBoundingClientRect();
            fixedStyleRef.current = { left: rect.left, width: rect.width };
            setIsFixed(true);
          } else {
            setIsFixed(false);
          }
        },
        { rootMargin: `-${fixedOffset}px 0px 0px 0px`, threshold: 0 },
      );

      observer.observe(nav);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return { isFixed, fixedStyleRef };
};

interface FAQSidebarProps {
  sections: FAQSection[];
}

const useActiveFAQSection = (
  ids: string[],
): [string | null, (id: string) => void] => {
  const { setSearchQuery, searchInputRef } = useFAQTemplate();
  const [activeId, setActiveId] = useState<string | null>(null);
  const idsKey = ids.join("|"); // Used as the useEffect dependency
  // Track each heading's position relative to the detection zone
  const headingPositionMap = useRef<Map<string, "above" | "active" | "below">>(
    new Map(),
  );

  const manuallySetActiveId = (id: string) => {
    setActiveId(id);

    // Clear search query when a section is manually selected
    setSearchQuery("");
    searchInputRef.current!.value = "";

    // When the user manually clicks a section, consider it active regardless of its position
    headingPositionMap.current.set(id, "active");

    // Set all other sections as "below"
    ids.forEach((otherId) => {
      if (otherId !== id) {
        headingPositionMap.current.set(otherId, "below");
      }
    });
  };

  useEffect(() => {
    if (ids.length === 0) return;

    // Initially consider all headings as below the detection zone
    headingPositionMap.current = new Map(ids.map((id) => [id, "below"]));

    const detectActiveHeading = () => {
      // Active = the last heading in document order that is above or inside the detection zone.
      // The section stays active after the related heading exits upward, until another heading crosses the zone.
      let active: string | null = null;
      for (const id of ids) {
        const s = headingPositionMap.current.get(id);
        if (s === "above" || s === "active") active = id;
      }
      // Default to the first section if no heading has entered the detection zone yet
      setActiveId(active ?? ids[0]);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            headingPositionMap.current.set(entry.target.id, "active");
          } else if (entry.boundingClientRect.top < 0) {
            headingPositionMap.current.set(entry.target.id, "above");
          } else {
            headingPositionMap.current.set(entry.target.id, "below");
          }
        });
        detectActiveHeading();
      },
      // A section becomes active when its heading intersects the top portion of the viewport
      { rootMargin: "0px 0px -80% 0px", threshold: 0 },
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [idsKey]);

  return [activeId, manuallySetActiveId];
};

const FAQSidebar: React.FC<FAQSidebarProps> = ({ sections }) => {
  const ids = sections.map((s) => s.id);
  const [activeId, setActiveId] = useActiveFAQSection(ids);
  const [isOpen, setIsOpen] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isFixed, fixedStyleRef } = useStickyDropdown(dropdownRef, navRef);

  if (sections.length === 0) return null;

  const activeSection = sections.find((s) => s.id === activeId);

  return (
    <>
      <nav
        ref={navRef}
        className={clsx(styles.sidebar)}
        aria-label="FAQ sections"
      >
        <div
          ref={dropdownRef}
          className={clsx(styles.dropdownContainer, {
            [styles.dropdownContainerOpen]: isOpen,
            [styles.dropdownFixed]: isFixed,
          })}
          style={
            isFixed && fixedStyleRef.current
              ? {
                  left: fixedStyleRef.current.left,
                  width: fixedStyleRef.current.width,
                }
              : undefined
          }
        >
          <button
            className={styles.dropdownToggle}
            onClick={() => setIsOpen((o) => !o)}
            aria-expanded={isOpen}
          >
            {activeSection ? (
              <Icon
                name={activeSection.icon}
                size="md"
                className={styles.icon}
              />
            ) : (
              <Icon name={sections[0].icon} size="md" className={styles.icon} />
            )}
            <span className={styles.dropdownToggleLabel}>
              {activeSection?.title ?? sections[0].title}
            </span>
            <span
              className={clsx(styles.chevron, { [styles.chevronOpen]: isOpen })}
              aria-hidden="true"
            />
          </button>
          <ul className={styles.list}>
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  onClick={() => {
                    setActiveId(section.id);
                    setIsOpen(false);
                  }}
                  className={clsx(styles.link, {
                    [styles.linkActive]: activeId === section.id,
                  })}
                  aria-current={
                    activeId === section.id ? "location" : undefined
                  }
                >
                  <Icon name={section.icon} size="md" className={styles.icon} />
                  <span>{section.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
};

export default FAQSidebar;
