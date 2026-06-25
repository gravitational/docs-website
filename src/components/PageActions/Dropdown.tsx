import cn from "clsx";
import Icon, { IconName } from "../Icon";
import styles from "./Dropdown.module.css";
import { useEffect, useRef, useState } from "react";
import { Modal } from "../Modal";

export type DrodownItemProps = {
  label: string;
  type: "link" | "button" | "modal";
  href?: string;
  onClick?: () => void;
  icon?: IconName;
  resetModal?: boolean;
  // used only if type is modal: the content to show in the modal
  content?: React.ReactNode;
  // any other props depending on the type (e.g., target for links)
  [key: string]: any;
};

const DropdownItem: React.FC<DrodownItemProps> = ({
  label,
  type,
  href,
  onClick,
  icon,
  content,
  resetModal,
  ...rest
}) => {
  const [modalActive, setModalActive] = useState<boolean>(false);
  if (!label) throw new Error("Dropdown item must have a label");

  useEffect(() => {
    setModalActive(false);
  }, [resetModal]);

  return (
    <div className={styles.dropdownItem}>
      {icon && (
        <Icon name={icon} size="sm" className={styles.dropdownItemIcon} />
      )}
      {type === "link" ? (
        <a
          className={styles.dropdownButton}
          href={href}
          onClick={() => {
            if (onClick) onClick();
          }}
          {...rest}
        >
          {label}
        </a>
      ) : (
        <button
          className={styles.dropdownButton}
          onClick={(e) => {
            if (type === "button" && onClick) {
              onClick();
            } else if (type === "modal") {
              e.stopPropagation();
              setModalActive(true);
            }
          }}
          {...rest}
        >
          {label}
        </button>
      )}
      {type === "modal" && content && modalActive && (
        <Modal className={styles.modal} onClose={() => setModalActive(false)}>
          {content}
        </Modal>
      )}
    </div>
  );
};

const Dropdown: React.FC<{
  icon: IconName;
  text: string;
  items: DrodownItemProps[];
}> = ({ icon, text, items }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  if (!items?.length || !text) {
    // Don't render the dropdown if there are no items
    // or if the dropdown button text is missing.
    return null;
  }

  if (items.length === 1) {
    return <DropdownItem {...items[0]} />;
  }

  return (
    <div
      ref={dropdownRef}
      className={cn(styles.dropdown, { [styles.dropdownOpen]: isOpen })}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => {
        // Keep a possible modal open if the mouse leaves the viewport
        if (dropdownRef.current?.querySelector(`.${styles.modal}`)) return;
        setIsOpen(false);
      }}
    >
      <button className={styles.dropdownButton}>
        {icon && <Icon name={icon} size="sm" />}
        {text}
        <Icon className={styles.caretUp} name="caretUp" size="sm" />
      </button>
      <ul className={styles.dropdownMenu} data-testid="dropdown-menu">
        {items.map((item, index) => (
          <DropdownItem key={index} {...item} />
        ))}
      </ul>
    </div>
  );
};

export default Dropdown;
export { DropdownItem };
