import { useEffect, useRef } from "react";
import styles from "./LandingHero.module.css";

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
  children?: React.ReactNode;
}

const LandingHero: React.FC<LandingHeroProps> = ({
  title,
  image,
  youtubeVideoId,
  linksTitle,
  linksColumnCount = 2,
  links = [],
  children,
}) => {
  const getEmbedYouTubeUrl = (videoId: string) => {
    return `https://www.youtube.com/embed/${videoId}`;
  };
  return (
    <section className={styles.landingHero}>
      <div className={styles.container}>
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
              <a href={link.href} key={i} className={styles.link}>
                <div className={styles.linkContent}>
                  <h3 className={styles.linkTitle}>{link.title}</h3>
                  <p className={styles.linkDescription}>{link.description}</p>
                  <link.icon className={styles.linkIcon} />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default LandingHero;
