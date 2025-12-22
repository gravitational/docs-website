import { createContext } from "react";

interface ExclusivityContextType {
  exclusiveFeature?: string | boolean;
}

const ExclusivityContext = createContext<ExclusivityContextType | null>(null);

export default ExclusivityContext;
