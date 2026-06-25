// A generic modal component that can be used for various purposes (e.g., confirmation dialogs, forms, etc.)

import { useEffect, useRef } from "react";
import cn from "clsx";
import styles from "./Modal.module.css";
import Icon from "../Icon";

const Modal: React.FC<{
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}> = ({ children, onClose, className }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose?.();
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div className={cn(styles.modal, className)}>
      <div className={styles.background} />
      <div className={styles.content} ref={modalRef}>
        <div className={styles.inner}>
          <button className={styles.closeButton} onClick={onClose}>
            <Icon name="x" size="sm" />
          </button>
          <div className={styles.children}>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
