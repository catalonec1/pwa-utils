/* Stelar SQL Formatter — Oracle SQL and PL/SQL. Pure functions, no DOM.
   lex (tokenizer) → split (statements, ; and / terminators) → format (stack de contexte).
   Formatarea nu adaugă și nu scoate tokenuri: schimbă doar spațiile, liniile și majusculele. */
(function (global) {
  'use strict';
  const set = s => new Set(s.trim().split(/\s+/));
  const KW = set(`SELECT FROM WHERE AND OR NOT IN IS NULL LIKE LIKEC ESCAPE BETWEEN EXISTS AS ON JOIN INNER LEFT RIGHT FULL OUTER CROSS NATURAL USING
    GROUP BY ORDER HAVING UNION ALL INTERSECT MINUS EXCEPT DISTINCT UNIQUE INSERT INTO VALUES UPDATE SET DELETE MERGE MATCHED WHEN THEN ELSE END CASE
    WITH CONNECT START PRIOR NOCYCLE SIBLINGS LEVEL ROWNUM ASC DESC NULLS FIRST LAST FETCH NEXT ROWS ROW ONLY OFFSET TIES PERCENT FOR OF NOWAIT WAIT
    SKIP LOCKED PARTITION OVER WITHIN KEEP RANGE UNBOUNDED PRECEDING FOLLOWING CURRENT RETURNING RETURN LOG ERRORS REJECT LIMIT UNLIMITED CREATE
    ALTER DROP TRUNCATE TABLE VIEW INDEX SEQUENCE SYNONYM TRIGGER PROCEDURE FUNCTION PACKAGE BODY TYPE OBJECT GRANT REVOKE TO PUBLIC COMMENT COMMIT
    ROLLBACK SAVEPOINT CONSTRAINT PRIMARY KEY FOREIGN REFERENCES CHECK DEFAULT ENABLE DISABLE CASCADE PURGE ADD MODIFY RENAME COLUMN GLOBAL TEMPORARY
    PRESERVE TABLESPACE BEGIN DECLARE EXCEPTION ELSIF IF LOOP WHILE EXIT CONTINUE GOTO RAISE CURSOR OPEN CLOSE FORALL BULK COLLECT PRAGMA
    AUTONOMOUS_TRANSACTION SERIALLY_REUSABLE SESSION RECORD VARRAY CONSTANT ROWTYPE OUT NOCOPY AUTHID DEFINER CURRENT_USER DETERMINISTIC
    PIPELINED PIPE PARALLEL_ENABLE RESULT_CACHE EACH BEFORE AFTER INSTEAD STATEMENT REFERENCING OLD NEW FOLLOWS PRECEDES EXECUTE IMMEDIATE SQL FOUND
    NOTFOUND ROWCOUNT ISOPEN BULK_ROWCOUNT BULK_EXCEPTIONS OTHERS NO_DATA_FOUND TOO_MANY_ROWS DUP_VAL_ON_INDEX ZERO_DIVIDE VALUE_ERROR INVALID_NUMBER
    INVALID_CURSOR CURSOR_ALREADY_OPEN TRUE FALSE SYSDATE SYSTIMESTAMP CURRENT_DATE CURRENT_TIMESTAMP USER UID REPLACE EDITIONABLE NONEDITIONABLE
    MEMBER STATIC CONSTRUCTOR MAP SELF LANGUAGE EXTERNAL PIVOT UNPIVOT ANY SOME LATERAL APPLY ZONE LOCAL TIME YEAR MONTH DAY HOUR MINUTE SECOND
    MATERIALIZED REFRESH EXPLAIN PLAN LOCK MODE SHARE EXCLUSIVE NOLOGGING LOGGING COMPRESS PARALLEL NOPARALLEL SUBTYPE REF INCREMENT MAXVALUE MINVALUE
    CYCLE CACHE NOCACHE GENERATED ALWAYS IDENTITY VISIBLE INVISIBLE FORCE COMPOUND INDICES MULTISET SAMPLE VERSIONS SCN`);
  const FN = set(`ABS ACOS ADD_MONTHS ASCII ASIN ATAN AVG BITAND CAST CEIL CHR COALESCE CONCAT CORR COS COUNT CUME_DIST DECODE DENSE_RANK DUMP EXP
    EXTRACT FIRST_VALUE FLOOR GREATEST GROUPING INITCAP INSTR LAG LAST_DAY LAST_VALUE LEAD LEAST LENGTH LISTAGG LN LOWER LPAD LTRIM MAX MEDIAN MIN MOD
    MONTHS_BETWEEN NEXT_DAY NTILE NULLIF NUMTODSINTERVAL NUMTOYMINTERVAL NVL NVL2 PERCENT_RANK POWER RANK RATIO_TO_REPORT REGEXP_COUNT REGEXP_INSTR
    REGEXP_LIKE REGEXP_REPLACE REGEXP_SUBSTR ROUND ROW_NUMBER RPAD RTRIM SIGN SIN SQRT STDDEV SUBSTR SUM SYS_CONTEXT SYS_GUID TO_CHAR TO_CLOB TO_DATE
    TO_NUMBER TO_TIMESTAMP TRANSLATE TRIM TRUNC UPPER VARIANCE XMLAGG XMLELEMENT JSON_VALUE JSON_TABLE JSON_OBJECT JSON_ARRAYAGG JSON_QUERY TREAT
    SQLERRM SQLCODE RAISE_APPLICATION_ERROR EXCEPTION_INIT EMPTY_CLOB EMPTY_BLOB STANDARD_HASH ORA_HASH`);
  const TY = set(`VARCHAR2 VARCHAR NVARCHAR2 CHAR NCHAR NUMBER INTEGER INT SMALLINT DECIMAL NUMERIC FLOAT REAL DATE TIMESTAMP INTERVAL CLOB NCLOB
    BLOB BFILE RAW LONG ROWID UROWID BOOLEAN PLS_INTEGER BINARY_INTEGER SIMPLE_INTEGER BINARY_FLOAT BINARY_DOUBLE XMLTYPE`);
  const UNARY_AFTER = set('SELECT WHERE AND OR NOT THEN ELSE WHEN RETURN BY BETWEEN LIKE IN CASE DEFAULT VALUES SET HAVING ON');
  const SQL_START = set('SELECT WITH INSERT UPDATE DELETE MERGE');
  const SUB_HEAD = set('PROCEDURE FUNCTION MEMBER STATIC CONSTRUCTOR MAP ORDER OVERRIDING FINAL INSTANTIABLE');
  const PLUS = set(`PROMPT SPOOL REM REMARK DEFINE UNDEFINE COLUMN COL TTITLE BTITLE BREAK COMPUTE WHENEVER EXEC EXECUTE SHOW DESC DESCRIBE
    PAUSE ACCEPT VARIABLE VAR PRINT CLEAR HOST TIMING CONNECT DISCONNECT START SET EXIT QUIT`);
  const JOINS = ['JOIN', 'INNER JOIN', 'LEFT JOIN', 'LEFT OUTER JOIN', 'RIGHT JOIN', 'RIGHT OUTER JOIN', 'FULL JOIN', 'FULL OUTER JOIN', 'CROSS JOIN',
    'NATURAL JOIN', 'NATURAL LEFT JOIN', 'NATURAL RIGHT JOIN', 'CROSS APPLY', 'OUTER APPLY'];
  /* bl = bloc cu listă (virgulă = linie nouă), ba = bloc cu AND/OR pe linii, in = pe aceeași linie, al = singur pe linie, mw = MERGE WHEN, jn = JOIN */
  const CL = {
    'SELECT': 'bl', 'SELECT DISTINCT': 'bl', 'SELECT UNIQUE': 'bl', 'SELECT ALL': 'bl', 'FROM': 'bl', 'GROUP BY': 'bl', 'ORDER BY': 'bl',
    'ORDER SIBLINGS BY': 'bl', 'SET': 'bl', 'UPDATE SET': 'bl', 'WITH': 'bl',
    'WHERE': 'ba', 'HAVING': 'ba', 'CONNECT BY': 'ba', 'CONNECT BY NOCYCLE': 'ba', 'START WITH': 'ba',
    'INSERT INTO': 'in', 'INSERT ALL': 'in', 'INSERT FIRST': 'in', 'INSERT': 'in', 'UPDATE': 'in', 'DELETE FROM': 'in', 'DELETE': 'in',
    'MERGE INTO': 'in', 'USING': 'in', 'INTO': 'in', 'BULK COLLECT INTO': 'in', 'VALUES': 'in', 'RETURNING': 'in', 'FETCH FIRST': 'in',
    'FETCH NEXT': 'in', 'OFFSET': 'in', 'FOR UPDATE': 'in', 'LOG ERRORS': 'in',
    'UNION': 'al', 'UNION ALL': 'al', 'INTERSECT': 'al', 'MINUS': 'al', 'EXCEPT': 'al',
    'WHEN MATCHED THEN': 'mw', 'WHEN NOT MATCHED THEN': 'mw'
  };
  JOINS.forEach(j => { CL[j] = 'jn'; });
  const PHRASES = Object.keys(CL).concat(['ON', 'AND', 'OR', 'BETWEEN']).map(s => s.split(' ')).sort((a, b) => b.length - a.length);
  const Q_CLOSE = { '[': ']', '{': '}', '(': ')', '<': '>' };
  const TWO = new Set(['||', ':=', '=>', '<>', '!=', '^=', '~=', '<=', '>=', '..', '**', '<<', '>>']);
  const wordStart = c => /[A-Za-z_À-￿]/.test(c);
  const wordChar = c => /[A-Za-z0-9_$#À-￿]/.test(c);
  const isCmt = t => t.type === 'lcomment' || t.type === 'bcomment';

  /* ---------- tokenizer ---------- */
  /* Next token at or after position i, or null. nl = line breaks skipped before it. */
  function lex(src, i) {
    const n = src.length;
    let nl = 0;
    while (i < n && /\s/.test(src[i])) { if (src[i] === '\n') nl++; i++; }
    if (i >= n) return null;
    const s = i, c = src[i], c2 = src[i + 1] || '';
    const tok = (type, e) => ({ type, text: src.slice(s, e), start: s, end: e, nl });
    if (c === '-' && c2 === '-') {
      let e = src.indexOf('\n', i); if (e < 0) e = n;
      if (src[e - 1] === '\r') e--;
      return tok('lcomment', e);
    }
    if (c === '/' && c2 === '*') { const e = src.indexOf('*/', i + 2); return tok('bcomment', e < 0 ? n : e + 2); }
    // q'[...]' și nq'[...]'
    let qs = -1;
    if ((c === 'q' || c === 'Q') && c2 === "'") qs = i + 2;
    else if ((c === 'n' || c === 'N') && (c2 === 'q' || c2 === 'Q') && src[i + 2] === "'") qs = i + 3;
    if (qs >= 0 && qs < n && !/\s/.test(src[qs])) {
      const op = src[qs], cl = Q_CLOSE[op] || op, e = src.indexOf(cl + "'", qs + 1);
      return tok('string', e < 0 ? n : e + 2);
    }
    if (c === "'" || ((c === 'n' || c === 'N') && c2 === "'")) {
      let k = c === "'" ? i + 1 : i + 2;
      for (; k < n; k++) {
        if (src[k] === "'") { if (src[k + 1] === "'") { k++; continue; } k++; break; }
      }
      return tok('string', Math.min(k, n));
    }
    if (c === '"') { const e = src.indexOf('"', i + 1); return tok('quoted', e < 0 ? n : e + 1); }
    if (c === ':' && c2 !== '=' && (wordChar(c2) || /\d/.test(c2))) {
      let k = i + 1; while (k < n && wordChar(src[k])) k++;
      return tok('bind', k);
    }
    if (c === '&') {
      let k = i + 1; if (src[k] === '&') k++;
      if (k < n && wordStart(src[k])) { while (k < n && wordChar(src[k])) k++; return tok('bind', k); }
    }
    if (wordStart(c)) { let k = i + 1; while (k < n && wordChar(src[k])) k++; return tok('word', k); }
    if (/\d/.test(c) || (c === '.' && /\d/.test(c2))) {
      let k = i; while (k < n && /\d/.test(src[k])) k++;
      if (src[k] === '.' && src[k + 1] !== '.') { k++; while (k < n && /\d/.test(src[k])) k++; }
      if (/[eE]/.test(src[k] || '') && /[\d+-]/.test(src[k + 1] || '')) { k += 2; while (k < n && /\d/.test(src[k])) k++; }
      if (/[dDfF]/.test(src[k] || '') && !wordChar(src[k + 1] || '')) k++;
      return tok('number', k);
    }
    if (c === '/') { // SQL*Plus: un „/” singur pe linie termină instrucțiunea
      const ls = src.lastIndexOf('\n', i - 1) + 1; let le = src.indexOf('\n', i); if (le < 0) le = n;
      if (!src.slice(ls, i).trim() && !src.slice(i + 1, le).trim()) return tok('slash', i + 1);
    }
    if (TWO.has(c + c2)) return tok('symbol', i + 2);
    return tok('symbol', i + 1);
  }
  function tokenize(src) {
    const out = []; let t, p = 0;
    while ((t = lex(src, p))) { out.push(t); p = t.end; }
    return out;
  }

  /* ---------- împărțire în instrucțiuni ---------- */
  function sigAhead(src, pos, k) { // k tokenuri semnificative de la pos
    const r = []; let t;
    while (r.length < k && (t = lex(src, pos))) { if (!isCmt(t)) r.push(t); pos = t.end; }
    return r;
  }
  const up = t => (t && t.type === 'word' ? t.text.toUpperCase() : t ? t.text : '');
  function createKind(words) { // words: cuvinte după CREATE (majuscule)
    const skip = set('OR REPLACE EDITIONABLE NONEDITIONABLE EDITIONING NONEDITIONING FORCE NOFORCE');
    let k = 0; while (k < words.length && skip.has(words[k])) k++;
    const w = words[k];
    if (w === 'PROCEDURE' || w === 'FUNCTION') return 'SUB';
    if (w === 'PACKAGE') return 'PKG';
    if (w === 'TYPE') return words[k + 1] === 'BODY' ? 'PKG' : 'OTHER';
    if (w === 'TRIGGER') return 'TRIGGER';
    return 'OTHER';
  }
  function isPlStart(src, t) {
    const w = up(t);
    if (w === 'DECLARE' || w === 'BEGIN' || w === '<<') return true;
    if (w !== 'CREATE') return false;
    return createKind(sigAhead(src, t.end, 8).map(up)) !== 'OTHER';
  }
  function isPlusLine(src, t) {
    if (src.slice(src.lastIndexOf('\n', t.start - 1) + 1, t.start).trim()) return false;
    if (t.text === '@' || t.text === '@@') return true;
    const w = up(t);
    if (t.type !== 'word' || !PLUS.has(w)) return false;
    const nx = up(sigAhead(src, t.end, 1)[0]);
    if (w === 'SET') return !/^(TRANSACTION|ROLE|CONSTRAINTS?)$/.test(nx);
    if (w === 'EXECUTE') return nx !== 'IMMEDIATE';
    return true;
  }
  /* Units: {kind: sql|plsql|cmd|comment, tokens, start, end, slash} */
  function split(src) {
    src = String(src == null ? '' : src);
    const list = []; let pos = 0, last = null, t;
    while ((t = lex(src, pos))) {
      if (t.type === 'slash') { if (last && !last.slash && last.kind !== 'cmd') { last.slash = true; last.end = t.end; } pos = t.end; continue; }
      const u = { kind: 'sql', tokens: [], start: t.start, end: t.end, slash: false };
      while (t && isCmt(t)) { u.tokens.push(t); u.end = t.end; pos = t.end; t = lex(src, pos); }
      if (!t || t.type === 'slash') { u.kind = 'comment'; list.push(u); last = u; continue; }
      if (isPlusLine(src, t)) {
        let e = src.indexOf('\n', t.start); if (e < 0) e = src.length;
        u.kind = 'cmd'; u.end = e; u.tokens = []; list.push(u); last = u; pos = e; continue;
      }
      u.kind = isPlStart(src, t) ? 'plsql' : 'sql';
      const ck = u.kind === 'plsql' && up(t) === 'CREATE' ? createKind(sigAhead(src, t.end, 8).map(up)) : '';
      const stack = []; let hdr = false, paren = 0, prevW = '', started = false;
      for (;;) {
        u.tokens.push(t); u.end = t.end; pos = t.end;
        if (u.kind === 'sql') { if (t.text === ';' && t.type === 'symbol') break; }
        else if (t.type === 'symbol') {
          if (t.text === '(') paren++;
          else if (t.text === ')') paren = Math.max(0, paren - 1);
          else if (t.text === ';') { hdr = false; if (started && !stack.length) break; }
        } else if (t.type === 'word') {
          const w = t.text.toUpperCase(), top = stack[stack.length - 1];
          if ((w === 'PROCEDURE' || w === 'FUNCTION') && !paren) hdr = true;
          else if ((w === 'IS' || w === 'AS') && !paren) {
            if (ck === 'PKG' && !started) { stack.push('pkg'); started = true; }
            else if (hdr) {
              hdr = false;
              const nx = up(sigAhead(src, t.end, 1)[0]);
              if (nx !== 'LANGUAGE' && nx !== 'EXTERNAL') { stack.push('sub'); started = true; }
            }
          } else if (w === 'DECLARE') { stack.push('decl'); started = true; }
          else if (w === 'BEGIN') { if (top === 'sub' || top === 'decl' || top === 'pkg') stack[stack.length - 1] = 'begin'; else stack.push('begin'); started = true; }
          else if ((w === 'IF' || w === 'LOOP' || w === 'CASE') && prevW !== 'END') stack.push(w);
          else if (w === 'END') stack.pop();
          prevW = w;
        }
        t = lex(src, pos);
        if (!t) break;
        if (t.type === 'slash') { u.slash = true; u.end = t.end; pos = t.end; break; }
      }
      list.push(u); last = u;
    }
    return list;
  }

  /* ---------- clasificare și majuscule ---------- */
  function classify(T) {
    return T.map((t, i) => {
      if (t.type !== 'word') return null;
      const u = t.text.toUpperCase();
      let p = i - 1; while (p >= 0 && isCmt(T[p])) p--;
      let n = i + 1; while (n < T.length && isCmt(T[n])) n++;
      const pt = p >= 0 ? T[p].text : '', nt = n < T.length ? T[n].text : '';
      if (pt === '%') return 'k';
      if (pt === '.' || nt === '.' || nt === '=>') return 'i';
      if (FN.has(u)) return 'f';
      if (KW.has(u) || TY.has(u)) return 'k';
      return 'i';
    });
  }
  const applyCase = (s, m) => (m === 'upper' ? s.toUpperCase() : m === 'lower' ? s.toLowerCase() : s);

  /* ---------- ieșire ---------- */
  function Out(w, flat) { this.w = w; this.flat = flat; this.L = []; this.cur = ''; this.g = null; this.depth = 0; this.pend = 0; this.pg = null; this.bl = false; this.lc = -1; }
  Out.prototype = {
    nl(d, g) { if (this.flat) return; this.pend = Math.max(0, d); this.pg = g == null ? null : g; },
    blank() { if (!this.flat) this.bl = true; },
    push() { if (this.cur.trim()) this.L.push({ t: this.cur.replace(/\s+$/, ''), g: this.g }); this.cur = ''; this.lc = -1; },
    start(text) {
      this.push();
      if (this.bl && this.L.length) this.L.push({ t: '', g: null });
      this.bl = false;
      this.cur = ' '.repeat(this.w * this.pend) + text; this.depth = this.pend; this.g = this.pg; this.pend = null; this.pg = null;
    },
    put(text, sp, lc) {
      if (this.flat) { this.cur += (this.cur && sp ? ' ' : '') + text; return; }
      if (this.pend === null && this.lc >= 0) this.pend = this.depth;
      if (this.pend !== null || !this.cur.trim()) { if (this.pend === null) this.pend = this.depth; this.start(text); }
      else this.cur += (sp ? ' ' : '') + text;
      if (lc) this.lc = this.cur.length - text.length;
    },
    attach(text) { // , și ; rămân pe linia curentă, înaintea unui comentariu -- de la final
      if (!this.cur.trim()) return this.put(text, false);
      if (this.lc >= 0) {
        const c = this.cur.slice(this.lc);
        this.cur = this.cur.slice(0, this.lc).replace(/\s+$/, '') + text + ' ' + c; this.lc = this.cur.length - c.length;
      } else this.cur += text;
    },
    trail(text, lc) { this.cur += ' ' + text; if (lc) this.lc = this.cur.length - text.length; },
    raw(text) {
      this.push();
      if (this.bl && this.L.length) this.L.push({ t: '', g: null });
      this.bl = false;
      for (const l of text.split('\n')) this.L.push({ t: l.replace(/\s+$/, ''), g: null });
      this.pend = 0; this.depth = 0;
    },
    text(align) {
      this.push();
      if (align) {
        const gs = new Map();
        this.L.forEach(l => { if (l.g != null && l.t.split('\u0001').length === 2) { if (!gs.has(l.g)) gs.set(l.g, []); gs.get(l.g).push(l); } });
        for (const ls of gs.values()) {
          if (ls.length < 2) continue;
          const m = Math.max(...ls.map(l => l.t.indexOf('\u0001')));
          for (const l of ls) { const k = l.t.indexOf('\u0001'); l.t = l.t.slice(0, k).padEnd(m) + l.t.slice(k); }
        }
      }
      return this.L.map(l => l.t).join('\n').replace(/\u0001/g, '');
    }
  };

  /* ---------- formatarea unei instrucțiuni ---------- */
  function fmtUnit(u, o, out) {
    const T = u.tokens, N = T.length, cls = classify(T);
    const nxt = i => { for (let j = i + 1; j < N; j++) if (!isCmt(T[j])) return j; return -1; };
    const prv = i => { for (let j = i - 1; j >= 0; j--) if (!isCmt(T[j])) return j; return -1; };
    const U = i => (i >= 0 && i < N ? up(T[i]) : '');
    const caseText = i => (cls[i] ? applyCase(T[i].text, cls[i] === 'i' ? o.identCase : o.keywordCase) : T[i].text);
    const frames = [], top = () => frames[frames.length - 1];
    let last = null, lastIdx = -1, unary = false, gid = 0;

    function needSpace(t, force) {
      const p = last;
      if (!p) return false;
      if (force === true) return true;
      if (unary) return false;
      if (isCmt(t) || isCmt(p)) return true;
      const a = p.text, b = t.text;
      if (t.type === 'symbol' || t.type === 'slash') {
        if (/^(,|;|\)|\.|%|@|\.\.|>>)$/.test(b)) return false;
        if (b === '(') {
          if (p.type === 'word') return cls[lastIdx] === 'k' && !TY.has(a.toUpperCase());
          if (p.type === 'quoted' || p.type === 'bind') return false;
          return a !== '(' && a !== '.';
        }
      }
      if (p.type === 'symbol' && /^(\(|\.|%|@|\.\.|<<)$/.test(a)) return false;
      return true;
    }
    function emit(i, x) {
      x = x || {};
      const t = T[i], len = x.len || 1, lt = T[i + len - 1];
      out.put(x.text != null ? x.text : caseText(i), needSpace(t, x.sp));
      const wasUnary = (t.text === '-' || t.text === '+') && t.type === 'symbol' &&
        (!last || (last.type === 'symbol' && last.text !== ')') || (last.type === 'word' && UNARY_AFTER.has(last.text.toUpperCase()) && cls[lastIdx] === 'k'));
      unary = wasUnary; last = lt; lastIdx = i + len - 1;
      const f = top(); if (f) f.n++;
    }
    function attach(i) { out.attach(T[i].text); unary = false; last = T[i]; lastIdx = i; }
    function pl(kind, own) { return { k: 'pl', kind, own, sd: own + (kind === 'pcase' ? 2 : 1), ps: null, exc: false, n: 0 }; }
    function pushSql(base, i) {
      const w = U(i);
      let ct = false;
      if (w === 'CREATE') for (let j = i, k = 0; k < 5; k++) { j = nxt(j); if (j < 0) break; if (U(j) === 'TABLE') { ct = true; break; } }
      frames.push({ k: 'sql', base, cb: base, cl: null, mode: null, dml: SQL_START.has(w) || w === '(', bt: false, jo: false, id: ++gid, n: 0, ct, ctDone: false });
      out.nl(base);
    }

    function comment(i) {
      const t = T[i], lc = t.type === 'lcomment', f = top();
      let text = lc ? t.text.replace(/\s+$/, '') : t.text;
      if (out.flat) {
        if (lc) text = '/* ' + text.slice(2).trim().replace(/\*\//g, '* /') + ' */';
        else text = text.replace(/\s+/g, ' ');
        out.put(text, !!last); last = t; lastIdx = i; return;
      }
      if (t.nl >= 2 && f.k === 'pl' && !f.ps && out.L.length) out.blank();
      if (t.nl === 0 && out.cur.trim()) out.trail(text, lc);
      else { if (out.pend === null) out.nl(out.depth); out.put(text, true, lc); }
      if (!lc) {
        last = t; lastIdx = i; unary = false;
        if (i + 1 < N && T[i + 1].nl > 0 && out.pend === null) out.nl(out.depth);
      }
    }
    function listComma(i, d, g) {
      if (o.commaStyle === 'leading') { out.nl(d, g); emit(i); } else { attach(i); out.nl(d, g); }
      return i + 1;
    }
    function comma(i) {
      const f = top();
      if (f.k === 'sql' && f.dml && f.mode === 'list') return listComma(i, f.cb + 1, f.cl && f.cl.startsWith('SELECT') ? f.id : null);
      if (f.k === 'par' && f.list) return listComma(i, f.ld + 1, null);
      attach(i); return i + 1;
    }
    function semi(i) {
      while (frames.length > 1 && top().k !== 'pl') frames.pop();
      const f = top();
      attach(i);
      if (f.k === 'pl') { f.ps = null; out.nl(f.sd); }
      return i + 1;
    }
    function topCommas(i) {
      let d = 0, c = 0;
      for (let j = i; j < N; j++) {
        const x = T[j].type === 'symbol' ? T[j].text : '';
        if (x === '(') d++; else if (x === ')') { if (--d === 0) break; } else if (x === ',' && d === 1) c++;
      }
      return c;
    }
    function openParen(i) {
      const f = top(), n = nxt(i), nw = U(n);
      const sub = nw === 'SELECT' || nw === 'WITH';
      let list = false, sp;
      if (!sub) {
        if (f.k === 'sql' && f.ct && !f.ctDone && !f.dml) { list = true; f.ctDone = sp = true; }
        else if (f.k === 'pl' && f.ps && (f.ps.head === 'SUB' || (f.ps.head === 'CREATE' && f.ps.ck === 'SUB')) && !f.ps.par) {
          f.ps.par = sp = true; list = topCommas(i) >= 2;
        }
      }
      if (!sp && f.k === 'sql' && /^(INSERT INTO|INTO|INSERT|MERGE INTO)$/.test(f.cl || '') && last && (last.type === 'quoted' || (last.type === 'word' && cls[lastIdx] === 'i'))) sp = true;
      emit(i, { sp });
      const ld = out.depth;
      frames.push({ k: 'par', sub, list, ld, n: 0 });
      if (sub) pushSql(ld + 1, n);
      else if (list) out.nl(ld + 1);
      return i + 1;
    }
    function closeParen(i) {
      let k = frames.length - 1;
      while (k >= 0 && frames[k].k !== 'par' && frames[k].k !== 'pl') k--;
      if (k < 0 || frames[k].k !== 'par') { emit(i); return i + 1; }
      const p = frames[k]; frames.length = k;
      if (p.sub || p.list) out.nl(p.ld);
      emit(i); return i + 1;
    }
    function openCase(i) {
      const f = top();
      emit(i);
      frames.push({ k: 'case', inline: f.k === 'par' || (f.k === 'case' && f.inline), d: out.depth, n: 0 });
      return i + 1;
    }
    function caseKw(i, f, w) {
      if (w === 'END') { if (!f.inline) out.nl(f.d); emit(i); frames.pop(); return i + 1; }
      if (!f.inline) out.nl(f.d + 1);
      emit(i); return i + 1;
    }
    function matchPhrase(i) {
      if (cls[i] !== 'k') return null;
      for (const p of PHRASES) {
        let ok = true;
        for (let k = 0; k < p.length; k++) { const tk = T[i + k]; if (!tk || tk.type !== 'word' || tk.text.toUpperCase() !== p[k]) { ok = false; break; } }
        if (ok) return { name: p.join(' '), len: p.length };
      }
      return null;
    }
    function clause(i, f, ph) {
      const name = ph.name, typ = CL[name];
      const put = () => { emit(i, { text: T.slice(i, i + ph.len).map((_, k) => caseText(i + k)).join(' '), len: ph.len }); return i + ph.len; };
      let r;
      switch (typ) {
        case 'bl': case 'ba':
          if (name === 'WITH' && f.n > 0) return 0;
          if (name === 'SET' && f.cl !== 'UPDATE') return 0;
          out.nl(f.cb); r = put();
          f.cl = name; f.mode = typ === 'bl' ? 'list' : 'and'; f.jo = false; f.bt = false;
          out.nl(f.cb + 1, name.startsWith('SELECT') ? f.id : null);
          return r;
        case 'in':
          if (name === 'USING' && f.cl !== 'MERGE INTO') return 0;
          if (name === 'INTO' && f.cl === 'RETURNING') return 0;
          if (name === 'OFFSET' && !/^(number|bind)$/.test((T[nxt(i)] || {}).type)) return 0;
          out.nl(f.cb); r = put(); f.cl = name; f.mode = null; f.jo = false; return r;
        case 'al': out.nl(f.base); r = put(); f.cb = f.base; f.cl = name; f.mode = null; out.nl(f.base); return r;
        case 'mw': out.nl(f.base); r = put(); f.cb = f.base + 1; f.cl = name; f.mode = null; out.nl(f.cb); return r;
        case 'jn': if (f.cl !== 'FROM') return 0; out.nl(f.cb + 1); r = put(); f.jo = false; return r;
      }
      if (name === 'ON') {
        if (f.cl === 'USING') { out.nl(f.cb); r = put(); f.cl = 'ON'; f.mode = 'and'; return r; }
        if (f.cl === 'FROM') f.jo = true;
        return 0;
      }
      if (name === 'BETWEEN') { f.bt = true; return 0; }
      if (name === 'AND' || name === 'OR') {
        if (name === 'AND' && f.bt) { f.bt = false; return 0; }
        if (f.mode === 'and') { out.nl(f.cb + 1); return put(); }
        if (f.jo) { out.nl(f.cb + 2); return put(); }
      }
      return 0;
    }
    function sqlWord(i, f, w) {
      if (!f.dml) {
        if ((w === 'SELECT' || w === 'WITH') && /^(AS|FOR|IS)$/.test(U(prv(i)))) f.dml = true;
        else { emit(i); return i + 1; }
      }
      const ph = matchPhrase(i);
      if (ph) { const r = clause(i, f, ph); if (r) return r; }
      if (w === 'AS' && o.alignAs && f.cl && f.cl.startsWith('SELECT') && !out.flat) { emit(i, { text: '\u0001' + caseText(i) }); return i + 1; }
      emit(i); return i + 1;
    }
    function plStart(i, f) {
      const t = T[i], w = up(t);
      if (t.nl >= 2 && out.L.length) out.blank();
      const go = d => out.nl(d);
      switch (w) {
        case '<<': go(f.sd); f.ps = { head: 'LABEL' }; emit(i); return i + 1;
        case 'DECLARE': go(f.sd); emit(i); frames.push(pl('decl', f.sd)); out.nl(f.sd + 1); return i + 1;
        case 'BEGIN': {
          let own = f.sd;
          if (f.kind === 'decl' || f.kind === 'pkg') { own = f.own; frames.pop(); }
          go(own); emit(i); frames.push(pl('begin', own)); out.nl(own + 1); return i + 1;
        }
        case 'EXCEPTION': if (f.kind === 'begin') { go(f.own); emit(i); f.exc = true; out.nl(f.own + 1); return i + 1; } break;
        case 'WHEN': if ((f.kind === 'begin' && f.exc) || f.kind === 'pcase') { go(f.own + 1); emit(i); f.ps = { head: 'WHEN' }; return i + 1; } break;
        case 'ELSE':
          if (f.kind === 'pcase') { go(f.own + 1); emit(i); f.sd = f.own + 2; out.nl(f.sd); return i + 1; }
          if (f.kind === 'if') { go(f.own); emit(i); out.nl(f.sd); return i + 1; }
          break;
        case 'ELSIF': if (f.kind === 'if') { go(f.own); emit(i); f.ps = { head: 'ELSIF' }; return i + 1; } break;
        case 'END': return plEnd(i, f);
        case 'IF': case 'FOR': case 'WHILE': case 'FORALL': go(f.sd); emit(i); f.ps = { head: w }; return i + 1;
        case 'CASE': { go(f.sd); emit(i); const c = pl('pcase', f.sd); c.ps = { head: 'CASESEL' }; frames.push(c); return i + 1; }
        case 'LOOP': go(f.sd); emit(i); frames.push(pl('loop', f.sd)); out.nl(f.sd + 1); return i + 1;
      }
      go(f.sd);
      if (t.type === 'word' && SQL_START.has(w)) { f.ps = { head: 'SQL' }; pushSql(f.sd, i); return i; }
      if (t.type === 'word' && SUB_HEAD.has(w)) f.ps = { head: 'SUB' };
      else if (w === 'CREATE') f.ps = { head: 'CREATE', ck: createKind(T.slice(i + 1).filter(x => !isCmt(x)).slice(0, 8).map(up)) };
      else f.ps = { head: w };
      emit(i); return i + 1;
    }
    function plEnd(i, f) {
      const nw = U(nxt(i));
      const want = nw === 'IF' ? ['if'] : nw === 'LOOP' ? ['loop'] : nw === 'CASE' ? ['pcase'] : ['begin', 'pkg', 'decl'];
      let k = frames.length - 1;
      while (k > 0 && !(frames[k].k === 'pl' && want.includes(frames[k].kind))) k--;
      if (k > 0) {
        const c = frames[k]; frames.length = k;
        out.nl(c.own); emit(i); top().ps = { head: 'END' };
        return i + 1;
      }
      out.nl(f.sd); emit(i); f.ps = { head: 'END' }; return i + 1;
    }
    function plWord(i, f, w) {
      const ps = f.ps;
      switch (w) {
        case 'THEN':
          if (ps.head === 'IF') { emit(i); f.ps = null; frames.push(pl('if', f.sd)); out.nl(f.sd + 1); return i + 1; }
          if (ps.head === 'ELSIF') { emit(i); f.ps = null; out.nl(f.sd); return i + 1; }
          if (ps.head === 'WHEN') { emit(i); f.ps = null; f.sd = f.own + 2; out.nl(f.sd); return i + 1; }
          break;
        case 'LOOP':
          if (ps.head === 'FOR' || ps.head === 'WHILE') { emit(i); f.ps = null; frames.push(pl('loop', f.sd)); out.nl(f.sd + 1); return i + 1; }
          break;
        case 'WHEN':
          if (ps.head === 'CASESEL') { out.nl(f.own + 1); emit(i); f.ps = { head: 'WHEN' }; return i + 1; }
          if (ps.head === 'CREATE' && ps.ck === 'TRIGGER') { out.nl(f.sd + 1); emit(i); return i + 1; }
          break;
        case 'IS': case 'AS':
          if (ps.head === 'SUB' || (ps.head === 'CREATE' && (ps.ck === 'SUB' || ps.ck === 'PKG'))) {
            emit(i);
            const nw = U(nxt(i));
            if (nw === 'LANGUAGE' || nw === 'EXTERNAL') return i + 1;
            f.ps = null; frames.push(pl(ps.head === 'CREATE' && ps.ck === 'PKG' ? 'pkg' : 'decl', f.sd)); out.nl(f.sd + 1);
            return i + 1;
          }
          break;
        case 'DECLARE': case 'BEGIN':
          if (ps.head === 'CREATE') { f.ps = null; return i; }
          break;
        case 'SELECT': case 'WITH':
          if (w === 'SELECT' || /^(IS|AS|FOR)$/.test(U(prv(i)))) { out.nl(f.sd + 1); pushSql(f.sd + 1, i); return i; }
          break;
        case 'INSERT': case 'UPDATE': case 'DELETE': case 'MERGE':
          if (ps.head === 'FORALL') { out.nl(f.sd + 1); pushSql(f.sd + 1, i); return i; }
          break;
        case 'BEFORE': case 'AFTER': case 'INSTEAD': case 'FOR': case 'REFERENCING': case 'FOLLOWS': case 'PRECEDES': case 'COMPOUND':
          if (ps.head === 'CREATE' && ps.ck === 'TRIGGER' && !(w === 'FOR' && U(nxt(i)) !== 'EACH')) { out.nl(f.sd + 1); emit(i); return i + 1; }
          break;
      }
      emit(i); return i + 1;
    }
    function step(i) {
      const t = T[i];
      if (isCmt(t)) { comment(i); return i + 1; }
      const f = top();
      if (f.k === 'pl' && !f.ps) return plStart(i, f);
      if (t.type === 'symbol') {
        if (t.text === '(') return openParen(i);
        if (t.text === ')') return closeParen(i);
        if (t.text === ';') return semi(i);
        if (t.text === ',') return comma(i);
        if (t.text === '>>' && f.k === 'pl' && f.ps.head === 'LABEL') { emit(i); f.ps = null; out.nl(f.sd); return i + 1; }
      }
      if (t.type === 'word') {
        const w = t.text.toUpperCase();
        if (f.k === 'case' && cls[i] === 'k' && (w === 'WHEN' || w === 'ELSE' || w === 'END')) return caseKw(i, f, w);
        if (w === 'CASE' && cls[i] === 'k' && U(prv(i)) !== 'END') return openCase(i);
        if (f.k === 'sql') return sqlWord(i, f, w);
        if (f.k === 'pl') return plWord(i, f, w);
      }
      emit(i); return i + 1;
    }

    if (u.kind === 'plsql') frames.push(pl('root', -1));
    else { const fi = T.findIndex(x => !isCmt(x)); pushSql(0, fi < 0 ? 0 : fi); }
    if (frames[0].k === 'pl') frames[0].sd = 0;
    out.nl(0);
    let i = 0;
    while (i < N) i = step(i);
  }

  function keepLayout(src, u, o) {
    const T = u.tokens, cls = classify(T);
    let s = '';
    T.forEach((t, k) => {
      if (k) s += src.slice(T[k - 1].end, t.start);
      s += cls[k] ? applyCase(t.text, cls[k] === 'i' ? o.identCase : o.keywordCase) : t.text;
    });
    return s.split('\n').map(l => l.replace(/\s+$/, '')).join('\n');
  }

  /* Liste lungi (coloane, SET, ORDER BY…): pune mai multe elemente pe un rând, până la `width` caractere.
     Se unesc doar elemente scrise pe un singur rând, fără comentarii și fără șiruri deschise. */
  function wrapLists(text, width, commaStyle) {
    width = Math.floor(+width);
    if (!(width >= 20)) return text;
    const L = String(text).split('\n'), lead = commaStyle === 'leading';
    const ind = l => l.length - l.trimStart().length;
    const safe = l => l.trim() && !/--|\/\*/.test(l) && ((l.match(/'/g) || []).length % 2 === 0) && !/"/.test(l.replace(/"[^"]*"/g, ''));
    const single = i => i + 1 >= L.length || !L[i + 1].trim() || ind(L[i + 1]) <= ind(L[i]);
    const out = [];
    let i = 0;
    while (i < L.length) {
      const d = ind(L[i]), prev = out.length ? out[out.length - 1] : '';
      const starts = L[i].trim() && (!prev.trim() || ind(prev) < d) && !(lead && L[i].trim().startsWith(','));
      let j = i;
      if (starts && safe(L[i]) && single(i)) {
        // elementele următoare din aceeași listă
        while (j + 1 < L.length && ind(L[j + 1]) === d && safe(L[j + 1]) && single(j + 1) &&
          (lead ? L[j + 1].trim().startsWith(', ') : /,$/.test(L[j]))) j++;
      }
      if (j === i) { out.push(L[i]); i++; continue; }
      const pad = L[i].slice(0, d);
      let line = pad + L[i].trim();
      for (let k = i + 1; k <= j; k++) {
        const item = L[k].trim(), piece = lead ? item.replace(/^,\s*/, '') : item;
        const next = line + (lead ? ', ' : ' ') + piece;
        if (next.length <= width) line = next;
        else { out.push(line); line = pad + (lead ? ', ' + piece : piece); }
      }
      out.push(line); i = j + 1;
    }
    return out.join('\n');
  }

  /* Pro: compară două variante după formatare (diferențele de spații și majuscule dispar) */
  function diffLines(a, b) {
    const A = a.split('\n'), B = b.split('\n');
    if (A.length > 3000 || B.length > 3000) throw new Error('too long');
    let p = 0; while (p < A.length && p < B.length && A[p] === B[p]) p++;
    let q = 0; while (q < A.length - p && q < B.length - p && A[A.length - 1 - q] === B[B.length - 1 - q]) q++;
    const a2 = A.slice(p, A.length - q), b2 = B.slice(p, B.length - q), n = a2.length, m = b2.length;
    const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let x = n - 1; x >= 0; x--) for (let y = m - 1; y >= 0; y--) dp[x][y] = a2[x] === b2[y] ? dp[x + 1][y + 1] + 1 : Math.max(dp[x + 1][y], dp[x][y + 1]);
    const out = A.slice(0, p).map(line => ({ op: ' ', line }));
    let x = 0, y = 0;
    while (x < n || y < m) {
      if (x < n && y < m && a2[x] === b2[y]) { out.push({ op: ' ', line: a2[x] }); x++; y++; }
      else if (x < n && (y >= m || dp[x + 1][y] >= dp[x][y + 1])) out.push({ op: '-', line: a2[x++] });
      else out.push({ op: '+', line: b2[y++] });
    }
    return out.concat(A.slice(A.length - q).map(line => ({ op: ' ', line })));
  }
  function compare(a, b, opts) { return diffLines(format(a, opts), format(b, opts)); }

  const DEF = { keywordCase: 'upper', identCase: 'keep', commaStyle: 'trailing', indent: 2, alignAs: false, plsql: true, minify: false, width: 0 };
  function format(src, opts) {
    src = String(src == null ? '' : src);
    const o = Object.assign({}, DEF, opts);
    o.indent = Math.max(1, Math.min(8, +o.indent || 2));
    const units = split(src);
    if (o.minify) {
      const lines = [];
      for (const u of units) {
        if (u.kind === 'cmd') { lines.push(src.slice(u.start, u.end).trim()); continue; }
        const out = new Out(1, true);
        fmtUnit(u, o, out);
        lines.push(out.cur);
        if (u.slash) lines.push('/');
      }
      return lines.join('\n');
    }
    const out = new Out(o.indent, false);
    let prev = null;
    for (const u of units) {
      if (prev) { out.nl(0); if (!(prev.kind === 'cmd' && u.kind === 'cmd')) out.blank(); }
      if (u.kind === 'cmd') out.raw(src.slice(u.start, u.end).trim());
      else if (u.kind === 'plsql' && !o.plsql) out.raw(keepLayout(src, u, o));
      else fmtUnit(u, o, out);
      if (u.slash) { out.nl(0); out.put('/'); }
      prev = u;
    }
    return wrapLists(out.text(o.alignAs), o.width, o.commaStyle);
  }

  /* Pro: lista instrucțiunilor dintr-un script */
  function statements(src) {
    src = String(src == null ? '' : src);
    return split(src).filter(u => u.kind !== 'comment').map(u => ({ kind: u.kind, text: src.slice(u.start, u.end).trim() }));
  }

  /* Colorare: segmente [clasă, text] care, lipite, dau exact textul primit. */
  function highlight(src) {
    src = String(src == null ? '' : src);
    const seg = []; let pos = 0;
    const add = (c, t) => { if (t) seg.push([c, t]); };
    for (const u of split(src)) {
      add('', src.slice(pos, u.start));
      if (u.kind === 'cmd') { add('m', src.slice(u.start, u.end)); pos = u.end; continue; }
      const cls = classify(u.tokens); let p = u.start;
      u.tokens.forEach((t, k) => {
        add('', src.slice(p, t.start));
        const c = isCmt(t) ? 'c' : t.type === 'string' ? 's' : t.type === 'number' ? 'n' : t.type === 'bind' ? 'b' : t.type === 'quoted' ? 'q'
          : cls[k] === 'k' ? 'k' : cls[k] === 'f' ? 'f' : '';
        add(c, t.text); p = t.end;
      });
      add('', src.slice(p, u.end)); pos = u.end;
    }
    add('', src.slice(pos));
    return seg;
  }

  /* Pro: SQL ca literal de șir în Java / C# / Python / PL/SQL, cu indicii pentru variabilele bind. */
  function toCode(src, lang) {
    src = String(src == null ? '' : src);
    const parts = []; let n = 0;
    for (const u of split(src)) {
      if (u.kind === 'cmd' || u.kind === 'comment') continue;
      let T = u.tokens.slice();
      if (u.kind === 'sql') { let k = T.length - 1; while (k >= 0 && isCmt(T[k])) k--; if (k >= 0 && T[k].text === ';') T = T.slice(0, k); }
      if (!T.some(t => !isCmt(t))) continue;
      n++;
      const s0 = T[0].start, s1 = T[T.length - 1].end;
      const binds = T.filter(t => t.type === 'bind' && t.text[0] === ':').map(t => t.text.slice(1));
      const uniq = [...new Set(binds.map(b => b.toUpperCase()))].map(b => binds.find(x => x.toUpperCase() === b));
      const name = (lang === 'plsql' ? 'l_sql' : 'sql') + (n > 1 ? n : '');
      let text = src.slice(s0, s1);
      const numeric = binds.some(b => /^\d/.test(b));
      const camel = b => (/^\d/.test(b) ? 'p' + b : b.toLowerCase().replace(/[^a-z0-9]+([a-z0-9])/g, (_, c) => c.toUpperCase()).replace(/[^A-Za-z0-9_]/g, '_'));
      const snake = b => (/^\d/.test(b) ? 'p' + b : b.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
      let code = '';
      if (lang === 'java') {
        let q = '', p = s0;
        for (const t of T) if (t.type === 'bind' && t.text[0] === ':') { q += src.slice(p, t.start) + '?'; p = t.end; }
        text = q + src.slice(p, s1);
        const lines = text.split('\n'), esc = s => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\t/g, '\\t').replace(/\r/g, '');
        code = 'String ' + name + ' = ' + lines.map((l, k) => '"' + esc(l) + (k < lines.length - 1 ? '\\n' : '') + '"').join('\n    + ') + ';';
        if (binds.length) code += '\n// PreparedStatement ps = conn.prepareStatement(' + name + ');\n' + binds.map((b, k) => `// ps.setObject(${k + 1}, ${camel(b)}); // :${b}`).join('\n');
      } else if (lang === 'csharp') {
        code = 'string ' + name + ' = @"' + text.replace(/\r/g, '').replace(/"/g, '""') + '";';
        if (uniq.length) code += '\n// cmd.BindByName = true;\n' + uniq.map(b => `// cmd.Parameters.Add("${b}", ${camel(b)});`).join('\n');
      } else if (lang === 'python') {
        code = name + ' = """' + text.replace(/\r/g, '').replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"') + '\n"""';
        if (uniq.length) code += '\n# cursor.execute(' + name + ', ' + (numeric ? '[' + uniq.map(snake).join(', ') + ']' : '{' + uniq.map(b => `"${b}": ${snake(b)}`).join(', ') + '}') + ')';
      } else { // plsql
        const pairs = ['[]', '{}', '()', '<>', '!!', '##', '||', '~~', '^^', '@@'];
        const d = pairs.find(p => !text.includes(p[1] + "'"));
        code = name + ' VARCHAR2(32767) := ' + (d ? "q'" + d[0] + text + d[1] + "'" : "'" + text.replace(/'/g, "''") + "'") + ';';
        const use = u.kind === 'sql' ? binds : uniq; // SQL dinamic: legare după poziție, fiecare apariție
        code += '\n-- EXECUTE IMMEDIATE ' + name + (use.length ? ' USING ' + use.map(b => 'l_' + snake(b)).join(', ') : '') + ';';
      }
      parts.push(code);
    }
    return parts.join('\n\n');
  }

  const SqlFormatter = { tokenize, lex, split, statements, classify, format, wrapLists, diffLines, compare, highlight, toCode, KW, FN };
  if (typeof module !== 'undefined' && module.exports) module.exports = SqlFormatter;
  else global.SqlFormatter = SqlFormatter;
})(typeof window !== 'undefined' ? window : globalThis);
