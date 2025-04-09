import { test, expect } from '@jest/globals';

import { remarkExtendedTable, extendedTableHandlers, Options } from './index.js';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkGfm, { Options as gfmOptions } from 'remark-gfm';

const process = (md: string, options?: Options, gfmOptions?: gfmOptions) =>
  unified()
    .use(remarkParse)
    .use(remarkGfm, gfmOptions)
    .use(remarkExtendedTable, { ...options, ...gfmOptions })
    .use(remarkRehype, { handlers: extendedTableHandlers })
    .use(rehypeStringify)
    .process(md);

test('span with empty cell', async () => {
  const md = `
| a | b |
|---|---|
| 1    ||
| 2 | 3 |
`;
  const html = `<table>
<thead>
<tr>
<th>a</th>
<th>b</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2">1</td>
</tr>
<tr>
<td>2</td>
<td>3</td>
</tr>
</tbody>
</table>`;
  expect((await process(md, { colspanWithEmpty: true })).value).toBe(html);
});

test('no span with empty cell', async () => {
  const md = `
| a | b |
|---|---|
| 1    ||
| 2 | 3 |
`;
  const html = `<table>
<thead>
<tr>
<th>a</th>
<th>b</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td></td>
</tr>
<tr>
<td>2</td>
<td>3</td>
</tr>
</tbody>
</table>`;
  expect((await process(md)).value).toBe(html);
});
