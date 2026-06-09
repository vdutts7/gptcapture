(async function gptcaptureFidelity() {
  'use strict';

  try {
    const scripts = [...document.querySelectorAll('script')];
    const streamScript = scripts.find((s) =>
      /__reactRouterContext\.streamController\.enqueue/.test(s.textContent || '')
    );
    if (!streamScript) throw new Error('No React Router stream script found.');

    const source = streamScript.textContent;
    const start = source.indexOf('enqueue(') + 8;
    const quote = source.indexOf('"', start);
    let i = quote + 1;
    let buf = '';
    while (i < source.length) {
      const c = source[i];
      if (c === '\\') {
        buf += source[i] + source[i + 1];
        i += 2;
        continue;
      }
      if (c === '"') break;
      buf += c;
      i++;
    }

    const rawStr = JSON.parse('"' + buf + '"');
    const table = JSON.parse(rawStr);

    const UNDEF = -5;
    const NAN = -2;
    const PINF = -3;
    const NINF = -4;
    const NZ = -6;
    const HOLE = -1;
    const seen = new Map();

    function hydrate(idx) {
      if (idx === UNDEF || idx === HOLE) return undefined;
      if (idx === NAN) return NaN;
      if (idx === PINF) return Infinity;
      if (idx === NINF) return -Infinity;
      if (idx === NZ) return -0;
      if (seen.has(idx)) return seen.get(idx);
      const value = table[idx];
      if (value === null) return null;
      if (Array.isArray(value)) {
        const arr = [];
        seen.set(idx, arr);
        for (const entry of value) arr.push(hydrate(entry));
        return arr;
      }
      if (typeof value === 'object') {
        const obj = {};
        seen.set(idx, obj);
        for (const key of Object.keys(value)) {
          obj[hydrate(parseInt(key.slice(1), 10))] = hydrate(value[key]);
        }
        return obj;
      }
      return value;
    }

    const root = hydrate(0);
    let data = null;
    let routeKey = null;
    const loaderData = (root && root.loaderData) || {};

    for (const rk of Object.keys(loaderData)) {
      const route = loaderData[rk];
      const candidate = route && route.serverResponse && route.serverResponse.data;
      if (candidate && candidate.mapping) {
        data = candidate;
        routeKey = rk;
        break;
      }
      if (route && route.mapping) {
        data = route;
        routeKey = rk;
        break;
      }
    }

    const replacer = () => {
      const weak = new WeakSet();
      return (key, value) => {
        if (typeof value === 'undefined') return '__undefined__';
        if (typeof value === 'number' && !isFinite(value)) return String(value);
        if (value && typeof value === 'object') {
          if (weak.has(value)) return { $ref: '[circular]' };
          weak.add(value);
        }
        return value;
      };
    };

    const payload = {
      _exporter: 'gptcapture-fidelity',
      _exported_at: new Date().toISOString(),
      _source_url: location.href,
      _route_key: routeKey,
      _rows: table.length,
      _mapping_nodes: data && data.mapping ? Object.keys(data.mapping).length : 0,
      table,
      loaderData: JSON.parse(JSON.stringify(root, replacer())),
      serverResponseData: data ? JSON.parse(JSON.stringify(data, replacer())) : null,
    };

    const json = JSON.stringify(payload, replacer(), 2);
    window.__GPTCAPTURE = { table, root, data, routeKey, rawStr, payload, json };

    const name = ((data && data.title) || location.pathname.split('/').pop() || 'conversation')
      .replace(/[^\w\-]+/g, '_')
      .slice(0, 60);

    const gz = new Uint8Array(
      await new Response(
        new Blob([new TextEncoder().encode(json)]).stream().pipeThrough(new CompressionStream('gzip'))
      ).arrayBuffer()
    );

    const blob = new Blob([gz], { type: 'application/gzip' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = name + '.fidelity.json.gz';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(anchor.href), 2000);

    console.log(
      '[gptcapture] downloaded ' +
        name +
        '.fidelity.json.gz | ' +
        json.length +
        ' bytes raw -> ' +
        gz.length +
        ' bytes gz | ' +
        payload._mapping_nodes +
        ' nodes | window.__GPTCAPTURE'
    );
  } catch (err) {
    console.error('[gptcapture] failed:', err);
  }
})();
