import { test, expect } from '@jest/globals';

import { extendedTable, extendedTableHtml } from './index.js';
import { micromark } from 'micromark';
import { gfmTable, gfmTableHtml } from 'micromark-extension-gfm-table';
import { tokenTypes } from './lib/types.js';
import { CompileContext } from 'micromark-util-types';

const parse = (md: string) =>
  micromark(md, {
    extensions: [gfmTable(), extendedTable],
    htmlExtensions: [gfmTableHtml(), extendedTableHtml],
  });

const parseWithDevHtml = (md: string) => {
  const devHtml = {
    enter: {
      [tokenTypes.extendedTableCellColspanMarker](this: CompileContext): undefined {
        this.raw(this.encode('*COLSPAN*'));
      },
      [tokenTypes.extendedTableCellRowspanMarker](this: CompileContext): undefined {
        this.raw(this.encode('*ROWSPAN*'));
      },
    },
  };
  return micromark(md, {
    extensions: [gfmTable(), extendedTable],
    htmlExtensions: [gfmTableHtml(), devHtml],
  });
};

// Removing rowspan logic since we don't need it, but keeping this code
// commented out as an example test in case we want to add test cases here.
//
//test('rowspan marker and escaped rowspan marker', () => {
//  const result = parseWithDevHtml(`
//| a | b |
//|---|---|
//| ^ | \\^ |
//`);
//  const expected = `
//<table>
//<thead>
//<tr>
//<th>a</th>
//<th>b</th>
//</tr>
//</thead>
//<tbody>
//<tr>
//<td>*ROWSPAN*</td>
//<td>^</td>
//</tr>
//</tbody>
//</table>
//`;
//  expect(result).toEqual(expected.trimLeft());
//});
