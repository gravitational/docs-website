import { useEffect, useState } from "react";

import { getParsedDate } from "../../utils/date";

import CalendarTrans from "./assets/calendar-trans.svg";
import ArrowRight from "./assets/arrow-right.svg";
import MapPin from "./assets/map-pin.svg";
import VirtualIcon from "./assets/video-meeting.svg";
import styles from "./EventBanner.module.css";

export type BannerData = {
  bannerText?: string;
  bannerType?: "event" | "custom";
  featuredEvent?: {
    title: string;
    description: string;
    end?: string;
    isVirtual?: boolean;
    start: string;
    link: string;
    location?: string;
    cardBackground?: { url: string };
  };
  ctaText?: string;
  link?: string;
  firstButton?: { title: string; link?: string };
  secondButton?: { title: string; link?: string };
  expiredText?: string;
  expiredLink?: string;
  expiredCTAText?: string;
};

// Check whether to use default view or not (Default = Expired fields)
const showDefault = (event?: BannerData) => {
  if (!event || (!event.featuredEvent?.title && !event?.bannerText))
    return true;
  const currentDate = new Date();
  const endDate = event.featuredEvent?.end
    ? new Date(event.featuredEvent.end)
    : null;

  if (endDate && currentDate > endDate) {
    //Event end date has gone
    return true;
  }
  return false; //No end date set or end date is in the future
};

export const EventBanner: React.FC<{
  initialEvent: BannerData;
}> = ({ initialEvent }) => {
  const [event, setEvent] = useState<BannerData>(initialEvent);
  const defaultView = showDefault(initialEvent);

  const { firstButton, secondButton } = event;
  return (
    <div className={styles.banner}>
      <a
        className={styles.linkWrapper}
        href={
          defaultView
            ? event.expiredLink
            : event.featuredEvent?.link || event.link
        }
      >
        <div className={styles.mainText}>
          {" "}
          {defaultView
            ? event?.expiredText
            : event?.featuredEvent?.title || event?.bannerText}
        </div>
        {(event?.featuredEvent?.start || event?.featuredEvent?.location) && (
          <div className={styles.container}>
            {event?.featuredEvent?.start && (
              <div className={styles.styledBox}>
                <div className={styles.icon}>
                  <CalendarTrans />
                </div>
                <div className={styles.styledText}>
                  {getParsedDate(new Date(event?.featuredEvent.start), "MMM d")}
                  {event.featuredEvent?.end != null &&
                    "-" + getParsedDate(new Date(event.featuredEvent.end), "d")}
                </div>
              </div>
            )}
            {event.bannerType !== "custom" &&
              (event?.featuredEvent?.location ||
                event?.featuredEvent?.isVirtual) && (
                <div className={styles.styledBox}>
                  <div className={styles.icon}>
                    {event?.featuredEvent?.location === "Virtual" ||
                    event.featuredEvent?.isVirtual ? (
                      <VirtualIcon viewBox="0 0 16 16" />
                    ) : (
                      <MapPin />
                    )}
                  </div>
                  <div className={styles.styledtext}>
                    {event?.featuredEvent?.location ||
                      (event?.featuredEvent?.isVirtual && "Virtual")}
                  </div>
                </div>
              )}
          </div>
        )}
        <div className={styles.ctaWrapper}>
          <div className={styles.linkButton}>
            {defaultView ? event.expiredCTAText : event?.ctaText}
          </div>
          <div className={styles.icon}>
            <ArrowRight />
          </div>
        </div>
      </a>
      {(firstButton || secondButton) && (
        <div className={styles.sideButtonBox}>
          {firstButton && firstButton.link&& (
            <div className={styles.linkButton}>
              <a href={firstButton.link || ""}>
                {firstButton.title}
              </a>
              <div className={styles.icon}>
                <ArrowRight />
              </div>
            </div>
          )}
          {secondButton && secondButton.link && (
            <div className={styles.linkButton}>
              <a href={secondButton.link|| ""}>
                {secondButton.title}
              </a>
              <div className={styles.icon}>
                <ArrowRight />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
