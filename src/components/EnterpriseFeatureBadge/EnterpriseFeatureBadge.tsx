import { ReactNode, useEffect, useRef, useState } from "react";
import Icon from "../Icon";
import styles from "./EnterpriseFeatureBadge.module.css";
import cn from "classnames";
import Button from "../Button";
import { trackEvent } from "@site/src/utils/analytics";

interface EnterpriseFeatureBadgeProps {
  children: ReactNode;
  message?: string;
  emitEvent?: (name: string, params: any) => {};
}

const EnterpriseFeatureBadge: React.FC<
  Pick<EnterpriseFeatureBadgeProps, "message" | "emitEvent">
> = ({
  message = "This is only available in Teleport Enterprise. Don't have an account?",
  emitEvent,
}) => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [translateX, setTranslateX] = useState<number>(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const translateXRef = useRef(translateX);
  const badgeRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showModal = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setModalVisible(true);
  };

  const hideModal = () => {
    if (isPinned) return;
    hideTimeoutRef.current = setTimeout(() => {
      setModalVisible(false);
    }, 100);
  };

  const handleBadgeClick = () => {
    setIsPinned(true);
    setModalVisible(true);
  };

  useEffect(() => {
    if (!modalVisible || !modalRef.current) {
      setTranslateX(0);
      modalRef.current.style.transform = `translate(-16px, 100%)`;
      return;
    }

    if (modalVisible) {
      modalRef.current.style.top = `calc(${
        badgeRef.current?.getBoundingClientRect().top || 0
      }px - var(--ifm-navbar-height) - 24px)`;
    }

    const repositionModal = () => {
      const modalRect = modalRef.current.getBoundingClientRect();
      const bodyRect = document.body.getBoundingClientRect();

      if (modalRect.right + 16 > bodyRect.right) {
        const newTranslateX =
          translateXRef.current - (modalRect.right - bodyRect.right) - 48;
        setTranslateX(newTranslateX);
        modalRef.current.style.transform = `translate(${newTranslateX}px, 100%)`;
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        !badgeRef.current.contains(event.target as Node)
      ) {
        setIsPinned(false);
        setModalVisible(false);
      }
    };

    repositionModal();
    window.addEventListener("resize", repositionModal);
    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("resize", repositionModal);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalVisible]);

  return (
    <div
      className={styles.enterpriseFeatureBadge}
      role="button"
      ref={badgeRef}
      onClick={handleBadgeClick}
      onMouseEnter={showModal}
      onMouseLeave={hideModal}
    >
      <Icon size="xs" name="rocketLaunch" />
      Enterprise feature
      <div
        ref={modalRef}
        className={cn(styles.modal, {
          [styles.modalVisible]: !!modalVisible,
        })}
      >
        <p className={styles.modalTitle}>Teleport Enterprise feature</p>
        <p className={styles.modalMessage}>{message}</p>
        <div className={styles.modalActions}>
          <Button
            as="link"
            href="https://goteleport.com/signup/"
            className={styles.upsellLink}
            onClick={() =>
              trackEvent({
                event_name: "docs_enterprise_link",
                emitEvent,
              })
            }
          >
            Start free trial
          </Button>
          <Button
            variant="secondary"
            as="link"
            href="https://goteleport.com/contact-sales/"
            className={styles.upsellLink}
          >
            Contact sales
          </Button>
        </div>
      </div>
    </div>
  );
};

const EnterpriseFeatureBadgeWrapper: React.FC<EnterpriseFeatureBadgeProps> = ({
  message,
  emitEvent,
  children,
}) => {
  const childArray = Array.isArray(children) ? children : [children];

  if (childArray.length !== 1) {
    return <>{children}</>;
  }

  const child = childArray[0];

  if (
    typeof child === "object" &&
    child !== null &&
    "type" in child &&
    (/^h[1-6]$/.test(child.type.name) || /^h[1-6]$/.test(child.type))
  ) {
    const headingProps = child.props || {};
    const headingChildren = headingProps.children;

    return {
      ...child,
      props: {
        ...headingProps,
        children: (
          <>
            {headingChildren}
            <EnterpriseFeatureBadge message={message} emitEvent={emitEvent} />
          </>
        ),
      },
    };
  }

  return <>{children}</>;
};

export default EnterpriseFeatureBadgeWrapper;
