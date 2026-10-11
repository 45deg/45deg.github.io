# External DuckDB WASM extensions

JSON and Parquet extensions for DuckDB v1.5.4, the engine in
`@duckdb/duckdb-wasm@1.33.1-dev57.0`. Both `wasm_eh` and `wasm_mvp`
are available to match the selected browser bundle. Signed binaries are loaded
from the versioned official source below only during imports; automatic extension
installation and loading are disabled. The binaries are not bundled locally.

Source: `https://extensions.duckdb.org/v1.5.4/<platform>/<name>.duckdb_extension.wasm`
License: DuckDB MIT license, included in `LICENSE`.

When upgrading DuckDB WASM, update the engine version in `src/db/duckdb.ts`
and verify matching signed extensions at the official source. Test both bundles.

SHA-256:

| Platform | Extension | Hash |
| --- | --- | --- |
| wasm_eh | json | 993b19f7929cc305b2529c548f2842e8e7a5b112d1c88f31c84798b51901ca16 |
| wasm_eh | parquet | 4845705bbd69fc9ad52878d96a505c73cae4a6c509822079cc2413e5eb437f95 |
| wasm_mvp | json | 15a89d3fd0fa3449c0d8981e6cb1ca6be8df4bcaf0dfdd6660c17bcc3bdf0af8 |
| wasm_mvp | parquet | b64c255a7f7d06cc234535b2f0ecab345fda91bffff5509d3179004bc13aa19a |
