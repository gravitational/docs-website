import Link from "@docusaurus/Link";
import cn from "classnames";
import styles from "./DocHero.module.css";
import YouTubeEmbed from "@site/src/components/YouTubeEmbed";

interface GetStartedLink {
  title: string;
  description: string;
  href: string;
  icon?: any;
}

interface CtaLink {
  title: string;
  href: string;
  variant?: "primary" | "secondary";
  arrow?: boolean;
}

interface DocHeroProps {
  title: string;
  image?: any;
  youtubeVideoId?: string;
  links?: GetStartedLink[];
  linksDesktopColumnCount?: number;
  ctaLinks?: CtaLink[];
  children?: React.ReactNode;
}

const DocHero: React.FC<DocHeroProps> = ({
  title,
  image,
  youtubeVideoId,
  links = [],
  ctaLinks = [],
  linksDesktopColumnCount = 2,
  children,
}) => {
  return (
    <section className={styles.docHero}>
      <div className={styles.container}>
        <div className={styles.main}>
          <div className={styles.content}>
            <h2 className={styles.title}>{title}</h2>
            <div className={styles.description}>{children}</div>
            {ctaLinks.length > 0 && (
              <div className={styles.ctaLinks}>
                {ctaLinks.map((link, i) => (
                  <Link
                    key={i}
                    to={link.href}
                    className={cn(styles.ctaLink, {
                      [styles.secondary]: link.variant === "secondary",
                      [styles.arrow]: link.arrow,
                    })}
                  >
                    {link.title}
                  </Link>
                ))}
              </div>
            )}
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
              <YouTubeEmbed
                videoId={youtubeVideoId}
                title={title}
                className={styles.video}
              />
            )}
          </div>
        </div>
        {links.length > 0 && (
          <div
            className={styles.links}
            style={
              {
                "--desktop-column-count": linksDesktopColumnCount,
              } as React.CSSProperties
            }
          >
            {links.map((link, i) => (
              <a href={link.href} key={i} className={styles.link}>
                <div className={styles.linkContent}>
                  <h4 className={styles.linkTitle}>{link.title}</h4>
                  <p className={styles.linkDescription}>{link.description}</p>
                  {link.icon && <link.icon className={styles.linkIcon} />}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default DocHero;
