"use strict";
// Format checked kernel types or their corresponding named source types.
// All arbitrary identifiers are escaped for TeX.
(function (root) {
  const identifier = name => /^[A-Za-z]$/.test(name) ? name
    : `\\mathrm{${name.replace(/[\\{}_$%&#^~]/g, c => ({"\\": "\\backslash{}", "^": "\\textasciicircum{}", "~": "\\textasciitilde{}"}[c] || `\\${c}`))}}`;
  function application(t) {
    const args = [];
    while (t[0] === "app") { args.unshift(t[2]); t = t[1]; }
    return [t, args];
  }
  function uses(t, index = 0) {
    if (t[0] === "var") return t[1] === index;
    if (["pi", "lam"].includes(t[0])) return uses(t[1], index) || uses(t[2], index + 1);
    return t[0] === "app" && (uses(t[1], index) || uses(t[2], index));
  }
  function toLatex(term) {
    const constants = new Set();
    function collect(t) {
      if (t[0] === "const") constants.add(t[1]);
      if (["app", "pi", "lam"].includes(t[0])) { collect(t[1]); collect(t[2]); }
    }
    collect(term);
    const fresh = (domain, ctx) => {
      const pool = domain[0] === "const" && domain[1] === "Nat" ? ["n", "m", "k", "a", "b", "p"] : ["x", "y", "z", "u", "v"];
      return pool.find(n => !ctx.includes(n) && !constants.has(n)) || `x_{${ctx.length}}`;
    };
    const paren = text => `\\left(${text}\\right)`;
    function priority(t) {
      if (["pi", "lam"].includes(t[0])) return 0;
      const [head, args] = application(t), name = head[0] === "const" ? head[1] : null;
      if (name === "Prf" && args.length === 1) return priority(args[0]);
      return ({All: 0, AllNat: 0, AllSeq: 0, Exists: 0, Imp: 1, Or: 2, And: 3,
        Eq: 4, Mem: 4, Le: 4, Lt: 4, Divides: 4, Cong: 4, Not: 5,
        add: 6, succ: 6, mul: 7, sum: 7, pow: 8})[name] ?? 9;
    }
    function go(t, ctx = [], minimum = 0) {
      const text = render(t, ctx);
      return priority(t) < minimum ? paren(text) : text;
    }
    function endsInProof(t) {
      while (t[0] === "pi") t = t[2];
      const [head, args] = application(t);
      return head[0] === "const" && head[1] === "Prf" && args.length === 1;
    }
    function render(t, ctx) {
      const [tag, a, b] = t;
      if (tag === "type" || tag === "kind") return `\\mathsf{${tag === "type" ? "Type" : "Kind"}}`;
      if (tag === "var") return ctx[a] || `v_{${a}}`;
      if (tag === "const") return ({Nat: "\\mathbb{N}", zero: "0", False: "\\bot", Prop: "\\mathsf{Prop}"})[a] || identifier(a);
      if (tag === "pi") {
        const quantified = a[0] === "type" ||
          (a[0] === "const" && ["Nat", "U", "Prop"].includes(a[1]) && endsInProof(b));
        if (!uses(b) && !quantified)
          return `${go(a, ctx, 2)} \\to ${go(b, ["h", ...ctx], 1)}`;
        const x = fresh(a, ctx);
        return `\\forall ${x}${a[0] === "const" && a[1] === "Nat" ? "\\in" : ":"}${go(a, ctx)},\\; ${go(b, [x, ...ctx])}`;
      }
      if (tag === "lam") {
        const x = fresh(a, ctx);
        return `\\lambda ${x}:${go(a, ctx)}.\\; ${go(b, [x, ...ctx])}`;
      }
      const [head, args] = application(t);
      const name = head[0] === "const" ? head[1] : null;
      const g = (i, minimum = 0) => go(args[i], ctx, minimum);
      const binary = (op, level) => `${g(0, level)} ${op} ${g(1, level + 1)}`;
      if (name === "Prf" && args.length === 1) return g(0);
      if (name === "succ" && args.length === 1) {
        let n = 1, rest = args[0];
        while (rest[0] === "app" && rest[1][0] === "const" && rest[1][1] === "succ") { n++; rest = rest[2]; }
        if (rest[0] === "const" && rest[1] === "zero") return String(n);
        return `${g(0, 6)}+1`;
      }
      if (args.length === 2) {
        const op = {Eq: "=", And: "\\land", Or: "\\lor", Imp: "\\to", Mem: "\\in", Le: "\\le", Lt: "<", Divides: "\\mid", add: "+", mul: "\\cdot"}[name];
        if (op) {
          const same = JSON.stringify(args[0]) === JSON.stringify(args[1]);
          if (name === "mul" && same) return `{${g(0, 8)}}^2`;
          if (name === "add" && same) return `2 \\cdot ${g(0, 8)}`;
          if (name === "Imp") return `${g(0, 2)} \\to ${g(1, 1)}`;
          return binary(op, priority(t));
        }
        if (name === "pow") return `{${g(0, 8)}}^{${g(1)}}`;
      }
      if (name === "Not" && args.length === 1) return `\\neg ${g(0, 5)}`;
      if (name === "Cong" && args.length === 3) return `${g(0)} \\equiv ${g(1)} \\pmod{${g(2)}}`;
      if (["All", "AllNat", "AllSeq", "Exists"].includes(name) && args.length === 1 && args[0][0] === "lam") {
        const [, domain, body] = args[0], x = fresh(domain, ctx);
        return `${name === "Exists" ? "\\exists" : "\\forall"} ${x}${domain[0] === "const" && domain[1] === "Nat" ? "\\in" : ":"}${go(domain, ctx)},\\; ${go(body, [x, ...ctx])}`;
      }
      if (name === "sum" && args.length === 2) {
        const f = args[1], k = fresh(["const", "Nat"], ["n", "m", ...ctx]);
        const body = f[0] === "lam" ? go(f[2], [k, ...ctx]) : `${paren(g(1))}(${k})`;
        return `\\sum_{${k}=0}^{${g(0)}-1} ${paren(body)}`;
      }
      if (name === "triangular" && args.length === 1) {
        const k = fresh(["const", "Nat"], ["n", "m", ...ctx]);
        return `\\sum_{${k}=1}^{${g(0)}} ${k}`;
      }
      if (name === "factorial" && args.length === 1) return `${paren(g(0))}!`;
      if (name === "choose" && args.length === 2) return `\\binom{${g(0)}}{${g(1)}}`;
      // Ordinary functions and predicates retain their names instead of inventing meanings.
      return `${head[0] === "const" ? go(head, ctx) : paren(go(head, ctx))}\\left(${args.map((_, i) => g(i)).join(",\\;")}\\right)`;
    }
    return {latex: go(term)};
  }
  root.proofglyphMath = {toLatex};
  if (typeof module !== "undefined") module.exports = root.proofglyphMath;
})(globalThis);
