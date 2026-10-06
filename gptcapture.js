(async function gptcaptureFidelity() {
    'use strict';
    // INV-JS-CRX-PARITY: same payload as gptcapture-crx downloadToDownloads (API body + sidecars zip).
    console.log('[gptcapture] 🟡 API conversation + sidecars zip...');

    try {
        let foundData = null;
        let routeKey = null;
        let accessToken = null;
        let accountId = null;

        function workspaceFromToken(tok) {
            try {
                const payload = JSON.parse(atob(tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
                return payload['https://api.openai.com/auth']?.chatgpt_account_id
                    || payload.chatgpt_account_id
                    || null;
            } catch { return null; }
        }

        function authHeaders(extra) {
            const h = { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', ...(extra || {}) };
            if (accountId) h['ChatGPT-Account-Id'] = accountId;
            return h;
        }

        async function ensureToken() {
            if (accessToken) return accessToken;
            const c1 = new AbortController();
            const t1 = setTimeout(() => c1.abort(), 5000);
            const sessionBlob = await fetch('/api/auth/session', { signal: c1.signal });
            clearTimeout(t1);
            if (!sessionBlob.ok) throw new Error('Unauthorized');
            const session = await sessionBlob.json();
            accessToken = session.accessToken;
            if (!accessToken) throw new Error('no accessToken');
            accountId = workspaceFromToken(accessToken);
            return accessToken;
        }

        function cidFromUrl() {
            return (location.pathname.match(/\/c\/([a-f0-9-]+)/) || [])[1] || null;
        }

        function cidFromMemory() {
            const seen = new WeakSet();
            let hit = null;
            function scan(obj, depth) {
                if (hit || depth > 8 || !obj || typeof obj !== 'object' || seen.has(obj)) return;
                seen.add(obj);
                if (obj.mapping && typeof obj.mapping === 'object' && obj.conversation_id) {
                    const keys = Object.keys(obj.mapping);
                    if (keys.length && obj.mapping[keys[0]]?.id && 'create_time' in obj) {
                        hit = String(obj.conversation_id);
                        return;
                    }
                }
                for (const key of Object.keys(obj)) {
                    try {
                        if (obj[key] && typeof obj[key] === 'object') {
                            scan(obj[key], depth + 1);
                            if (hit && key.length === 36) routeKey = key;
                        }
                    } catch { /* inaccessible */ }
                }
            }
            for (const t of [
                window.__reactRouterContext,
                window.__NEXT_DATA__,
                document.getElementById('__NEXT_DATA__'),
            ].filter(Boolean)) scan(t, 0);
            return hit;
        }

        // Match crx downloadToDownloads: always fetchRaw(cid). Memory is cid recovery only.
        const cid = cidFromUrl() || cidFromMemory();
        if (!cid) throw new Error('🔴 open a /c/<uuid> chat first');
        await ensureToken();
        {
            const c2 = new AbortController();
            const t2 = setTimeout(() => c2.abort(), 20000);
            const apiBlob = await fetch(`/backend-api/conversation/${cid}`, {
                headers: authHeaders(),
                signal: c2.signal,
            });
            clearTimeout(t2);
            if (!apiBlob.ok) throw new Error(`🔴 conversation ${apiBlob.status}`);
            foundData = await apiBlob.json();
        }
        if (!foundData?.mapping) throw new Error('🔴 empty conversation body');

        const json = JSON.stringify(foundData, null, 2);

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
        const chatId = foundData.conversation_id || cid;
        const slug = ((foundData.title) || 'untitled')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 64) || 'untitled';
        const stem = `${datePrefix}_gpt_${slug}_${chatId}`;
        const stamp = (() => {
            const d = new Date();
            const p = n => String(n).padStart(2, '0');
            return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
        })();
        const zipName = `${stem}_${stamp}.zip`;

        function safeName(s, fallback) {
            const base = String(s || fallback || 'file').replace(/[^\w.\-]+/g, '_');
            return base.slice(0, 180) || 'file';
        }

        function parseAssets(data) {
            const raw = typeof data === 'string' ? data : JSON.stringify(data);
            const byId = new Map();
            const inline = [];
            function addFile(id, meta) {
                if (!id || typeof id !== 'string') return;
                let fid = id;
                for (const pref of ['file-service://', 'sediment://']) {
                    if (fid.startsWith(pref)) fid = fid.slice(pref.length);
                }
                if (!fid.startsWith('file_') && !fid.startsWith('file-')) return;
                const prev = byId.get(fid) || { id: fid };
                byId.set(fid, {
                    ...prev,
                    ...meta,
                    id: fid,
                    name: meta?.name || prev.name || null,
                    mime: meta?.mime || prev.mime || null,
                    size: meta?.size ?? prev.size ?? null,
                    kind: meta?.kind || prev.kind || 'file',
                });
            }
            for (const node of Object.values(data.mapping || {})) {
                const msg = node && node.message;
                if (!msg) continue;
                for (const att of (msg.metadata && msg.metadata.attachments) || []) {
                    if (att && att.id) {
                        addFile(att.id, {
                            name: att.name,
                            mime: att.mime_type || att.mimeType,
                            size: att.size,
                            kind: 'attachment',
                            library_file_id: att.library_file_id || null,
                        });
                    }
                }
                for (const part of (msg.content && msg.content.parts) || []) {
                    if (!part || typeof part !== 'object') continue;
                    if (typeof part.asset_pointer === 'string') {
                        addFile(part.asset_pointer, {
                            name: (part.metadata && part.metadata.dalle && 'dalle.png') || 'image.png',
                            kind: 'image_asset_pointer',
                        });
                    }
                }
                const ar = msg.metadata && msg.metadata.aggregate_result;
                if (ar && typeof ar === 'object') {
                    if (typeof ar.code === 'string' && ar.code.trim()) {
                        inline.push({
                            kind: 'python_code',
                            name: safeName(`python_${ar.run_id || msg.id || 'code'}`, 'python') + '.py',
                            text: ar.code,
                        });
                    }
                    const streams = (ar.messages || [])
                        .filter((m) => m && m.message_type === 'stream' && m.text)
                        .map((m) => m.text)
                        .join('');
                    if (streams) {
                        inline.push({
                            kind: 'python_stdout',
                            name: safeName(`python_${ar.run_id || msg.id || 'out'}_stdout`, 'stdout') + '.txt',
                            text: streams,
                        });
                    }
                    if (typeof ar.final_expression_output === 'string' && ar.final_expression_output.trim()) {
                        inline.push({
                            kind: 'python_result',
                            name: safeName(`python_${ar.run_id || msg.id || 'result'}`, 'result') + '.txt',
                            text: ar.final_expression_output,
                        });
                    }
                }
                if (msg.content && msg.content.content_type === 'code') {
                    const lang = msg.content.language || 'txt';
                    const body = ((msg.content.parts || []).filter((p) => typeof p === 'string').join('\n') || '').trim();
                    if (body) {
                        const ext = /python/i.test(lang) ? 'py' : /json/i.test(lang) ? 'json' : 'txt';
                        inline.push({
                            kind: 'code_part',
                            name: safeName(`code_${msg.id || 'block'}`, 'code') + '.' + ext,
                            text: body,
                        });
                    }
                }
            }
            let m;
            const FILE_PTR_RE = /(?:file-service|sediment):\/\/([A-Za-z0-9_-]+)/g;
            while ((m = FILE_PTR_RE.exec(raw))) addFile(m[1], { kind: 'raw_file_pointer' });
            const seenInline = new Set();
            const inlineOut = [];
            for (const item of inline) {
                let n = item.name;
                let i = 1;
                while (seenInline.has(n)) {
                    const dot = n.lastIndexOf('.');
                    n = dot > 0 ? `${n.slice(0, dot)}_${i}${n.slice(dot)}` : `${n}_${i}`;
                    i++;
                }
                seenInline.add(n);
                inlineOut.push({ ...item, name: n });
            }
            return { files: [...byId.values()], inline: inlineOut };
        }

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

        const assets = parseAssets(foundData);
        const bag = [{ path: `${stem}/${stem}.json`, data: json + '\n' }];
        const landed = [];
        const failed = [];

        async function mapPool(items, limit, fn) {
            const list = Array.isArray(items) ? items : [];
            if (!list.length) return [];
            const n = Math.max(1, Math.min(limit || 8, 16));
            const out = new Array(list.length);
            let i = 0;
            async function worker() {
                while (i < list.length) {
                    const idx = i++;
                    out[idx] = await fn(list[idx], idx);
                }
            }
            await Promise.all(Array.from({ length: Math.min(n, list.length) }, worker));
            return out;
        }

        if (assets.files.length || assets.inline.length) {
            console.log(`[gptcapture] 🟡 sidecars: ${assets.files.length} files, ${assets.inline.length} artifacts`);
        }

        await mapPool(assets.files, 8, async (f) => {
            try {
                const metaR = await fetch(
                    `/backend-api/files/download/${encodeURIComponent(f.id)}?post_id=&inline=false`,
                    { headers: authHeaders() }
                );
                if (!metaR.ok) throw new Error(`${metaR.status}`);
                const meta = await metaR.json();
                if (!meta || meta.status !== 'success' || !meta.download_url) {
                    throw new Error('files/download failed');
                }
                const base = safeName(meta.file_name || f.name, f.id);
                let url = meta.download_url;
                if (url.startsWith('/')) url = location.origin + url;
                const bytesR = await fetch(url, { headers: authHeaders({ Accept: '*/*' }) });
                if (!bytesR.ok) throw new Error(`bytes ${bytesR.status}`);
                const buf = new Uint8Array(await bytesR.arrayBuffer());
                if (!buf.byteLength) throw new Error('empty');
                const key = `files/${base}`;
                bag.push({ path: `${stem}/${key}`, data: buf });
                landed.push(key);
            } catch (e) {
                failed.push({ id: f.id, name: f.name, error: e.message, kind: 'files' });
                console.warn('[gptcapture] sidecar file failed:', f.id, e.message);
            }
        });

        for (const item of assets.inline || []) {
            if (!item?.text || !item?.name) continue;
            const key = `artifacts/${item.name}`;
            bag.push({ path: `${stem}/${key}`, data: item.text });
            landed.push(key);
        }

        const ledger = {
            conversation_id: chatId,
            title: foundData.title || null,
            endpoint_meta: '/backend-api/files/download/{file_id}',
            endpoint_bytes: '/backend-api/estuary/content',
            files: assets.files,
            inline: (assets.inline || []).map(x => ({ kind: x.kind, name: x.name, bytes: (x.text || '').length })),
            landed,
            failed,
        };
        bag.push({ path: `${stem}/_files.json`, data: JSON.stringify(ledger, null, 2) + '\n' });
        landed.push('_files.json');

        const zipBytes = await buildZip(bag);
        const nodes = foundData.mapping ? Object.keys(foundData.mapping).length : 0;
        window.__GPTCAPTURE = {
            foundData, routeKey, json, stem, zipName,
            sidecars: { files: assets.files.length, inline: assets.inline.length, landed, failed },
        };

        const anchor = document.createElement('a');
        anchor.href = URL.createObjectURL(new Blob([zipBytes], { type: 'application/zip' }));
        anchor.download = zipName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(anchor.href), 2000);

        console.log(
            `[gptcapture] 🟢: ${zipName} | ${json.length}B json | ${nodes} nodes | ` +
            `${landed.length} sidecars | ${failed.length} failed | window.__GPTCAPTURE`
        );
    } catch (err) {
        console.error('[gptcapture] 🔴 (fucked):', err);
    }
})();
