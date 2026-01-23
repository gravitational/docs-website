// Manually swizzled to allow theming 
// See https://docusaurus.io/docs/swizzling
// This is wrapped, not ejected
import React, {type ReactNode} from 'react';
import Main from '@theme-original/DocRoot/Layout/Main';
import type MainType from '@theme/DocRoot/Layout/Main';
import type {WrapperProps} from '@docusaurus/types';
import './styles.module.css';

type Props = WrapperProps<typeof MainType>;

export default function MainWrapper(props: Props): ReactNode {
  return (
    <>
      <Main {...props} />
    </>
  );
}
