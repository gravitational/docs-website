import {
  Children,
  cloneElement,
  isValidElement,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import cn from "classnames";
import styles from "./GuidedSteps.module.css";
import {
  GuidedStepsProps,
  GuidedStepsProvider,
  sanitizeGuidedStepsChildren,
  useStepsRef,
} from "./utils";
import GuidedStepTab from "./GuidedStepTab";

const GuidedStepTabs: React.FC = () => {

}

const GuidedStepsComponent: React.FC<GuidedStepsProps> = (props) => {
  const steps = useGuidedSteps();
  return (
    <div className={styles.guidedSteps}>
      <GuidedStepTabs {...steps} {...props} />
      <GuidedStepTab  {...steps} {...props} />
    </div>
  );
};

const GuidedSteps: React.FC<GuidedStepsProps> = ({ children }) => {
  return (
    <GuidedStepsProvider>
      <GuidedStepsComponent>
        {sanitizeGuidedStepsChildren(children)}
      </GuidedStepsComponent>
    </GuidedStepsProvider>
  );
};

export default GuidedSteps;

// <GuidedSteps
//     instructions={[
//         {
//             id="install-selinux-tools",
//             title: "Install SELinux Policy Development Tools",
//             description: "This step installs the necessary development tools for SELinux policy management.",
//         },
//         {
//             id: "configure-teleport",
//             title: "Configure Teleport",
//             description: "This step configures Teleport to use the new SELinux policy.",
//         },
//         {
//             id: "enable-teleport",
//             title: "Enable Teleport",
//             description: "This step enables the Teleport service.",
//         }
//     ]}
// >
//     <Step>
//         ```
//         $ sudo dnf install selinux-policy-devel
//         ```
//     </Step>
//     <Step>
//         ```
//         $ sudo teleport configure -o file
//         ```
//     </Step>
//     <Step>
//         ```
//         $ sudo systemctl enable teleport
//         ```
//     </Step>
// </GuidedSteps>
