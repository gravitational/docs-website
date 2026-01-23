import React, { type ComponentProps, type ReactNode } from "react";
import { useThemeConfig } from "@docusaurus/theme-common";
import { useNavbarSecondaryMenu } from "@docusaurus/theme-common/internal";
import Translate from "@docusaurus/Translate";
import cn from "classnames";
import styles from "./styles.module.css";

function SecondaryMenuBackButton(props: ComponentProps<"button">) {
  return (
    <button
      {...props}
      type="button"
      className={cn("clean-btn", "navbar-sidebar__back", styles.backButton)}
    >
      <span>
        <Translate
          id="theme.navbar.mobileSidebarSecondaryMenu.backButtonLabel"
          description="The label of the back button to return to main menu, inside the mobile navbar sidebar secondary menu (notably used to display the docs sidebar)"
        >
          Back to main menu
        </Translate>
      </span>
    </button>
  );
}

// The secondary menu slides from the right and shows contextual information
// such as the docs sidebar
export default function NavbarMobileSidebarSecondaryMenu(): ReactNode {
  console.log(useThemeConfig().navbar);
  const isPrimaryMenuEmpty = useThemeConfig().navbar.items.length === 0;
  const secondaryMenu = useNavbarSecondaryMenu();
  return (
    <>
      {/* edge-case: prevent returning to the primaryMenu when it's empty */}
      {!isPrimaryMenuEmpty && (
        <SecondaryMenuBackButton onClick={() => secondaryMenu.hide()} />
      )}
      {secondaryMenu.content}
    </>
  );
}
