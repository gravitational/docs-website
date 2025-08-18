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
  youtubeVideoUrl?: string;
  icon?: any;
  links?: GetStartedLink[];
  children?: React.ReactNode;
}

const LandingHero: React.FC<LandingHeroProps> = ({
  title,
  image,
  youtubeVideoUrl,
  icon,
  links = [],
  children,
}) => {
  const Icon = icon;

  const getEmbedYouTubeUrl = (url: string) => {
    const videoId = url.split("v=")[1];
    return `https://www.youtube.com/embed/${videoId}`;
  };
  return (
    <section className={styles.landingHero}>
      <div className={styles.container}>
        <div className={styles.main}>
          <div className={styles.content}>
            {icon && (
              <div className={styles.icon}>
                <Icon />
              </div>
            )}
            <h1 className={styles.title}>{title}</h1>
            <div className={styles.description}>{children}</div>
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
