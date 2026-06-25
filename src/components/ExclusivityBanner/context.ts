// This file defines the context for the ExclusivityBanner component, which
// provides information about exclusive features and available agent skills related to a page.

import { SkillInfo } from "@site/scripts/prepare-files.mjs";
import { createContext } from "react";

interface ExclusivityContextType {
  exclusiveFeature?: string;
  skillsForPage?: SkillInfo[];
}

const ExclusivityContext = createContext<ExclusivityContextType | null>(null);

export default ExclusivityContext;
