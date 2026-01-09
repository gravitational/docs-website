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
  return (
    <Link className={styles.inlineCTA} {...rest}>
      <img src={images[imageName]} alt="" width={140} height={40} />
      {children}
    </Link>
  );
};

export default InlineCTA;
export { InlineCTAProps };
