# Third-party notices

The original application code is licensed under the [MIT License](./LICENSE). Bundled third-party software, including `vendor/qepcad.js` and `vendor/qepcad.wasm`, remains subject to its respective licenses below; the application's MIT License does not replace them.

The bundled WebAssembly engine is QEPCAD B 1.80 with SACLIB 2.2.8, built from [chriswestbrown/tarski](https://github.com/chriswestbrown/tarski/tree/796962b75f43dac291d3feb12e3712643b19d787). The Tarski interpreter and MiniSAT are not included.

The only QEPCAD source adaptation enables its CLI main entry point for Emscripten. See `scripts/build-wasm.sh` and `vendor/build-info.json`. The engine uses the upstream WASM SACLIB configuration without optimization.

## QEPCAD

QEPCAD B
Copyright (c) 1990, 2008, Hoon Hong & Chris Brown (contact wcbrown@usna.edu)

Permission to use, copy, modify, and/or distribute this software, including
source files, README files, etc., for any purpose with or without fee is 
hereby granted, provided that the above copyright notice and this permission
notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

## SACLIB

Saclib 2.2
Copyright (c) 1993, 2008, RISC-Linz (contact wcbrown@usna.edu)

Permission to use, copy, modify, and/or distribute this software, including
source files, README files, etc., for any purpose with or without fee is 
hereby granted, provided that the above copyright notice and this permission
notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.


## Emscripten and runtime libraries

Emscripten is MIT / NCSA licensed. The generated binary also links runtime libraries distributed with Emscripten. The complete notices are included in [vendor/licenses](./vendor/licenses/):

- [Emscripten.txt](./vendor/licenses/Emscripten.txt)
- [musl.txt](./vendor/licenses/musl.txt)
- [libcxx.txt](./vendor/licenses/libcxx.txt)
- [libcxxabi.txt](./vendor/licenses/libcxxabi.txt)
- [compiler-rt.txt](./vendor/licenses/compiler-rt.txt)

The app has no CDN dependencies. Preserve these notices when redistributing the site.
