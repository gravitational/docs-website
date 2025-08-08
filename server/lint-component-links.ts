import { lintRule } from "unified-lint-rule";
import { visit } from "unist-util-visit";
import type { MdxAnyElement } from "./types-unist";
import type { Node } from "unist";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const COMPONENTS_TO_CHECK = [
  "Products",
];

const PATHS_TO_CHECK = [
  '/includes/homepage/',
];

const mdxNodeTypes = new Set(["mdxJsxFlowElement", "mdxJsxTextElement"]);

/**
 * Gets the default version from config.json
 * @returns The version marked with "isDefault": true, or "17.x" as fallback
 */
const getDefaultVersion = (): string => {
  try {
    const configPath = join(process.cwd(), 'config.json');
    const configContent = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);
    
    const defaultVersion = config.versions?.find((v: any) => v.isDefault)?.name;
    return defaultVersion || '17.x';
  } catch (error) {
    // Fallback if config.json can't be read
    return '17.x';
  }
};

const isMdxComponent = (node: Node): node is MdxAnyElement => {
  return mdxNodeTypes.has(node.type) && 
         COMPONENTS_TO_CHECK.includes((node as MdxAnyElement).name);
};

const extractHrefsFromNode = (node: MdxAnyElement): string[] => {
  const hrefs: string[] = [];
  
  /**
   * Recursively traverses a JSX component's data structure to find href attributes.
   * 
   * This function handles nested objects like:
   * productCategories=[{
   *   features: [{
   *     href: "./enroll-resources/"
   *   }]
   * }]
   * 
   * @param obj - The current object/value being examined (could be string, object, array, etc.)
   * 
   * Process:
   * 1. If obj is a string containing './', search for href patterns using regex
   * 2. If obj is an object/array, recursively check all its values
   * 3. Extract href values and add them to the hrefs array
   * 
   * Regex pattern: href:\s*['"`]([^'"`]+)['"`]
   * - href:        - Matches literal "href:"
   * - \s*          - Matches zero or more whitespace characters
   * - ['"`]        - Matches single quote, double quote, or backtick
   * - ([^'"`]+)    - Captures the URL (everything except quotes)
   * - ['"`]        - Matches closing quote
   */
  const traverse = (obj: any) => {
    if (typeof obj === 'string' && obj.includes('./')) {
      // Find all href patterns in this string
      const hrefMatches = obj.match(/href:\s*['"`]([^'"`]+)['"`]/g) || [];
      hrefMatches.forEach(match => {
        // Extract just the URL part (group 1 from the regex)
        const href = match.match(/href:\s*['"`]([^'"`]+)['"`]/);
        if (href) hrefs.push(href[1]); // href[1] is the captured URL
      });
    } else if (typeof obj === 'object' && obj !== null) {
      // Recursively check all properties/elements of this object/array
      Object.values(obj).forEach(traverse);
    }
  };
  
  traverse(node);
  return hrefs;
};

const resolveRelativePath = (href: string, filePath: string): string => {
  const versionMatch = filePath.match(/content\/([^\/]+)\//);
  const version = versionMatch ? versionMatch[1] : getDefaultVersion();
  
  const basePath = join(process.cwd(), 'content', version, 'docs', 'pages');
  
  if (href.startsWith('./')) {
    const relativePath = href.substring(2);
    return join(basePath, relativePath);
  } else if (href.startsWith('../')) {
    const segments = href.split('/').filter(s => s !== '');
    let backSteps = 0;
    let pathSegments = [];
    
    for (const segment of segments) {
      if (segment === '..') {
        backSteps++;
      } else {
        pathSegments.push(segment);
      }
    }
    
    const pathParts = basePath.split('/');
    const resolvedParts = pathParts.slice(0, pathParts.length - backSteps);
    
    return join(...resolvedParts, ...pathSegments);
  } else if (href.startsWith('/')) {
    return join(basePath, href.substring(1));
  }
  
  return join(basePath, href);
};

const validatePath = (resolvedPath: string): boolean => {
  const pathWithoutFragment = resolvedPath.split('#')[0];
  
  // Check if path exists as directory with index.mdx
  if (existsSync(pathWithoutFragment) && existsSync(join(pathWithoutFragment, 'index.mdx'))) {
    return true;
  }
  
  // Check if path exists as .mdx file
  if (existsSync(pathWithoutFragment + '.mdx')) {
    return true;
  }
  
  // For paths ending with '/', also check if corresponding .mdx file exists
  if (pathWithoutFragment.endsWith('/')) {
    const pathWithoutSlash = pathWithoutFragment.slice(0, -1);
    if (existsSync(pathWithoutSlash + '.mdx')) {
      return true;
    }
    
    // Check for folder/folder.mdx pattern (e.g., /deployment/ -> /deployment/deployment.mdx)
    const folderName = pathWithoutSlash.split('/').pop(); // Get the last folder name
    if (folderName && existsSync(join(pathWithoutFragment, folderName + '.mdx'))) {
      return true;
    }
  }
  
  return false;
};

export const remarkLintComponentLinks = lintRule(
  "remark-lint:component-links",
  (root: Node, vfile) => {
    // Only check files in specified directories
    if (!PATHS_TO_CHECK.some(path => vfile.path?.includes(path))) {
      return;
    }
    
    visit(root, undefined, (node: Node) => {
      if (isMdxComponent(node)) {
        const componentNode = node as MdxAnyElement;
        const hrefs = extractHrefsFromNode(componentNode);
        
        hrefs.forEach(href => {
          const resolvedPath = resolveRelativePath(href, vfile.path);
          
          if (!validatePath(resolvedPath)) {
            vfile.message(
              `Broken link in ${componentNode.name} component: "${href}" resolves to "${resolvedPath}" but file/directory does not exist`,
              node.position,
            );
          }
        });
      }
    });
  },
);