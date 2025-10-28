import React, { type ReactNode } from "react";
import Tabs from "@theme-original/Tabs";
import type TabsType from "@theme/Tabs";
import type { WrapperProps } from "@docusaurus/types";

type Props = WrapperProps<typeof TabsType>;

export default function TabsWrapper(props: Props): ReactNode {
  const { children } = props;

  // Automatically assign the value prop of each TabItem. Legacy TabItem
  // components that predate the migration to Docusaurus do not include a
  // value property, and there is not currently a reason to expose this to
  // docs authors.
  //
  // The Tabs component checks TabItems for the value property, so we need to
  // assign it here rather than in TabItem.
  const tabItems = React.Children.toArray(children).map((child, idx) => {
    if (typeof child.props != "object" || !("label" in child.props)) {
      return child;
    }

    const value = child.props.label.toLowerCase().trim().replace(" ", "-");

    // The props object cannot have new properties assigned to it, so we need
    // to return a new object.
    return {
      ...child,
      props: {
        ...child.props,
        value: value,
      },
    };
  });

  // Sort tab items by label so the synchronized tab selection also, ideally,
  // selects the same tab index.
  tabItems.sort((a, b) => {
    if (a.label < b.label) {
      return -1;
    } else if (a.label > b.label) {
      return 1;
    } else {
      return 0;
    }
  });

  const newProps = {
    children: tabItems,
  };

  // Use a fixed groupId to allow synchronization between all Tabs instances in
  // the docs, as long as they share at least one TabItem with the same value.
  const tabProps = { ...newProps, groupId: "tabs" };
  return (
    <>
      <Tabs {...tabProps} />
    </>
  );
}
