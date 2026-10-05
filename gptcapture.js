(async function gptcaptureFidelity() {
    'use strict';
    console.log('[gptcapture] 🟡 dynamic deep memory scan...');

    try {
        const seenObjects = new WeakSet();
        let foundData = null;
        let routeKey = null;

        // recursive memory crawler
        function scan(obj, depth = 0) {
            if (depth > 8 || !obj || typeof obj !== 'object' || seenObjects.has(obj)) return false;
            seenObjects.add(obj);

            // fingerprint internal chat storage matrix struct
            if (obj.mapping && typeof obj.mapping === 'object') {
                const keys = Object.keys(obj.mapping);
                if (keys.length > 0 && obj.mapping[keys[0]].id && 'create_time' in obj) {
                    foundData = obj;
                    return true;
                }
            }

            for (const key of Object.keys(obj)) {
                try {
                    if (obj[key] && typeof obj[key] === 'object') {
                        if (scan(obj[key], depth + 1)) {
                            if (key.length === 36) routeKey = key;
                            return true;
                        }
                    }
                } catch { /* swallow inaccessible props */ }
            }
            return false;
        }

        // scan core memory runtime targets
        const targets = [
            window.__reactRouterContext,
            window.__NEXT_DATA__,
            document.getElementById('__NEXT_DATA__')
        ].filter(Boolean);

        for (const t of targets) {
            scan(t);
            if (foundData) break;
        }

        // fallback network path (if DOM context not yet fully hydrated)
        if (!foundData) {
            console.warn('[gptcapture] ⚪️ memory scan blank -> 🟡 network fallback...');
            try {
                const c1 = new AbortController();
                const t1 = setTimeout(() => c1.abort(), 5000);
                const sessionBlob = await fetch('/api/auth/session', { signal: c1.signal });
                clearTimeout(t1);
                if (!sessionBlob.ok) throw new Error('Unauthorized');
                const session = await sessionBlob.json();
                const token = session.accessToken;

                const cidMatch = window.location.pathname.match(/\/c\/([a-f0-9-]+)/);
                if (!cidMatch) throw new Error('🔴 no chat ID found in URL path');

                const c2 = new AbortController();
                const t2 = setTimeout(() => c2.abort(), 5000);
                const apiBlob = await fetch(`/backend-api/conversation/${cidMatch[1]}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal: c2.signal
                });
                clearTimeout(t2);
                if (apiBlob.ok) foundData = await apiBlob.json();
            } catch (e) {
                console.error('[gptcapture] 🔴 network fallback (fucked):', e);
            }
        }

        if (!foundData) throw new Error('🔴: CSP blocked OR incomplete hydration state');

        // circular reference safe cloner engine
        const getReplacer = () => {
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

        // pure backend-api conversation blob (no fidelity envelope)
        const json = JSON.stringify(foundData, getReplacer(), 2);

        // stem = YYYY-MM-DD_gpt_<slug>_<uuid> (matches extension row download)
        const datePrefix = (() => {
            const t = foundData.create_time;
            let d;
            if (typeof t === 'number') d = new Date(t < 1e12 ? t * 1000 : t);
            else if (typeof t === 'string') {
                if (/^\d+(\.\d+)?$/.test(t)) {
                    const n = Number(t);
                    d = new Date(n < 1e12 ? n * 1000 : n);
                } else d = new Date(t);
            } else d = new Date();
            return (isNaN(d.getTime()) ? new Date() : d).toISOString().slice(0, 10);
        })();
        const cid = foundData.conversation_id
            || (location.pathname.match(/\/c\/([a-f0-9-]+)/) || [])[1]
            || 'unknown';
        const slug = ((foundData.title) || 'untitled')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 64) || 'untitled';
        const stem = `${datePrefix}_gpt_${slug}_${cid}`;
        const stamp = (() => {
            const d = new Date();
            const p = n => String(n).padStart(2, '0');
            return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
        })();
        const zipName = `${stem}_${stamp}.zip`;
        const jsonPath = `${stem}/${stem}.json`;

        // minimal zip (deflate-raw via CompressionStream, STORE fallback)
        async function buildZip(entries) {
            const CRC_TABLE = (() => {
                const t = new Uint32Array(256);
                for (let n = 0; n < 256; n++) {
                    let c = n;
                    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
                    t[n] = c >>> 0;
                }
                return t;
            })();
            const crc32 = (u8) => {
                let c = 0xFFFFFFFF;
                for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
                return (c ^ 0xFFFFFFFF) >>> 0;
            };
            const u16 = (n) => { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, n, true); return b; };
            const u32 = (n) => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n, true); return b; };
            const concat = (parts) => {
                let n = 0; for (const p of parts) n += p.length;
                const out = new Uint8Array(n); let o = 0;
                for (const p of parts) { out.set(p, o); o += p.length; }
                return out;
            };
            const now = new Date();
            const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (Math.floor(now.getSeconds() / 2));
            const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
            const enc = new TextEncoder();
            const locals = []; const centrals = []; let offset = 0;
            for (const ent of entries) {
                const name = String(ent.path).replace(/^\/+/, '');
                const data = ent.data instanceof Uint8Array ? ent.data : new TextEncoder().encode(ent.data);
                const crc = crc32(data);
                let payload = data, method = 0;
                if (typeof CompressionStream !== 'undefined') {
                    try {
                        const stream = new Blob([data]).stream().pipeThrough(new CompressionStream('deflate-raw'));
                        const out = new Uint8Array(await new Response(stream).arrayBuffer());
                        if (out.length && out.length < data.length) { payload = out; method = 8; }
                    } catch { /* STORE */ }
                }
                const nameBytes = enc.encode(name);
                const local = concat([
                    u32(0x04034b50), u16(20), u16(0), u16(method), u16(time), u16(date),
                    u32(crc), u32(payload.length), u32(data.length), u16(nameBytes.length), u16(0),
                    nameBytes, payload,
                ]);
                locals.push(local);
                centrals.push(concat([
                    u32(0x02014b50), u16(20), u16(20), u16(0), u16(method), u16(time), u16(date),
                    u32(crc), u32(payload.length), u32(data.length), u16(nameBytes.length),
                    u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes,
                ]));
                offset += local.length;
            }
            const centralDir = concat(centrals);
            return concat([...locals, centralDir, u32(0x06054b50), u16(0), u16(0),
                u16(centrals.length), u16(centrals.length), u32(centralDir.length), u32(offset), u16(0)]);
        }

        const zipBytes = await buildZip([{ path: jsonPath, data: json + '\n' }]);
        window.__GPTCAPTURE = { foundData, routeKey, json, stem, zipName, jsonPath };

        const anchor = document.createElement('a');
        anchor.href = URL.createObjectURL(new Blob([zipBytes], { type: 'application/zip' }));
        anchor.download = zipName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(anchor.href), 2000);

        console.log(`[gptcapture] 🟢: ${zipName} → ${jsonPath} | ${json.length}B | ${nodes} nodes | window.__GPTCAPTURE`);
    } catch (err) {
        console.error('[gptcapture] 🔴 (fucked):', err);
    }
})();
