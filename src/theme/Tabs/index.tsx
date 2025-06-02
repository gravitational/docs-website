import React, { type ReactNode } from "react";
import Tabs from "@theme-original/Tabs";
import type TabsType from "@theme/Tabs";
import type { WrapperProps } from "@docusaurus/types";
import { useId } from "react";

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
  const newProps = {
    children: React.Children.toArray(children).map((child) => {
      if (typeof child.props != "object" || !("label" in child.props)) {
        return child;
      }

      // The props object cannot have new properties assigned to it, so we need
      // to return a new object.
      return {
        ...child,
        props: {
          ...child.props,
          value: useId(),
        },
      };
    }),
  };

  return (
    <>
      <Tabs {...newProps} />
    </>
  );
}
