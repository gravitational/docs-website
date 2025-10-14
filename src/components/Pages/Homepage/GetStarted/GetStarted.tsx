import styles from "./GetStarted.module.css";

interface GetStartedStep {
  title: string;
  description: string;
  href: string;
}

interface GetStartedLink {
  title: string;
  description: string;
  href: string;
  iconComponent: any;
}

interface GetStartedProps {
  title: string;
  youtubeVideoId: string;
  steps?: GetStartedStep[];
  links?: GetStartedLink[];
}

const GetStarted: React.FC<GetStartedProps> = ({
  title = "Get Started",
  youtubeVideoId,
  steps = [],
  links = [],
}) => {
  const getEmbedYouTubeUrl = (videoId: string) => {
    return `https://www.youtube.com/embed/${videoId}`;
  };
  return (
    <section className={styles.getStarted}>
      <div className={styles.container}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.grid}>
          <div className={styles.steps}>
            {steps.map((step, i) => (
              <a key={i} href={step.href} className={styles.step}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
              </a>
            ))}
          </div>
          <div className={styles.video}>
            <iframe
              src={getEmbedYouTubeUrl(youtubeVideoId)}
              title={title}
              allowFullScreen
              className={styles.videoIframe}
              style={{ width: "100%", height: "100%", border: "none" }}
            ></iframe>
          </div>
          <div className={styles.links}>
            {links.map((link, i) => (
              <a href={link.href} key={i} className={styles.link}>
                <div className={styles.linkContent}>
                  <h3 className={styles.linkTitle}>{link.title}</h3>
                  <p className={styles.linkDescription}>{link.description}</p>
                  <link.iconComponent className={styles.linkIcon} />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GetStarted;
