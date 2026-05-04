import Icon from "@site/src/components/Icon";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import type { FAQSection } from "./FAQSectionsContext";
import styles from "./FAQSidebar.module.css";

interface FAQSidebarProps {
  sections: FAQSection[];
  hiddenSectionIds: Set<string>;
}

const useActiveFAQSection = (
  ids: string[],
): [string | null, (id: string) => void] => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const idsKey = ids.join("|"); // Used as the useEffect dependency
  // Track each heading's position relative to the detection zone
  const headingPositionMap = useRef<Map<string, "above" | "active" | "below">>(
    new Map(),
  );

  const manuallySetActiveId = (id: string) => {
    setActiveId(id);
    // When the user manually clicks a section, consider it active regardless of its position
    headingPositionMap.current.set(id, "active");

    // Consider all other sections as below to prevent them from being active until they enter the detection zone
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

    function detectActive() {
      // Active = the last heading in document order that is above or inside the detection zone.
      // The section stays active after the related heading exits upward, until another heading crosses the zone.
      let active: string | null = null;
      for (const id of ids) {
        const s = headingPositionMap.current.get(id);
        if (s === "above" || s === "active") active = id;
      }
      // Default to the first section if no heading has entered the detection zone yet
      setActiveId(active ?? ids[0]);
    }

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
        detectActive();
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

const FAQSidebar: React.FC<FAQSidebarProps> = ({
  sections,
  hiddenSectionIds,
}) => {
  const visibleSections = sections.filter((s) => !hiddenSectionIds.has(s.id));
  const ids = visibleSections.map((s) => s.id);
  const [activeId, setActiveId] = useActiveFAQSection(ids);

  if (sections.length === 0) return null;

  return (
    <nav className={styles.sidebar} aria-label="FAQ sections">
      <ul className={styles.list}>
        {visibleSections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              onClick={() => setActiveId(section.id)}
              className={clsx(styles.link, {
                [styles.linkActive]: activeId === section.id,
              })}
              aria-current={activeId === section.id ? "location" : undefined}
            >
              <Icon name={section.icon} size="md" className={styles.icon} />
              <span>{section.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default FAQSidebar;
