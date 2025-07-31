import React, { useState, useRef, useEffect } from 'react';
import { 
  useVersions, 
  useActivePlugin, 
  useDocsPreferredVersion, 
  useActiveDocContext,
  useDocsVersionCandidates
} from '@docusaurus/plugin-content-docs/client';
import { useHistory, useLocation } from '@docusaurus/router';
import clsx from 'clsx';
import styles from './VersionPicker.module.css';
import Icon from '../../../Icon';

interface VersionPickerProps {
  className?: string;
}

export function VersionPicker({ className = '' }: VersionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const activePlugin = useActivePlugin();
  const { savePreferredVersionName } = useDocsPreferredVersion(activePlugin?.pluginId);
  const versions = useVersions(activePlugin?.pluginId);
  const versionCandidates = useDocsVersionCandidates(activePlugin?.pluginId);
  const activeDocContext = useActiveDocContext(activePlugin?.pluginId);
  const history = useHistory();
  const location = useLocation();
  
  // Get the current active version
  const currentVersion = versionCandidates?.[0] || null;
  
  // Helper function to get the main document for a version
  const getVersionMainDoc = (version: any) => {
    return version.mainDoc;
  };
  
  // Helper function to get the target document for a version
  const getVersionTargetDoc = (version: any) => {
    // Try to find the same document in the target version
    if (activeDocContext?.activeDoc && activeDocContext?.alternateDocVersions) {
      const targetDoc = activeDocContext.alternateDocVersions[version.name];
      if (targetDoc) {
        return targetDoc;
      }
    }
    // Fallback to the version's main document
    return getVersionMainDoc(version);
  };


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleVersionSelect = (version: any) => {
    // Save the preferred version
    savePreferredVersionName(version.name);
    
    // Get the target document for this version
    const targetDoc = getVersionTargetDoc(version);
    
    // Navigate to the target document, preserving search params and hash
    if (targetDoc) {
      const targetPath = `${targetDoc.path}${location.search}${location.hash}`;
      history.push(targetPath);
    }
    
    setIsOpen(false);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div ref={dropdownRef} className={clsx(styles.dropdown, className)}>
      <button
        className={styles.button}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Version {currentVersion?.label || ''}
        <Icon name="arrow" size="sm" inline className={styles.arrow} />
      </button>
      
      {isOpen && (
        <ul className={styles.menu}>
          {versions && versions.length > 0 ? (
            versions.map((version) => (
              <li key={version.name}>
                <button
                  className={clsx(
                    styles.menuItem,
                    version.name === currentVersion?.name && styles.active
                  )}
                  onClick={() => handleVersionSelect(version)}
                >
                  {version.label}
                </button>
              </li>
            ))
          ) : (
            <li>
              <div className={styles.noVersions}>No versions available</div>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}