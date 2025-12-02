import OriginalMDXComponents from "@theme-original/MDXComponents";
import Tabs from "@theme/Tabs";
import TabItem from "@theme/TabItem";
import DocCardList from "@theme/DocCardList";
import Admonition from "@theme/Admonition";
import React, { type ComponentProps } from "react";
import Head from "@docusaurus/Head";
import { default as Code, CodeLine } from "@theme/MDXComponents/Code";
import MDXA from "@theme/MDXComponents/A";
import MDXPre from "@theme/MDXComponents/Pre";
import MDXDetails from "@theme/MDXComponents/Details";
import MDXHeading from "@theme/MDXComponents/Heading";
import MDXUl from "@theme/MDXComponents/Ul";
import MDXLi from "@theme/MDXComponents/Li";
import MDXImg from "@theme/MDXComponents/Img";
import Mermaid from "@theme/Mermaid";
import Command, { CommandLine, CommandComment } from "/src/components/Command";
import Snippet from "/src/components/Snippet";
import { Var } from "/src/components/Variables";
import type { MDXComponentsObject } from "@theme/MDXComponents";
import Icon from "/src/components/Icon";
import Tile from "/src/components/Tile";
import TileGrid from "/src/components/TileGrid";
import ThumbsFeedback from "/src/components/ThumbsFeedback";
import Checkpoint from "/src/components/Checkpoint";

const MDXComponents: MDXComponentsObject = {
  ...OriginalMDXComponents,
  Details: MDXDetails,
  DocCardList: DocCardList,
  Head,
  Icon,
  TabItem,
  Tabs,
  Tile,
  TileGrid,
  a: MDXA,
  Admonition,
  code: Code,
  codeline: CodeLine,
  command: Command,
  commandcomment: CommandComment,
  commandline: CommandLine,
  details: MDXDetails, // For MD mode support, see https://github.com/facebook/docusaurus/issues/9092#issuecomment-1602902274
  h1: (props: ComponentProps<"h1">) => <MDXHeading as="h1" {...props} />,
  h2: (props: ComponentProps<"h2">) => <MDXHeading as="h2" {...props} />,
  h3: (props: ComponentProps<"h3">) => <MDXHeading as="h3" {...props} />,
  h4: (props: ComponentProps<"h4">) => <MDXHeading as="h4" {...props} />,
  h5: (props: ComponentProps<"h5">) => <MDXHeading as="h5" {...props} />,
  h6: (props: ComponentProps<"h6">) => <MDXHeading as="h6" {...props} />,
  img: MDXImg,
  li: MDXLi,
  mermaid: Mermaid,
  pre: MDXPre,
  snippet: Snippet,
  ul: MDXUl,
  Var: (props) => <Var {...props} />, // needed to circumvent props mismatch in types
  ThumbsFeedback,
  Checkpoint,
};

export default MDXComponents;
