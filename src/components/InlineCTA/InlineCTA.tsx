import Link, { Props as LinkProps } from "@docusaurus/Link";
import * as images from "./images";
import styles from "./InlineCTA.module.css";

interface InlineCTAProps extends LinkProps {
  imageName: keyof typeof images;
  children: React.ReactNode;
}

const InlineCTA: React.FC<InlineCTAProps> = ({
  imageName,
  children,
  ...rest
}) => {
  const InlineSVG = images[imageName];
  return (
    <Link className={styles.inlineCTA} {...rest}>
      <InlineSVG />
      {children}
    </Link>
  );
};

export default InlineCTA;
export { InlineCTAProps };
