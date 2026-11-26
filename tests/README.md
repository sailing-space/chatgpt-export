Run renderer regression checks from the repository root:

```powershell
node tests/static-ui.cjs
```

These checks use the bundled Markdown parser and actual renderer. They cover
nested UI containers, the archive example's literal-array loop, icons, spacing,
Markdown emphasis, code preservation, unsafe attributes, tables and citations.

The HTML renderer supports static `grid`, `grid-item`, `row`, `box` and
self-closing `icon` components. Numeric spacing uses four-pixel units. Grids
support one to six columns and collapse to one column below 560px. Known icons
use built-in SVG paths; unknown icons show their names. Markdown keeps card
text in reading order and omits decorative icons.

Serialized UI also supports bounded nested literal arrays and records, local
constant declarations, `DIL.useState` initial values, nested `each`/`if` blocks,
property access, numeric arithmetic, comparisons, ternaries and templates.
Array `includes` is the only supported method. No JavaScript is executed.
Unknown expressions remain visible; handlers are removed. Loops, nesting and
expanded output are bounded. Exported controls show initial state only.

Bar `Chart` data becomes SVG in HTML and a table in Markdown. Inline SVG loops
keep their coordinates, labels and presentation attributes. Self-closing boxes,
surface colors, sizes, typography, badges, checkboxes, radios, segmented controls
and inert buttons are preserved in HTML. `CodeBlock` contents stay literal.
JEX retains its separate rich-content renderer. This is static reconstruction,
not a screenshot or preservation of the live page's interactive state.

After source edits, run `python build.py` (or `py build.py`), reload the unpacked
extension and refresh the ChatGPT tab. Source edits alone do not update `dist/`.
