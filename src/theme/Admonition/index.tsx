import React, { type ReactNode } from "react";
import Admonition from "@theme-original/Admonition";
import type AdmonitionType from "@theme/Admonition";
import type { WrapperProps } from "@docusaurus/types";
import AdmonitionTypes from "@theme/Admonition/Types";

type Props = WrapperProps<typeof AdmonitionType>;
const allTypes = Object.keys(AdmonitionTypes).join(", ");

export default function AdmonitionWrapper(props: Props): ReactNode {
  if (!AdmonitionTypes.hasOwnProperty(props.type)) {
    throw new Error(
      `unexpected Admonition type: ${props.type} - available types are ${allTypes}`,
    );
  }
  return (
    <>
      <Admonition {...props} />
    </>
  );
}
