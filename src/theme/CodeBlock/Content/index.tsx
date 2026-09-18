import React, {type ReactNode} from 'react';
import Content from '@theme-original/CodeBlock/Content';
import type ContentType from '@theme/CodeBlock/Content';
import type {WrapperProps} from '@docusaurus/types';
import styles from "./styles.module.css";

type Props = WrapperProps<typeof ContentType>;

export default function ContentWrapper(props: Props): ReactNode {
  return (
    <>
      <Content {...props} className={styles.wrapper} />
    </>
  );
}
