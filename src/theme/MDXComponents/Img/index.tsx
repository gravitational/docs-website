import cn from "classnames";
import { React, useEffect, useState, useCallback, useRef } from "react";
import clsx from "clsx";
import type { Props } from "@theme/MDXComponents/Img";

import styles from "./styles.module.css";

function useClickInside(ref, handler) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (ref.current) {
        handler(e);
      }
    };
    document.addEventListener("mousedown", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
    };
  }, [ref, handler]);
}

function useEscape(handler) {
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handler(e);
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
    };
  }, [handler]);
}

function useDisableBodyScroll(shouldDisable) {
  useEffect(() => {
    if (shouldDisable) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [shouldDisable]);
}

function transformImgClassName(className?: string): string {
  return clsx(className, styles.img);
}

//** Maximum width of content block where images are placed.
/* If the original image is smaller, then there is no sense to expand the image by clicking. */
const MAX_CONTENT_WIDTH = 900;

type ModalImageProps = {
  setShowExpandedImage: Dispatch<SetStateAction<boolean>>;
} & ImageProps;

const ModalImage = ({ setShowExpandedImage, ...props }: ModalImageProps) => {
  const closeHandler = useCallback(
    () => setShowExpandedImage(false),
    [setShowExpandedImage],
  );
  const modalRef = useRef<HTMLDivElement>();
  useClickInside(modalRef, closeHandler);
  useEscape(closeHandler);

  return (
    <div ref={modalRef}>
      <div className={styles.overlay} />
      <div className={styles.dialog}>
        <img
          decoding="async"
          loading="lazy"
          {...props}
          className={transformImgClassName(props.className)}
        />
      </div>
    </div>
  );
};

export default function MDXImg(props: Props): JSX.Element {
  const [showExpandedImage, setShowExpandedImage] = useState(false);
  const shouldExpand = props.width > MAX_CONTENT_WIDTH;
  useDisableBodyScroll(showExpandedImage);
  const handleClickImage = () => {
    if (shouldExpand) {
      setShowExpandedImage(true);
    }
  };
  const PlainImage = () => {
    if (shouldExpand) {
      return (
        <button onClick={handleClickImage} className={styles.zoomable}>
          <img
            decoding="async"
            loading="lazy"
            {...props}
            className={transformImgClassName(props.className)}
          />
        </button>
      );
    } else
      return (
        <img
          decoding="async"
          loading="lazy"
          {...props}
          className={transformImgClassName(props.className)}
        />
      );
  };

  return (
    <>
      <span className={cn(styles.wrapper)}>
        <PlainImage />
      </span>
      {showExpandedImage && (
        <ModalImage setShowExpandedImage={setShowExpandedImage} {...props} />
      )}
    </>
  );
}
