import { createContext } from "react";

interface ExclusivityContextType {
  exclusiveFeature?: string;
}

const ExclusivityContext = createContext<ExclusivityContextType | null>(null);

export default ExclusivityContext;
