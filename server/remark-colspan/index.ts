import type { Processor } from 'unified';
import { extendedTable } from './micromark-extension-extended-table';
import {
  extendedTableFromMarkdown,
  extendedTableToMarkdown,
  extendedTableToMarkdownOptions,
} from './mdast-util-extended-table';
export { extendedTableHandler, extendedTableHandlers } from './mdast-util-extended-table';

export type Options = extendedTableToMarkdownOptions;

export function remarkExtendedTable(this: Processor, options?: Options): void {
  // TODO: use more specific typing here than any once we get tests to pass
  const data = this.data() as any;

  const micromarkExtensions = data.micromarkExtensions ?? (data.micromarkExtensions = []);
  const fromMarkdownExtensions = data.fromMarkdownExtensions ?? (data.fromMarkdownExtensions = []);
  const toMarkdownExtensions = data.toMarkdownExtensions ?? (data.toMarkdownExtensions = []);

  micromarkExtensions.push(extendedTable);
  fromMarkdownExtensions.push(extendedTableFromMarkdown());
  toMarkdownExtensions.push(extendedTableToMarkdown());
}

export default remarkExtendedTable;
