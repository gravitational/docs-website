import { useEffect, useRef } from "react";
import styles from "./DocHero.module.css";

interface GetStartedLink {
  title: string;
  description: string;
  href: string;
  icon?: any;
}

interface DocHeroProps {
  title: string;
  image?: any;
  youtubeVideoUrl?: string;
  links?: GetStartedLink[];
  children?: React.ReactNode;
}

const DocHero: React.FC<DocHeroProps> = ({
  title,
  image,
  youtubeVideoUrl,
  links = [],
  children,
}) => {
  const mdRef = useRef<HTMLDivElement>(null);
  const getEmbedYouTubeUrl = (url: string) => {
    const videoId = url.split("v=")[1];
    return `https://www.youtube.com/embed/${videoId}`;
  };

  useEffect(() => {
    if (mdRef.current) {
      const anchors = mdRef.current.querySelectorAll("a");
      anchors.forEach((anchor) => {
        const parent = anchor.parentElement;
        if (
          parent &&
          parent.childNodes.length === 1 &&
          parent.firstChild === anchor
        ) {
          anchor.classList.add(styles.buttonLink);
        }
      });
    }
  }, []);

  return (
    <section className={styles.docHero}>
      <div className={styles.container}>
        <div className={styles.main}>
          <div className={styles.content}>
            <h2 className={styles.title}>{title}</h2>
            <div className={styles.description} ref={mdRef}>
              {children}
            </div>
          </div>
          <div className={styles.media}>
            {image && !youtubeVideoUrl && (
              <img
                className={styles.image}
                src={image}
                alt={title}
                width={400}
                height={225}
              />
            )}
            {youtubeVideoUrl && (
              <iframe
                className={styles.video}
                width={400}
                height={225}
                src={getEmbedYouTubeUrl(youtubeVideoUrl)}
                title={title}
                frameBorder="0"
                allowFullScreen
              ></iframe>
            )}
          </div>
        </div>
        {links.length > 0 && (
          <div className={styles.links}>
            {links.map((link, i) => (
              <a href={link.href} key={i} className={styles.link}>
                <div className={styles.linkContent}>
                  <h3 className={styles.linkTitle}>{link.title}</h3>
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
