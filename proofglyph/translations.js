"use strict";
// Trusted, authored HTML for static copy; dynamic values are always plain text.
const proofglyphTranslations = {
  "html": {
    "copy-000": {
      "en": "Skip to content",
      "ja": "本文へ"
    },
    "copy-001": {
      "en": "A proof checker based on the λΠ calculus",
      "ja": "λΠ 計算に基づく証明検査器"
    },
    "copy-002": {
      "en": "Editor",
      "ja": "エディタ"
    },
    "copy-003": {
      "en": "Foundations",
      "ja": "基礎・背景"
    },
    "copy-004": {
      "en": "Specification",
      "ja": "言語仕様"
    },
    "copy-005": {
      "en": "Examples",
      "ja": "例"
    },
    "copy-006": {
      "en": "Writing proofs",
      "ja": "書き方"
    },
    "copy-007": {
      "en": "Proof examples",
      "ja": "証明例"
    },
    "copy-008": {
      "en": "Select a proof…",
      "ja": "証明例を選択…"
    },
    "copy-009": {
      "en": "Compilation and checking run in your browser",
      "ja": "コンパイル・検査はブラウザ内で実行"
    },
    "copy-010": {
      "en": "Compile and check",
      "ja": "コンパイルして検査"
    },
    "copy-011": {
      "en": "Cancel",
      "ja": "処理を中止"
    },
    "copy-012": {
      "en": "Check symbols",
      "ja": "記号列を検査"
    },
    "copy-013": {
      "en": "Instructions: 0",
      "ja": "命令数: 0"
    },
    "copy-014": {
      "en": "Results and theorems",
      "ja": "検査結果・定理"
    },
    "copy-015": {
      "en": "Loading…",
      "ja": "読み込み中…"
    },
    "copy-016": {
      "en": "Proof checking in Proofglyph",
      "ja": "Proofglyph の証明検査"
    },
    "copy-017": {
      "en": "Proofglyph <code>.pg</code> files express types and proof terms using a minimal symbol sequence. The checker reads these symbols and verifies that each proof term has its declared type. Its type system is the λΠ calculus (dependent lambda calculus), the type theory of <a href=\"https://en.wikipedia.org/wiki/Logical_framework\">LF (Logical Framework)</a>.",
      "ja": "Proofglyph の <code>.pg</code> ファイルでは、型と証明項を最小限の記号列で記述します。検査器はその記号列を読み込み、各証明項が指定された型を持つかを検証します。検査の体系は、<a href=\"https://en.wikipedia.org/wiki/Logical_framework\">LF（Logical Framework）</a>の型理論である λΠ 計算（依存型付きラムダ計算）に基づいています。"
    },
    "copy-018": {
      "en": "Logical systems and Proofglyph",
      "ja": "論理体系と Proofglyph の構成"
    },
    "copy-019": {
      "en": "Object logics are represented in LF's λΠ calculus. Proofglyph is based on this calculus; its type checker checks types and proof terms translated from Hieratic.",
      "ja": "対象論理を LF の λΠ 計算で表現する。Proofglyph 言語は λΠ 計算に基づき、Hieratic から変換された型と証明項を型検査器が検査する。"
    },
    "copy-020": {
      "en": "Theoretical foundations",
      "ja": "理論の基盤"
    },
    "copy-021": {
      "en": "Logics and proof systems",
      "ja": "論理・証明体系"
    },
    "copy-022": {
      "en": "NK / LK · First-order logic / ZFC",
      "ja": "NK・LK ／ 一階論理・ZFC"
    },
    "copy-023": {
      "en": "Object-language type system",
      "ja": "対象言語の型システム"
    },
    "copy-024": {
      "en": "Typing rules, judgments, derivations",
      "ja": "型付け規則・判断・導出"
    },
    "copy-025": {
      "en": "A logical framework based on λΠ",
      "ja": "λΠ計算に基づく論理的枠組み"
    },
    "copy-026": {
      "en": "Inference rules → constants",
      "ja": "推論規則 → 定数宣言"
    },
    "copy-027": {
      "en": "Judgments → types / Proofs → terms",
      "ja": "判断 → 型　／　導出 → 項"
    },
    "copy-028": {
      "en": "Represent systems as types and terms",
      "ja": "対象体系を型と項で表現"
    },
    "copy-029": {
      "en": "Encoding",
      "ja": "符号化"
    },
    "copy-030": {
      "en": "Writing and checking",
      "ja": "記述と検査"
    },
    "copy-031": {
      "en": "High-level language with names",
      "ja": "名前付きの高水準言語"
    },
    "copy-032": {
      "en": "Write definitions and proof terms",
      "ja": "定義・証明項を記述"
    },
    "copy-033": {
      "en": "Symbols for types and proof terms",
      "ja": "型と証明項の記号言語"
    },
    "copy-034": {
      "en": "Variables represented by indices",
      "ja": "変数を番号で表現"
    },
    "copy-035": {
      "en": "Type checker",
      "ja": "型検査器"
    },
    "copy-036": {
      "en": "Check types of proof terms",
      "ja": "証明項の型を検査"
    },
    "copy-037": {
      "en": "Compare types by β equivalence",
      "ja": "型の比較はβ同値"
    },
    "copy-038": {
      "en": "Compile",
      "ja": "変換"
    },
    "copy-039": {
      "en": "Check",
      "ja": "検査"
    },
    "copy-040": {
      "en": "Language foundation",
      "ja": "言語の基盤"
    },
    "copy-042": {
      "en": "Object logics and type systems are encoded in LF. Its λΠ calculus underlies Proofglyph, whose proof terms are translated from Hieratic and type-checked.",
      "ja": "対象論理と型システムを LF で符号化する。LF の λΠ 計算が Proofglyph 言語の基盤。Hieratic から変換した Proofglyph の証明項を型検査する。"
    },
    "copy-051": {
      "en": "Judgments → types / Derivations → terms",
      "ja": "判断 → 型 ／ 導出 → 項"
    },
    "copy-063": {
      "en": "LF is a metalanguage for representing and checking the syntax, inference rules, and proofs of different logics in a common <a href=\"https://en.wikipedia.org/wiki/Dependent_type\">dependently typed</a> <a href=\"https://en.wikipedia.org/wiki/Lambda_calculus\">lambda calculus</a>. Robert Harper, Furio Honsell, and Gordon Plotkin introduced it in <cite><a href=\"https://homepages.inf.ed.ac.uk/gdp/publications/Framework_Def_Log.pdf\" type=\"application/pdf\">A Framework for Defining Logics</a></cite> (1987 / 1993).",
      "ja": "LF は、多様な論理の構文・推論規則・証明を<a href=\"https://ja.wikipedia.org/wiki/依存型\">依存型</a>付き<a href=\"https://ja.wikipedia.org/wiki/ラムダ計算\">ラムダ計算</a>上で統一的に表現・検証するためのメタ言語です。Robert Harper、Furio Honsell、Gordon Plotkin が論文 <cite><a href=\"https://homepages.inf.ed.ac.uk/gdp/publications/Framework_Def_Log.pdf\" type=\"application/pdf\">A Framework for Defining Logics</a></cite>（1987 / 1993）において提案しました。"
    },
    "copy-064": {
      "en": "Symbols and inference rules differ between systems such as <a href=\"https://en.wikipedia.org/wiki/Natural_deduction\">natural deduction</a>, sequent calculus, and set theory. LF defines them as sequences of constant declarations called signatures. Using these declarations, the checker determines function argument/result types, variable scope, and type equivalence.",
      "ja": "<a href=\"https://ja.wikipedia.org/wiki/自然演繹\">自然演繹</a>やシーケント計算、集合論など、論理体系ごとに記号や推論規則は異なります。LF では、これらを「シグネチャ」と呼ばれる定数宣言の列として定義します。検査器はその宣言をもとに、関数の引数・戻り値の型、変数のスコープ、型の同値性を判定します。"
    },
    "copy-065": {
      "en": "For example, Hieratic declares the proposition type <code>Prop</code> and the mapping <code>Prf</code> from propositions to their proof types (of kind <code>Prop -&gt; Type</code>) as follows. A proposition <code>P</code> has type <code>Prop</code>; its proof is a term of type <code>Prf P</code>. Compile this code and check it in Proofglyph form.",
      "ja": "例えば高水準言語 Hieratic では、命題の型 <code>Prop</code> と、命題からその証明の型への写像 <code>Prf</code>（カインド <code>Prop -&gt; Type</code>）を次のように宣言します。命題 <code>P</code> は型 <code>Prop</code> を持ち、その証明は型 <code>Prf P</code> を持つ項として表現されます。このコードをコンパイルして Proofglyph 形式で検査します。"
    },
    "copy-066": {
      "en": "Compiling this code produces the following <code>.pg</code>:",
      "ja": "このコードをコンパイルすると、次の <code>.pg</code> が生成されます。"
    },
    "copy-067": {
      "en": "Here, <code>#0</code> refers to <code>Prop</code>, <code>#1</code> to <code>Prf</code>, and <code>#2</code> to <code>P</code>. The <code>:</code> operator registers assumptions (axioms); the final <code>!</code> checks and registers the type and proof term of <code>identity</code>.",
      "ja": "上記の Proofglyph コードにおいて、<code>#0</code> は <code>Prop</code>、<code>#1</code> は <code>Prf</code>、<code>#2</code> は <code>P</code> を指します。演算子 <code>:</code> で前提（公理）を登録し、最後の <code>!</code> で <code>identity</code> の型と証明項を検査して登録します。"
    },
    "copy-068": {
      "en": "The theorem <code>identity</code> takes a proof of <code>P</code> and returns it unchanged. Since it requires a proof of <code>P</code> as input, it is a conditional proof corresponding to P → P, rather than an unconditional proof of <code>P</code>. Introducing and discharging assumptions in natural deduction corresponds to function parameters and lambda abstraction.",
      "ja": "定理 <code>identity</code> は「<code>P</code> の証明を受け取ってそのまま返す関数」です。引数として <code>P</code> の証明を必要とするため、これは <code>P</code> を無条件に証明したのではなく、含意 P → P に相当する仮定付きの証明です。自然演繹における仮定の導入と解消が、ラムダ計算における関数の引数受け取りとラムダ抽象に対応しています。"
    },
    "copy-069": {
      "en": "<code>Prf P</code> is a type depending on the value of proposition <code>P</code> (a dependent type / type family). <code>forall (P : Prop), Prf P -&gt; Prf P</code> takes any proposition and its proof and returns a proof of the same proposition. Hieratic uses <code>forall</code> for <a href=\"https://en.wikipedia.org/wiki/Dependent_type\">dependent function types (Π types)</a>, whose results depend on argument values.",
      "ja": "<code>Prf P</code> は、命題 <code>P</code> の値に依存する型（依存型 / 型族）です。<code>forall (P : Prop), Prf P -&gt; Prf P</code> は、任意の命題 <code>P</code> とその証明を受け取り、同じ命題の証明を返す関数の型を表します。Hieratic では <code>forall</code> 構文を用いて、引数の値に依存する<a href=\"https://ja.wikipedia.org/wiki/依存型\">関数型（依存積型 / Π型）</a>を記述します。"
    },
    "copy-070": {
      "en": "Role",
      "ja": "役割"
    },
    "copy-072": {
      "en": "Object",
      "ja": "項（Object）"
    },
    "copy-073": {
      "en": "Type / type family",
      "ja": "型 / 型族（Type / Family）"
    },
    "copy-074": {
      "en": "Kind",
      "ja": "カインド（Kind）"
    },
    "copy-075": {
      "en": "<code>Type</code> and <code>Prop -&gt; Type</code> are classified by <code>Kind</code>. <code>Kind</code> itself has no type.",
      "ja": "<code>Type</code>、<code>Prop -&gt; Type</code>。いずれも <code>Kind</code> に分類されます。<code>Kind</code> 自体には型が存在しません。"
    },
    "copy-076": {
      "en": "Declare an object-logic universal quantifier as <code>All : (U -&gt; Prop) -&gt; Prop</code>; “F x for every x” becomes <code>All (fun (x : U) =&gt; F x)</code>. Representing object-language binding through LF lambda binding is called <a href=\"https://en.wikipedia.org/wiki/Higher-order_abstract_syntax\">HOAS (Higher-Order Abstract Syntax)</a>. Proofglyph internally uses <a href=\"https://en.wikipedia.org/wiki/De_Bruijn_index\">de Bruijn indices</a> to account for variable renaming (α equivalence) and perform deterministic, capture-avoiding substitution.",
      "ja": "対象論理の全称量化子を <code>All : (U -&gt; Prop) -&gt; Prop</code> と宣言すると、「すべての x について F x」という命題は <code>All (fun (x : U) =&gt; F x)</code> と表現できます。このように、対象論理の変数束縛を LF のラムダ束縛で表現する手法を <a href=\"https://en.wikipedia.org/wiki/Higher-order_abstract_syntax\">HOAS（Higher-Order Abstract Syntax）</a> と呼びます。Proofglyph の内部表現では <a href=\"https://en.wikipedia.org/wiki/De_Bruijn_index\">de Bruijn インデックス</a> を採用し、変数名の違い（α 同値性）の吸収や変数捕獲を防ぐ代入を安全かつ決定論的に行います。"
    },
    "copy-077": {
      "en": "The checker mechanically verifies that a proof term has the specified type under the declared assumptions. It does not establish consistency of those assumptions or that the encoded rules accurately represent the intended object logic. The original LF paper proves “adequacy”: a one-to-one correspondence between object-language syntax/derivation trees and canonical LF terms.",
      "ja": "型検査器の役割は、宣言された前提のもとで証明項が指定された型を持つかを機械的に確かめることです。前提（公理系）自体の無矛盾性や、記述した規則が意図した対象論理を正確に捉えているかは、型検査器の保証範囲外です。LF の元論文では、対象論理の構文・演繹木と LF の正準項の 1 対 1 対応が「適合性（Adequacy）」として証明されています。"
    },
    "copy-078": {
      "en": "The kernel handles only Π types, λ terms, application, sorts (<code>Type / Kind</code>), variables, and opaque constants. Type equivalence uses only β reduction. Logical rules and axioms are declared as assumptions; proof terms are explicit. There is no automatic proof search, tactics, or implicit arguments.",
      "ja": "Proofglyph のカーネルは、Π型、λ項、関数適用、ソート（<code>Type / Kind</code>）、変数、不透明な定数のみを扱う最小構成です。型の同値判定には β 簡約のみを用います。論理の推論規則や公理はすべて前提として宣言し、証明項は明示的に記述します（自動証明探索、タクティクス、暗黙引数などの機能はありません）。"
    },
    "copy-080": {
      "en": "Hieratic (<code>.ht</code>) is a high-level language using variable and constant names for readability. Proofglyph (<code>.pg</code>) is a stack-oriented intermediate language expressing types and proof terms with minimal symbols. Hieratic compiles to Proofglyph for kernel type checking. You can also enter and check Proofglyph directly.",
      "ja": "Hieratic（<code>.ht</code>）は変数名や定数名を用いて人間が読み書きしやすい形式で記述する高水準言語であり、Proofglyph（<code>.pg</code>）は型と証明項を最小限の記号列で記述するスタック指向の中間言語です。Hieratic で記述されたコードは Proofglyph へとコンパイルされ、カーネルによって型検査されます。Proofglyph を直接入力して検査することも可能です。"
    },
    "copy-081": {
      "en": "Typing and equivalence",
      "ja": "型付け・同値性"
    },
    "copy-082": {
      "en": "Proofglyph symbol syntax",
      "ja": "Proofglyph（記号列）の構文"
    },
    "copy-083": {
      "en": "Proofglyph scans symbols in order, building expressions on a stack. Binary operators <code>&gt;</code>, <code>\\</code>, and <code>@</code> pop two elements and push a new type or term. In <code>A B</code> and <code>f x</code> below, the rightmost element is the stack top.",
      "ja": "Proofglyph は記号列を先頭から順に走査し、構文要素をスタックへ積んで式を組み立てます。二項演算子 <code>&gt;</code>、<code>\\</code>、<code>@</code> はスタックトップから 2 つの要素を取り出し、新たな型や項を構築してスタックへプッシュします（表中の <code>A B</code> や <code>f x</code> は、右側の要素がスタックの最上位を示します）。"
    },
    "copy-084": {
      "en": "Symbol",
      "ja": "記号"
    },
    "copy-085": {
      "en": "Operation",
      "ja": "操作"
    },
    "copy-086": {
      "en": "Push <code>Type</code>",
      "ja": "<code>Type</code> をプッシュ"
    },
    "copy-087": {
      "en": "Push <code>Kind</code>",
      "ja": "<code>Kind</code> をプッシュ"
    },
    "copy-088": {
      "en": "Variable (de Bruijn index; <code>$0</code> is the innermost parameter)",
      "ja": "変数（de Bruijn インデックス、<code>$0</code> が最も内側の引数）"
    },
    "copy-089": {
      "en": "Registered constant (numbered from zero)",
      "ja": "登録済み定数（0 から始まる連番）"
    },
    "copy-090": {
      "en": "Pop <code>A</code> and <code>B</code>; push a dependent function type (Π) with domain <code>A</code> and result <code>B</code>. The parameter can occur inside <code>B</code>.",
      "ja": "スタックから <code>A</code> と <code>B</code> を取り出し、引数の型が <code>A</code>、戻り値の型が <code>B</code> である依存関数型（Π型）を積む（<code>B</code> の内部から引数を参照可能）"
    },
    "copy-091": {
      "en": "Pop <code>A</code> and <code>b</code>; push a function (λ term) taking a parameter of type <code>A</code> and returning <code>b</code>.",
      "ja": "スタックから <code>A</code> と <code>b</code> を取り出し、型 <code>A</code> の引数を受け取って <code>b</code> を返す関数（λ項）を積む"
    },
    "copy-092": {
      "en": "Pop <code>f</code> and <code>x</code>; push the application of function <code>f</code> to argument <code>x</code>.",
      "ja": "スタックから <code>f</code> と <code>x</code> を取り出し、関数 <code>f</code> を引数 <code>x</code> に適用した項（関数適用）を積む"
    },
    "copy-093": {
      "en": "With exactly <code>[type]</code> on the stack, register an assumption (axiom) constant of that type and empty the stack.",
      "ja": "スタックが <code>[型]</code>（1 要素のみ）のとき、その型を持つ前提（公理）を定数として登録し、スタックを空にする"
    },
    "copy-094": {
      "en": "With exactly <code>[type, term]</code> on the stack, check the term's type, register a proven constant, and empty the stack.",
      "ja": "スタックが <code>[型, 項]</code>（2 要素のみ）のとき、項がその型を持つかを型検査して証明済み定数として登録し、スタックを空にする"
    },
    "copy-095": {
      "en": "Writing a function",
      "ja": "関数を書く"
    },
    "copy-096": {
      "en": "Assume types <code>A</code>, <code>B</code>, and function <code>f : A -&gt; B</code>. Write a function applying <code>f</code> to an argument <code>x : A</code>.",
      "ja": "型 <code>A</code> と <code>B</code>、関数 <code>f : A -&gt; B</code> を前提として、引数 <code>x : A</code> に <code>f</code> を適用する関数を書きます。"
    },
    "copy-097": {
      "en": "The first two <code>*:</code> sequences register <code>A</code> (<code>#0</code>) and <code>B</code> (<code>#1</code>). <code>#0#1&gt;:</code> constructs <code>A -&gt; B</code> and registers assumption <code>f</code> (<code>#2</code>) of that type. Its stack evolves as follows:",
      "ja": "最初の二つの <code>*:</code> で <code>A</code>（<code>#0</code>）と <code>B</code>（<code>#1</code>）を登録します。<code>#0#1&gt;:</code> は関数型 <code>A -&gt; B</code> を作り、その型を持つ <code>f</code>（<code>#2</code>）を前提として登録します。<code>#0#1&gt;:</code> を読むときのスタックは次のように変わります。"
    },
    "copy-098": {
      "en": "Stack changes for #0#1&gt;:",
      "ja": "#0#1&gt;: のスタックの変化"
    },
    "copy-099": {
      "en": "With A (#0) and B (#1) registered, #0 pushes A and #1 pushes B. The most recently pushed term is on top. &gt; replaces both with A → B. : registers assumption f (#2) of that type and empties the stack.",
      "ja": "型 A（#0）と B（#1）が登録済みの場合。#0 で A を積み、#1 で B を積む。上が最後に積んだ項。&gt; で二つを取り出し、関数型 A → B を一つ積む。: でその型を持つ f（#2）を前提として登録し、スタックを空にする。"
    },
    "copy-100": {
      "en": "Read #0",
      "ja": "#0 を読む"
    },
    "copy-101": {
      "en": "Read #1",
      "ja": "#1 を読む"
    },
    "copy-102": {
      "en": "Read &gt;",
      "ja": "&gt; を読む"
    },
    "copy-103": {
      "en": "Read :",
      "ja": ": を読む"
    },
    "copy-104": {
      "en": "Empty",
      "ja": "空"
    },
    "copy-105": {
      "en": "1 term",
      "ja": "1 項"
    },
    "copy-106": {
      "en": "2 terms",
      "ja": "2 項"
    },
    "copy-107": {
      "en": "1 function type",
      "ja": "1 項（関数型）"
    },
    "copy-108": {
      "en": "The stack top is at the top of the diagram. <code>&gt;</code> constructs a function type from two terms; <code>:</code> registers an assumption of that type and empties the stack.",
      "ja": "図では上がスタックの最上部です。<code>&gt;</code> は二つの項から関数型を作り、<code>:</code> はその型を持つ前提を登録してスタックを空にします。"
    },
    "copy-109": {
      "en": "The final line first pushes the result type <code>A -&gt; B</code> using <code>#0#1&gt;</code>. The following <code>#0#2$0@\\</code> represents <code>fun (x : A) =&gt; f x</code>. <code>#2$0@</code> applies <code>f</code> to <code>x</code>; <code>\\</code> constructs a function taking an <code>A</code> parameter. The final <code>!</code> checks type and body and, on success, registers proven constant <code>#3</code>.",
      "ja": "最後の行では、<code>#0#1&gt;</code> で結論の型 <code>A -&gt; B</code> を積みます。続く <code>#0#2$0@\\</code> が <code>fun (x : A) =&gt; f x</code> に対応します。<code>#2$0@</code> は <code>f</code> を引数 <code>x</code> に適用し、<code>\\</code> は型 <code>A</code> の引数を受け取る関数を作ります。末尾の <code>!</code> で型と本体を検査し、成功すると証明済み定数 <code>#3</code> を登録します。"
    },
    "copy-110": {
      "en": "Stack changes for #0#1&gt;#0#2$0@\\!",
      "ja": "#0#1&gt;#0#2$0@\\! のスタックの変化"
    },
    "copy-111": {
      "en": "Push result type A → B, then parameter type A, function f, and argument x. @ replaces f and x with application f x; backslash replaces A and f x with λx:A. f x. ! checks the remaining type/body, registers proven constant #3, and empties the stack.",
      "ja": "最初に結論の型 A → B を積む。次に引数の型 A、関数 f、引数 x を積む。@ で f と x を適用 f x に置き換え、バックスラッシュで A と f x をラムダ項 λx:A. f x に置き換える。! で残った型と本体を検査し、#3 を証明済み定数として登録してスタックを空にする。"
    },
    "copy-113": {
      "en": "#3 : A → B (proven)",
      "ja": "#3 : A → B（証明済み）"
    },
    "copy-114": {
      "en": "<code>$0</code> is the innermost bound parameter; <code>$1</code> is the next outer parameter. This numbering uses <a href=\"https://en.wikipedia.org/wiki/De_Bruijn_index\">de Bruijn indices</a>. For example, <code>#0#0$1\\\\</code> takes two arguments of type <code>#0</code> and returns the first (the value passed earlier).",
      "ja": "変数 <code>$0</code> は最も内側のバインダの引数、<code>$1</code> はその一つ外側の引数を表します。この変数番号付け方式を <a href=\"https://en.wikipedia.org/wiki/De_Bruijn_index\">de Bruijn インデックス</a> と呼びます。例えば <code>#0#0$1\\\\</code> は、型 <code>#0</code> の引数を 2 つ受け取り、第 1 引数（先に渡された値）を返す関数を表します。"
    },
    "copy-115": {
      "en": "Constants <code>#0</code>, <code>#1</code>, … are numbered from zero in registration order. Only previously registered constants can be referenced; forward and self-references are forbidden.",
      "ja": "定数番号 <code>#0</code>, <code>#1</code>, … は登録順に 0 から連番で割り振られます。参照できるのは、それ以前に登録済みの定数のみです（前方参照や自己参照は不可）。"
    },
    "copy-116": {
      "en": "Spaces and newlines may be inserted or omitted between tokens, but cannot separate prefixes and digits as in <code>$&nbsp;0</code> or <code>#&nbsp;12</code>. Write <code>$0</code> or <code>#12</code> instead. Proofglyph has no comment syntax.",
      "ja": "トークン間の空白や改行は自由に省略・挿入できますが、<code>$&nbsp;0</code>&nbsp;や&nbsp;<code>#&nbsp;12</code>&nbsp;のようにプレフィックス記号と数字の間に空白を入れることはできません（<code>$0</code>&nbsp;や&nbsp;<code>#12</code>&nbsp;のように詰めて記述します）。なお、Proofglyph にはコメント構文は存在しません。"
    },
    "copy-117": {
      "en": "Type checking occurs when <code>:</code> or <code>!</code> registers a constant. Stack underflow, extra terms at registration, and a nonempty stack at EOF are syntax errors.",
      "ja": "型検査は <code>:</code> および <code>!</code> による定数登録のタイミングで実行されます。操作に必要なスタック要素が不足している場合、登録時にスタックに余分な項が残っている場合、ファイル終端（EOF）でスタックが空でない場合などはすべて構文エラーとなります。"
    },
    "copy-118": {
      "en": "Hieratic syntax",
      "ja": "Hieratic の構文"
    },
    "copy-119": {
      "en": "Hieratic uses identifiers (variable/constant names) instead of numeric indices for readability. Function types use <code>A -&gt; B</code>, and application uses <code>f x</code>. Compilation resolves names into indices.",
      "ja": "Hieratic では、Proofglyph のような数値インデックスの代わりに、識別子（変数名・定数名）を用いて人間が読み書きしやすい形式で記述します。関数型は <code>A -&gt; B</code>、関数適用は <code>f x</code> のように表現し、コンパイル時に名前解決が行われて番号へと変換されます。"
    },
    "copy-120": {
      "en": "Declarations",
      "ja": "宣言"
    },
    "copy-121": {
      "en": "Syntax",
      "ja": "構文"
    },
    "copy-122": {
      "en": "Description",
      "ja": "説明"
    },
    "copy-123": {
      "en": "<code>symbol name : type;</code>",
      "ja": "<code>symbol 名前 : 型;</code>"
    },
    "copy-124": {
      "en": "Declare an undefined type or symbol",
      "ja": "未定義の型・記号の宣言"
    },
    "copy-125": {
      "en": "<code>axiom name : type;</code>",
      "ja": "<code>axiom 名前 : 型;</code>"
    },
    "copy-126": {
      "en": "Declare a trusted axiom or logical rule",
      "ja": "信頼する公理・論理規則の宣言"
    },
    "copy-127": {
      "en": "<code>def name : type := term;</code>",
      "ja": "<code>def 名前 : 型 := 項;</code>"
    },
    "copy-128": {
      "en": "Register a definition",
      "ja": "定義の登録"
    },
    "copy-129": {
      "en": "<code>theorem name : type := proof_term;</code>",
      "ja": "<code>theorem 名前 : 型 := 証明項;</code>"
    },
    "copy-130": {
      "en": "Prove an opaque theorem",
      "ja": "不透明な定理の証明"
    },
    "copy-131": {
      "en": "Types and terms",
      "ja": "型と項"
    },
    "copy-134": {
      "en": "<code>Type</code> is the sort of ordinary types; <code>Type : Kind</code>. <code>Kind</code> itself has no type.",
      "ja": "<code>Type</code> は通常の型の型（ソート）。<code>Type : Kind</code> が成り立つ。<code>Kind</code> 自体には型が存在しない"
    },
    "copy-135": {
      "en": "Application (left-associative: <code>(f x) y</code>)",
      "ja": "関数適用（左結合: <code>(f x) y</code>）"
    },
    "copy-136": {
      "en": "Function type (right-associative: <code>A -&gt; (B -&gt; C)</code>)",
      "ja": "関数型（右結合: <code>A -&gt; (B -&gt; C)</code>）"
    },
    "copy-137": {
      "en": "Dependent function type (Π)",
      "ja": "依存関数型（Π型）"
    },
    "copy-138": {
      "en": "Lambda abstraction (λ)",
      "ja": "ラムダ抽象（λ項）"
    },
    "copy-139": {
      "en": "Correspondence with Proofglyph",
      "ja": "Proofglyph との対応"
    },
    "copy-140": {
      "en": "This compiles to <code>*:#0#0&gt;#0$0\\!</code>. <code>A</code> corresponds to constant <code>#0</code> and parameter <code>x</code> to variable <code>$0</code>. Constant name <code>id</code> does not appear in the symbols.",
      "ja": "このコードは <code>*:#0#0&gt;#0$0\\!</code> に変換されます。<code>A</code> が定数 <code>#0</code> に、関数の引数 <code>x</code> が変数 <code>$0</code> に対応します。定数名 <code>id</code> は Proofglyph の記号列には含まれません。"
    },
    "copy-141": {
      "en": "Declaration parameters desugar to <code>forall</code> in the type and <code>fun</code> in the body. The definition above is equivalent to:",
      "ja": "宣言の引数リストは、型側では <code>forall</code>、本体側では <code>fun</code> へと展開（糖衣構文展開）されます。上記の定義は次のように書くことと同値です。"
    },
    "copy-142": {
      "en": "Application <code>f x y</code> associates left (<code>(f x) y</code>); arrows <code>A -&gt; B -&gt; C</code> associate right (<code>A -&gt; (B -&gt; C)</code>). In <code>forall (x : A), B</code>, the result type <code>B</code> may reference parameter <code>x</code>.",
      "ja": "関数適用 <code>f x y</code> は左結合（<code>(f x) y</code>）、関数型 <code>A -&gt; B -&gt; C</code> は右結合（<code>A -&gt; (B -&gt; C)</code>）として解釈されます。依存関数型 <code>forall (x : A), B</code> では、戻り値の型 <code>B</code> の内部で引数 <code>x</code> を参照できます。"
    },
    "copy-143": {
      "en": "Examples use <code>Prop</code> for propositions and <code>Prf P</code> for proofs of <code>P</code>. <code>theorem name : Prf P := term;</code> checks that the proof term has type <code>Prf P</code>. Basic logical rules and Peano axioms are assumptions (<code>axiom</code>); rules derived from definitions are proved as <code>theorem</code>.",
      "ja": "付属の証明例では、<code>Prop</code> を命題の型、<code>Prf P</code> を命題 <code>P</code> の証明を表す型として扱っています。<code>theorem 名前 : Prf P := 項;</code> は、与えられた証明項が型 <code>Prf P</code> を持つかを型検査します。論理の基本規則やペアノの公理は前提（<code>axiom</code>）として宣言し、定義から導ける規則は <code>theorem</code> として証明します。"
    },
    "copy-144": {
      "en": "<code>def</code> checks its body and expands subsequent references at compile time. <code>theorem</code> checks a proof and retains opaque references. Both use Proofglyph <code>!</code> for checking/registration; the kernel never unfolds constant bodies. <code>symbol</code> declares undefined types/symbols; <code>axiom</code> declares trusted logical rules/mathematical axioms. Both count as kernel assumptions.",
      "ja": "<code>def</code> は本体を型検査し、後続の参照をコンパイル時に展開します。<code>theorem</code> は証明を型検査して不透明な定数として参照します。どちらも Proofglyph の <code>!</code> で検査・登録し、カーネル自体は定数の本体を展開しません。<code>symbol</code> は未定義の型や記号、<code>axiom</code> は信頼する論理規則・数学的公理を宣言します。両方ともカーネルでは前提として数えます。"
    },
    "copy-145": {
      "en": "“Check passed” means the proof terms are well-typed under the input's assumptions. It does not establish correctness or consistency of the axioms themselves.",
      "ja": "検査結果の「検査成功」は、入力に含まれる前提のもとで証明項の型付けが妥当であることを意味します。前提（公理）自体の正しさや無矛盾性までは判定しません。"
    },
    "copy-146": {
      "en": "Names, binding, and declaration order",
      "ja": "名前・束縛・宣言順"
    },
    "copy-147": {
      "en": "Identifiers match <code>[A-Za-z_][A-Za-z0-9_']*</code>. <code>symbol</code>, <code>axiom</code>, <code>def</code>, <code>theorem</code>, <code>import</code>, <code>forall</code>, <code>fun</code>, <code>Type</code>, and <code>Kind</code> are reserved. Underscore <code>_</code> is an ordinary identifier, not an inference hole. Numeric literals and infix arithmetic operators such as <code>+</code> and <code>*</code> are not built in.",
      "ja": "識別子は正規表現 <code>[A-Za-z_][A-Za-z0-9_']*</code> で表されます。<code>symbol</code>, <code>axiom</code>, <code>def</code>, <code>theorem</code>, <code>import</code>, <code>forall</code>, <code>fun</code>, <code>Type</code>, <code>Kind</code> は予約語です。アンダースコア <code>_</code> も通常の識別子名であり、型推論の穴（ワイルドカード）ではありません。また、数値リテラルや中置の算術演算子（<code>+</code> や <code>*</code> など）は言語機能として組み込まれていません。"
    },
    "copy-148": {
      "en": "Name resolution searches parameters from innermost to outermost, then preceding global declarations. Local shadowing is allowed. Duplicate global names, forward references, and self-reference (recursion) are errors. Grouped parameters <code>(x y : A)</code> expand to <code>(x : A) (y : A)</code>.",
      "ja": "名前解決は最も内側の引数から外側へ向かって探索し、見つからなければ先行する大域宣言を検索します。内側の引数名で外側の名前を覆い隠すシャドーイング（shadowing）は可能です。大域的な宣言名の重複、前方参照（未定義の参照）、自己参照（再帰定義）はエラーとなります。引数の省略記法 <code>(x y : A)</code> は <code>(x : A) (y : A)</code> に展開されます。"
    },
    "copy-149": {
      "en": "Splitting files (CLI)",
      "ja": "ファイルの分割（CLI）"
    },
    "copy-150": {
      "en": "CLI <code>compile</code> resolves paths relative to the importing file and inlines dependency declarations at that position. Each canonical file is loaded once. Cycles, missing files, and duplicate names after import expansion are errors. There are no namespaces or aliases.",
      "ja": "CLI の <code>compile</code> コマンドは、インポート元のファイルを基準に相対パスを解決し、依存先ファイルの宣言をその位置へインライン展開します。同一の実体ファイルは重複して読み込まれません。循環インポート、存在しないファイル、インポート展開後の名前の重複はエラーとなります（名前空間や別名定義の機能はありません）。"
    },
    "copy-151": {
      "en": "<code>//</code> starts a comment until the end of the line. All arguments must be explicit; there are no inference holes or tactics. This demo keeps <code>import</code> statements visible and lets you edit dependencies in horizontally scrollable tabs. Compilation loads dependencies including your tab edits.",
      "ja": "<code>//</code> から行末まではコメントとして扱われます。引数はすべて明示的に渡す必要があります（型推論による穴やタクティクスはありません）。この Web デモでは <code>import</code> を残して表示し、依存ファイルは横スクロール可能なタブで編集します。コンパイル時にタブ内の編集を含めて依存関係を読み込みます。"
    },
    "copy-152": {
      "en": "After editing Hieratic, use “Compile and check”; after editing Proofglyph directly, use “Check symbols”. Direct checking has no source map, so constants display as <code>c0</code>, <code>c1</code>, ….",
      "ja": "Hieratic を編集した場合は「コンパイルして検査」を、Proofglyph を直接編集した場合は「記号列を検査」を押してください。Proofglyph を直接編集・検査した場合は、ソースマップが存在しないため定数名が <code>c0</code>, <code>c1</code>, … として表示されます。"
    },
    "copy-153": {
      "en": "Typing and equivalence",
      "ja": "型付けと同値性"
    },
    "copy-154": {
      "en": "Construct",
      "ja": "構成"
    },
    "copy-155": {
      "en": "Conditions / type",
      "ja": "条件・型"
    },
    "copy-156": {
      "en": "Has type <code>Kind</code>. <code>Kind</code> itself has no type.",
      "ja": "<code>Kind</code> 型を持つ。<code>Kind</code> 自体には型が存在しない。"
    },
    "copy-157": {
      "en": "Requires <code>A : Type</code> and well-formed <code>B : Type</code> or <code>B : Kind</code> under <code>x : A</code>.",
      "ja": "<code>A : Type</code> が必要。<code>x : A</code> のもとで <code>B : Type</code> または <code>B : Kind</code> が整形式であること。"
    },
    "copy-158": {
      "en": "If <code>b : B</code>, has type <code>forall (x : A), B</code>, provided that type can be formed.",
      "ja": "<code>b : B</code> ならば、形成可能な <code>forall (x : A), B</code> 型を持つ。"
    },
    "copy-159": {
      "en": "If <code>f : forall (x : A), B</code> and <code>u : A</code>, its type is <code>B</code> with <code>u</code> substituted for <code>x</code>.",
      "ja": "<code>f : forall (x : A), B</code> かつ <code>u : A</code> ならば、型は <code>B</code> 中の <code>x</code> を <code>u</code> に代入（置換）したもの。"
    },
    "copy-160": {
      "en": "Bound variables must range over a type of sort <code>Type</code> (first-order dependent types). Since <code>Type : Kind</code>, kind abstraction such as <code>forall (A : Type), A -&gt; A</code> is rejected. An identity function over a specific assumed <code>A : Type</code> is allowed.",
      "ja": "束縛変数として導入できるのは、型 <code>Type</code> を持つ項に限られます（一階依存型）。<code>Type : Kind</code> であるため、<code>forall (A : Type), A -&gt; A</code> のようなカインドの抽象化（多相型）は拒否されます（公理として固定された特定の <code>A : Type</code> に対する恒等関数は記述可能です）。"
    },
    "copy-161": {
      "en": "Type equivalence uses full <a href=\"https://en.wikipedia.org/wiki/Lambda_calculus#Beta_reduction\">β reduction</a>. η equivalence, constant unfolding, proof irrelevance, and user-defined rewriting are unsupported. Natural numbers and inductive types are not built in; they are axiomatized as signature assumptions.",
      "ja": "型の同値性判定には完全な <a href=\"https://ja.wikipedia.org/wiki/ラムダ計算#β-簡約\">β 簡約</a> を用います。η 同値、定数の展開、証明無関係性（proof irrelevance）、ユーザー定義の書換え規則などはサポートしていません。また、自然数や帰納型は言語に組み込まれておらず、すべてシグネチャ上の前提として公理化します。"
    },
    "copy-162": {
      "en": "Type checking has a computational budget (fuel) for reduction. Exhausting it interrupts checking; this means the budget was reached, not necessarily that the proof is invalid. The CLI budget can be changed with <code>--fuel N</code>.",
      "ja": "無限ループによるブラウザの停止を防ぐため、型検査の簡約ステップ数には計算上限（fuel）が設定されています。fuel を使い切ると検査は中断されますが、これは計算上限に達したことを意味し、直ちに証明項が誤っていることを示すわけではありません（CLI では <code>--fuel N</code> オプションで上限を変更可能です）。"
    },
    "copy-163": {
      "en": "Runnable Hieratic examples",
      "ja": "実行できる証明例（Hieratic）"
    },
    "copy-164": {
      "en": "Each example runs independently. “Try in editor” replaces the editor contents with the example and compiles and checks it.",
      "ja": "以下の各例は単独で実行可能です。「エディタで試す」をクリックすると、エディタの内容が該当コードに置き換わり、コンパイルと型検査が実行されます。"
    },
    "copy-165": {
      "en": "Identity and first-argument projection",
      "ja": "恒等関数と第 1 引数の射影"
    },
    "copy-166": {
      "en": "<code>id</code> returns its argument unchanged. <code>keep</code> takes two arguments of the same type and returns the first (the value passed earlier).",
      "ja": "<code>id</code> は受け取った引数をそのまま返します。<code>keep</code> は同じ型の引数を 2 つ受け取り、第 1 引数（先に渡された値）を返します。"
    },
    "copy-167": {
      "en": "Try in editor",
      "ja": "エディタで試す"
    },
    "copy-168": {
      "en": "Function composition (transitivity of implication)",
      "ja": "関数の合成（含意の推移律）"
    },
    "copy-169": {
      "en": "<code>ab x</code> has type <code>B</code>; applying <code>bc</code> gives <code>bc (ab x)</code> of type <code>C</code>. Taking propositional proofs as arguments derives implication transitivity (syllogism) with the same structure.",
      "ja": "項 <code>ab x</code> は型 <code>B</code> を持ち、それに <code>bc</code> を適用した <code>bc (ab x)</code> は型 <code>C</code> を持ちます。命題の証明を引数にとれば、同一の構造で含意の推移律（三段論法）を導出できます。"
    },
    "copy-171": {
      "en": "Dependent functions (types determined by arguments)",
      "ja": "依存関数（引数によって決まる型）"
    },
    "copy-172": {
      "en": "Type family <code>B</code> has kind <code>A -&gt; Type</code>; for an argument <code>x : A</code>, <code>B x</code> is a concrete type. <code>dependent_id</code> takes <code>y : B x</code> and returns it unchanged.",
      "ja": "型族 <code>B</code> のカインドは <code>A -&gt; Type</code> であり、引数 <code>x : A</code> に応じて <code>B x</code> が具体的な型となります。<code>dependent_id</code> は <code>y : B x</code> を受け取ってそのまま返す依存型の恒等関数です。"
    },
    "copy-174": {
      "en": "Implication introduction and elimination (natural deduction)",
      "ja": "含意の導入と除去（自然演繹）"
    },
    "copy-175": {
      "en": "<code>Imp P Q</code> is object-logic implication; <code>Prf P -&gt; Prf Q</code> is an LF function mapping a proof of <code>P</code> to a proof of <code>Q</code>. <code>imp_i</code> derives an implication proof from this transformation (introduction); <code>imp_e</code> derives the conclusion from proofs of the implication and premise (elimination / modus ponens).",
      "ja": "<code>Imp P Q</code> は対象論理における含意命題、<code>Prf P -&gt; Prf Q</code> は仮定 <code>P</code> の証明から <code>Q</code> の証明を導く LF の関数型です。<code>imp_i</code> はその証明変換関数から含意の証明を導出し（含意の導入規則）、<code>imp_e</code> は含意の証明と前提の証明から結論の証明を導出します（含意の除去規則 / モーダス・ポネンス）。"
    },
    "copy-177": {
      "en": "Type-level β reduction",
      "ja": "型レベルの β 簡約"
    },
    "copy-178": {
      "en": "Result type <code>(fun (x : A) =&gt; B x) a</code> is β-equivalent to <code>B a</code>, so <code>b</code> of type <code>B a</code> can be returned directly as the body.",
      "ja": "戻り値の型 <code>(fun (x : A) =&gt; B x) a</code> は β 簡約によって <code>B a</code> と同値になるため、型 <code>B a</code> を持つ <code>b</code> をそのまま関数本体として返すことができます。"
    },
    "copy-180": {
      "en": "Included mathematical proofs",
      "ja": "収録されている数学の証明"
    },
    "copy-181": {
      "en": "The “Proof examples” dropdown includes propositional logic, equality, natural numbers (Peano axioms), divisibility, the binomial theorem, infinitely many primes, irrationality of $\\sqrt{2}$, Fermat's little theorem, and Russell's paradox (no universal set). Dependencies include the required assumptions; selected main theorems appear first in the results.",
      "ja": "エディタ上部の「証明例」ドロップダウンから、命題論理、等式の性質、自然数（ペアノ公理）、整除性、二項定理、素数の無限性、$\\sqrt{2}$ の無理性、フェルマーの小定理、ラッセルのパラドックス（普遍集合の非存在）などを選択できます。依存する前提宣言を含めて展開され、選択した主要定理が検査結果の先頭に表示されます。"
    },
    "copy-182": {
      "en": "Writing proof terms",
      "ja": "証明項の書き方ガイド"
    },
    "copy-183": {
      "en": "Use <code>symbol</code> for undefined types/symbols, <code>axiom</code> for trusted logical rules/mathematical axioms, <code>def</code> for definitions, and <code>theorem</code> for proved rules/conclusions. <code>Divides</code> and <code>Prime</code> are definitions whose rules are proved from existing logical rules. Registering a conclusion with <code>axiom</code> makes it an assumption rather than a proof.",
      "ja": "未定義の型・記号は <code>symbol</code>、信頼する論理規則や数学的公理は <code>axiom</code>、定義は <code>def</code>、証明する規則や結論は <code>theorem</code> で記述します。<code>Divides</code> や <code>Prime</code> は定義であり、その導入・除去規則は既存の論理規則から証明します。結論を <code>axiom</code> で登録すると、証明ではなく仮定になります。"
    },
    "copy-184": {
      "en": "To construct a term of type <code>A -&gt; B -&gt; A</code>, take <code>x : A</code> and <code>y : B</code> and return a term of type <code>A</code>. Returning <code>x</code> satisfies this type.",
      "ja": "型 <code>A -&gt; B -&gt; A</code> の項を構成するには、<code>x : A</code> と <code>y : B</code> を引数として受け取り、型 <code>A</code> の項を返す関数を記述します。関数本体として <code>x</code> を返せば、この型を満たす証明項となります。"
    },
    "copy-185": {
      "en": "theorem first (x : A) (y : B) : A := x;\n// The same declaration without parameter shorthand:\n// theorem first : A -&gt; B -&gt; A :=\n//   fun (x : A) (y : B) =&gt; x;",
      "ja": "theorem first (x : A) (y : B) : A := x;\n// 同じ宣言を引数の省略形なしで書くと：\n// theorem first : A -&gt; B -&gt; A :=\n//   fun (x : A) (y : B) =&gt; x;"
    },
    "copy-186": {
      "en": "Given <code>f : A -&gt; B</code>, application <code>f x</code> for <code>x : A</code> yields a term of type <code>B</code>. Rules in dependent type theory also require explicit proposition/object arguments. In the Examples tab, <code>imp_e P P (self_imp P) p</code> passes propositions <code>P, P</code>, implication proof <code>self_imp P</code>, and premise proof <code>p</code>, in that order.",
      "ja": "項 <code>f : A -&gt; B</code> が存在する場合、<code>x : A</code> に対する関数適用 <code>f x</code> によって型 <code>B</code> の項が得られます。依存型理論に基づく規則では、命題や対象に関する引数も明示的に渡す必要があります。たとえば「例」タブの <code>imp_e P P (self_imp P) p</code> では、対象となる 2 つの命題 <code>P, P</code>、含意の証明 <code>self_imp P</code>、そして前提の証明 <code>p</code> を順番に渡しています。"
    },
    "copy-187": {
      "en": "After editing Hieratic, press “Compile and check”. Successfully checked declarations can be referenced by name in later proofs. Split complex proofs into <code>theorem</code> lemmas in dependency (topological) order. Editing clears previous results; check again when finished.",
      "ja": "Hieratic を編集した後は「コンパイルして検査」を押してください。検査に成功した宣言は、以降の証明から名前で参照できるようになります。複雑な証明は補題ごとに <code>theorem</code> として分割し、依存順（トポロジカル順）に並べます。エディタの入力を変更すると前回の検査結果はクリアされるため、編集完了後に再度検査を実行してください。"
    },
    "copy-188": {
      "en": "Reading and fixing errors",
      "ja": "エラーの読み方と対処法"
    },
    "copy-189": {
      "en": "Error",
      "ja": "エラーの種類"
    },
    "copy-190": {
      "en": "What to check",
      "ja": "確認する点"
    },
    "copy-191": {
      "en": "Syntax error",
      "ja": "構文エラー"
    },
    "copy-192": {
      "en": "Check declaration-ending semicolons <code>;</code>, annotation colons <code>:</code>, definition-body <code>:=</code>, and matching parentheses <code>()</code>.",
      "ja": "宣言末尾のセミコロン <code>;</code>、型注釈のコロン <code>:</code>、定義本体の <code>:=</code>、括弧 <code>()</code> の対応関係を確認してください。"
    },
    "copy-193": {
      "en": "Name not found",
      "ja": "名前が見つからない"
    },
    "copy-194": {
      "en": "Check identifier spelling and declaration order. Undeclared constants, later declarations, and self-reference (recursion) are unavailable.",
      "ja": "識別子の綴りと宣言の順序を確認してください。未宣言の定数、後続の宣言、および自分自身（再帰）は参照できません。"
    },
    "copy-195": {
      "en": "Argument type mismatch",
      "ja": "引数の型が合わない"
    },
    "copy-196": {
      "en": "Read the rule's type from the beginning and check argument count, order, and types. There are no implicit arguments; proposition arguments must also be explicit.",
      "ja": "規則の型定義を先頭から確認し、渡している引数の数・順序・型が合致しているか確認してください（暗黙引数はないため、命題引数などもすべて明示が必要です）。"
    },
    "copy-197": {
      "en": "Proof type mismatch",
      "ja": "証明の型が合わない"
    },
    "copy-198": {
      "en": "Compare the declared conclusion with the body's inferred type. The kernel does not unfold registered constants, so type matching cannot rely on unfolding their bodies.",
      "ja": "宣言した結論の型と、証明項本体から推論された型を比較してください。カーネルでは登録済み定数の本体を展開しないため、定義の展開に依存した型一致は行われません。"
    },
    "copy-199": {
      "en": "Cannot form a Π type",
      "ja": "Π型を形成できない"
    },
    "copy-200": {
      "en": "Check that the parameter type has sort <code>Type</code>. Binding the kind <code>Type</code> itself as <code>(A : Type)</code> is not allowed.",
      "ja": "引数の型が <code>Type</code> であるか確認してください。カインドである <code>Type</code> そのものを引数として束縛する <code>(A : Type)</code> は形成できません。"
    },
    "copy-201": {
      "en": "Proofglyph stack error",
      "ja": "Proofglyph のスタックエラー"
    },
    "copy-202": {
      "en": "<code>:</code> (assumption registration) needs exactly one type; <code>!</code> (theorem checking) needs exactly a type and term. Check for extra or missing elements.",
      "ja": "<code>:</code>（前提登録）の実行時はスタックに型 1 つのみ、<code>!</code>（定理検査）の実行時はスタックに型と項の 2 つのみが存在する必要があります。余分な項が残っているか、スタックが不足しています。"
    },
    "copy-203": {
      "en": "Using definitions (def)",
      "ja": "定義（def）を使用する際の注意"
    },
    "copy-204": {
      "en": "After <code>def id (x : A) : A := x;</code>, the compiler expands and β-reduces <code>id a</code> to <code>a</code>. Self/forward references are forbidden. Use <code>theorem</code> to retain a named opaque proof. Both pre-reduction terms and generated Proofglyph are checked.",
      "ja": "<code>def id (x : A) : A := x;</code> の後では、コンパイラが <code>id a</code> を本体へ展開して β 簡約するため <code>a</code> と等しくなります。自己参照や前方参照はできません。展開を避けて証明を名前で参照したい場合は <code>theorem</code> を使います。簡約前の項と生成した Proofglyph の両方を検査します。"
    },
    "attribute-0": {
      "en": "Workspace and documentation",
      "ja": "ワークスペースとドキュメント"
    },
    "attribute-1": {
      "en": "Excludes whitespace; #123 and $12 each count as one instruction.",
      "ja": "空白・改行を除外し、#123 や $12 はそれぞれ1命令として数えます。"
    },
    "attribute-2": {
      "en": "Specification contents",
      "ja": "言語仕様の目次"
    },
    "attribute-3": {
      "en": "Stack diagram. Scroll horizontally on narrow screens.",
      "ja": "スタック図。狭い画面では横にスクロールできます。"
    },
    "attribute-4": {
      "en": "Function body and checking stack diagram. Scroll horizontally on narrow screens.",
      "ja": "関数の本体と検査のスタック図。狭い画面では横にスクロールできます。"
    },
    "file-tabs-label": {
      "en": "Hieratic files",
      "ja": "Hieratic のファイル"
    }
  },
  "messages": {
    "invalidInstructions": {
      "en": "Instructions: — (invalid symbols)",
      "ja": "命令数: —（記号列が不正）"
    },
    "instructions": {
      "en": "Instructions: {count}",
      "ja": "命令数: {count}"
    },
    "noProofs": {
      "en": "Check passed (no proven declarations)",
      "ja": "検査成功（証明済みの宣言はありません）"
    },
    "assumption": {
      "en": "assumption",
      "ja": "前提"
    },
    "proven": {
      "en": "proven",
      "ja": "証明済み"
    },
    "passed": {
      "en": "Check passed",
      "ja": "検査成功"
    },
    "failed": {
      "en": "Check failed",
      "ja": "検査失敗"
    },
    "otherDeclarations": {
      "en": "Other declarations ({count})",
      "ja": "その他の宣言（{count}件）"
    },
    "cancelled": {
      "en": "Operation cancelled.",
      "ja": "処理を中止しました。"
    },
    "compiling": {
      "en": "Compiling and checking…",
      "ja": "コンパイル・検査中…"
    },
    "checking": {
      "en": "Checking…",
      "ja": "検査中…"
    },
    "compileFailed": {
      "en": "Compilation failed",
      "ja": "コンパイル失敗"
    },
    "checkFailure": {
      "en": "Check failed\n{error}",
      "ja": "検査失敗\n{error}"
    },
    "operationFailed": {
      "en": "Operation failed. Please try again.",
      "ja": "処理に失敗しました。再実行してください。"
    },
    "hieraticChanged": {
      "en": "Hieratic input changed. Run “Compile and check”.",
      "ja": "Hieratic の入力が変更されました。「コンパイルして検査」を実行してください。"
    },
    "proofglyphChanged": {
      "en": "Proofglyph input changed. Run “Check symbols”.",
      "ja": "Proofglyph の入力が変更されました。「記号列を検査」を実行してください。"
    },
    "catalogFailed": {
      "en": "Could not load the catalog: {error}",
      "ja": "カタログの読み込みに失敗しました: {error}"
    },
    "examples": {
      "en": "Proof examples",
      "ja": "証明例"
    },
    "sourceMissing": {
      "en": "Source not found: {path}",
      "ja": "ソースが見つかりません: {path}"
    },
    "initializeFailed": {
      "en": "Initialization failed: {error}",
      "ja": "初期化に失敗しました: {error}"
    },
    "workerLoadFailed": {
      "en": "Could not load the worker.",
      "ja": "Worker の読み込みに失敗しました。"
    },
    "workerResponseFailed": {
      "en": "Could not read the worker response.",
      "ja": "Worker の応答を読み取れませんでした。"
    },
    "entryFile": {
      "en": "{path} (entry file)",
      "ja": "{path}（メインファイル）"
    }
  },
  "catalog": {
    "Introduction：Identity, dependent types, β equivalence": {
      "en": "Introduction：Identity, dependent types, β equivalence",
      "ja": "入門：恒等関数・依存型・β同値"
    },
    "Introduction：Using proved implication composition": {
      "en": "Introduction：Using proved implication composition",
      "ja": "入門：証明済みの含意の合成を使う"
    },
    "Logic：Implication composition (A → B) → (B → C) → A → C": {
      "en": "Logic：Implication composition (A → B) → (B → C) → A → C",
      "ja": "論理：含意の合成 (A → B) → (B → C) → A → C"
    },
    "Logic：Argument exchange/duplication and function composition": {
      "en": "Logic：Argument exchange/duplication and function composition",
      "ja": "論理：引数の交換・複製、関数の合成"
    },
    "Logic：Conjunction commutativity and associativity (both directions)": {
      "en": "Logic：Conjunction commutativity and associativity (both directions)",
      "ja": "論理：連言の交換則・結合則（両方向）"
    },
    "Logic：Disjunction commutativity and case analysis": {
      "en": "Logic：Disjunction commutativity and case analysis",
      "ja": "論理：選言の交換則・場合分け"
    },
    "Logic：Contraposition (A → B) → (¬B → ¬A)": {
      "en": "Logic：Contraposition (A → B) → (¬B → ¬A)",
      "ja": "論理：対偶 (A → B) → (¬B → ¬A)"
    },
    "Logic：De Morgan laws ¬(A ∨ B) ⇔ (¬A ∧ ¬B), ¬(A ∧ B) ⇔ (¬A ∨ ¬B)": {
      "en": "Logic：De Morgan laws ¬(A ∨ B) ⇔ (¬A ∧ ¬B), ¬(A ∧ B) ⇔ (¬A ∨ ¬B)",
      "ja": "論理：ド・モルガン則 ¬(A ∨ B) ⇔ (¬A ∧ ¬B)、¬(A ∧ B) ⇔ (¬A ∨ ¬B)"
    },
    "Logic：Universal specialization and existential witnesses": {
      "en": "Logic：Universal specialization and existential witnesses",
      "ja": "論理：全称の具体化・存在への証人導入"
    },
    "Equality：Symmetry, transitivity, and function congruence": {
      "en": "Equality：Symmetry, transitivity, and function congruence",
      "ja": "等式：対称律・推移律・関数による保存"
    },
    "Natural numbers：Strong induction": {
      "en": "Natural numbers：Strong induction",
      "ja": "自然数：強い帰納法"
    },
    "Natural numbers：0 + n = n, n + 0 = n": {
      "en": "Natural numbers：0 + n = n, n + 0 = n",
      "ja": "自然数：0 + n = n, n + 0 = n"
    },
    "Natural numbers：Addition associativity and commutativity": {
      "en": "Natural numbers：Addition associativity and commutativity",
      "ja": "自然数：加算の結合則・交換則"
    },
    "Natural numbers：Multiplication distributivity (both sides), associativity, and commutativity": {
      "en": "Natural numbers：Multiplication distributivity (both sides), associativity, and commutativity",
      "ja": "自然数：乗算の分配則（両側）・結合則・交換則"
    },
    "Natural numbers：a^(m+n) = a^m a^n": {
      "en": "Natural numbers：a^(m+n) = a^m a^n",
      "ja": "自然数：a^(m+n) = a^m a^n"
    },
    "Natural numbers：Sums of two even or two odd numbers are even": {
      "en": "Natural numbers：Sums of two even or two odd numbers are even",
      "ja": "自然数：偶数同士・奇数同士の和は偶数"
    },
    "Natural numbers：2Σ(k=1..n) k = n(n+1)": {
      "en": "Natural numbers：2Σ(k=1..n) k = n(n+1)",
      "ja": "自然数：2Σ(k=1..n) k = n(n+1)"
    },
    "Natural numbers：1 + 3 + … + (2n−1) = n²": {
      "en": "Natural numbers：1 + 3 + … + (2n−1) = n²",
      "ja": "自然数：1 + 3 + … + (2n−1) = n²"
    },
    "Number theory：Divisibility transitivity and preservation under sums/products": {
      "en": "Number theory：Divisibility transitivity and preservation under sums/products",
      "ja": "整数論：整除性の推移律・和・積への保存"
    },
    "Number theory：Congruence preservation under addition, multiplication, and powers": {
      "en": "Number theory：Congruence preservation under addition, multiplication, and powers",
      "ja": "整数論：合同式の加算・乗算・累乗による保存"
    },
    "Number theory：Division algorithm (existence of quotient and remainder)": {
      "en": "Number theory：Division algorithm (existence of quotient and remainder)",
      "ja": "整数論：除法の原理（商と余りの存在）"
    },
    "Number theory：Existence of prime factors": {
      "en": "Number theory：Existence of prime factors",
      "ja": "整数論：素因数の存在"
    },
    "Number theory：Euclid's lemma and divisibility of squares": {
      "en": "Number theory：Euclid's lemma and divisibility of squares",
      "ja": "整数論：ユークリッドの補題・平方の整除性"
    },
    "Number theory：A prime p divides C(p,k) for 0 < k < p": {
      "en": "Number theory：A prime p divides C(p,k) for 0 < k < p",
      "ja": "整数論：素数 p は C(p,k) を割り切る（0 < k < p）"
    },
    "Number theory：Binomial theorem": {
      "en": "Number theory：Binomial theorem",
      "ja": "整数論：二項定理"
    },
    "Number theory：Infinitely many primes": {
      "en": "Number theory：Infinitely many primes",
      "ja": "整数論：素数は無限に存在する"
    },
    "Number theory：Irrationality of √2": {
      "en": "Number theory：Irrationality of √2",
      "ja": "整数論：√2 の無理性"
    },
    "Number theory：Fermat's little theorem and application to sums": {
      "en": "Number theory：Fermat's little theorem and application to sums",
      "ja": "整数論：フェルマーの小定理と和への適用"
    },
    "Set theory：No universal set via Russell’s paradox": {
      "en": "Set theory：No universal set via Russell’s paradox",
      "ja": "集合論：ラッセルのパラドックスから普遍集合の非存在を示す"
    }
  }
};
if (typeof module !== "undefined") module.exports = proofglyphTranslations;
else globalThis.proofglyphTranslations = proofglyphTranslations;
