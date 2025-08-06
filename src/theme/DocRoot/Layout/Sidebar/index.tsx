// Manually swizzled to allow theming 
// See https://docusaurus.io/docs/swizzling
// This is wrapped, not ejected
import React, {type ReactNode} from 'react';
import Sidebar from '@theme-original/DocRoot/Layout/Sidebar';
import type SidebarType from '@theme/DocRoot/Layout/Sidebar';
import type {WrapperProps} from '@docusaurus/types';
import './styles.module.css';

type Props = WrapperProps<typeof SidebarType>;

export default function SidebarWrapper(props: Props): ReactNode {
  return (
    <>
      <Sidebar {...props} />
    </>
  );
}
