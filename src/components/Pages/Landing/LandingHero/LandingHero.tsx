import Link from "@docusaurus/Link";
import ExclusivityContext from "@site/src/components/ExclusivityBanner/context";
import Icon from "@site/src/components/Icon";
import { useContext } from "react";
import styles from "./LandingHero.module.css";
import { trackEvent } from "@site/src/utils/analytics";

interface GetStartedLink {
  title: string;
  description: string;
  href: string;
  icon: any;
}

interface LandingHeroProps {
  title: string;
  image?: any;
  youtubeVideoId?: string;
  linksTitle?: string;
  linksColumnCount?: number;
  links?: GetStartedLink[];
  emitEvent?: (name: string, params: any) => {};
  children?: React.ReactNode;
}

const LandingHero: React.FC<LandingHeroProps> = ({
  title,
  image,
  youtubeVideoId,
  linksTitle,
  linksColumnCount = 2,
  links = [],
  emitEvent,
  children,
}) => {
  const { exclusiveFeature } = useContext(ExclusivityContext);
  const getEmbedYouTubeUrl = (videoId: string) => {
    return `https://www.youtube.com/embed/${videoId}`;
  };
  return (
    <section className={styles.landingHero}>
      <div className={styles.container}>
        <div className={styles.mainWrapper}>
          {exclusiveFeature && (
            <div className={styles.exclusivityBanner}>
              <Icon size="sm-md" name="rocketLaunch" />
              <p>
                {exclusiveFeature} is available only with Teleport Enterprise.{" "}
                <a
                  href="https://goteleport.com/signup/"
                  target="_blank"
                  onClick={() =>
                    trackEvent({
                      event_name: "docs_enterprise_link",
                      emitEvent,
                    })
                  }
                >
                  Start your free trial.
                </a>
              </p>
            </div>
          )}
          <div className={styles.main}>
            <div className={styles.content}>
              <h1 className={styles.title}>{title}</h1>
              <div className={styles.description}>{children}</div>
            </div>
            <div className={styles.media}>
              {image && !youtubeVideoId && (
                <img
                  className={styles.image}
                  src={image}
                  alt={title}
                  width={400}
                  height={225}
                />
              )}
              {youtubeVideoId && (
                <iframe
                  className={styles.video}
                  width={400}
                  height={225}
                  src={getEmbedYouTubeUrl(youtubeVideoId)}
                  title={title}
                  frameBorder="0"
                  allowFullScreen
                ></iframe>
              )}
            </div>
          </div>
        </div>
        {linksTitle && links.length > 0 && (
          <h2 className={styles.linksTitle}>{linksTitle}</h2>
        )}
        {links.length > 0 && (
          <div
            className={styles.links}
            style={
              {
                "--desktop-column-count": linksColumnCount,
              } as React.CSSProperties
            }
          >
            {links.map((link, i) => (
              <Link to={link.href} key={i} className={styles.link}>
                <div className={styles.linkContent}>
                  <h3 className={styles.linkTitle}>{link.title}</h3>
                  <p className={styles.linkDescription}>{link.description}</p>
                  <link.icon className={styles.linkIcon} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default LandingHero;
