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

        // YYYY-MM-DD_gpt_<conversation_id>_<slug>.json
        const datePrefix = (() => {
            const t = foundData.create_time;
            let d;
            if (typeof t === 'number') d = new Date(t * 1000);
            else if (typeof t === 'string') d = new Date(/^\d+(\.\d+)?$/.test(t) ? Number(t) * 1000 : t);
            else d = new Date();
            return (isNaN(d.getTime()) ? new Date() : d).toISOString().slice(0, 10);
        })();
        const cid = foundData.conversation_id
            || (location.pathname.match(/\/c\/([a-f0-9-]+)/) || [])[1]
            || 'unknown';
        const slug = ((foundData.title) || 'untitled')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 60) || 'untitled';
        const fileName = `${datePrefix}_gpt_${cid}_${slug}.json`;

        window.__GPTCAPTURE = { foundData, routeKey, json, fileName };

        const anchor = document.createElement('a');
        anchor.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(anchor.href), 2000);

        const nodes = foundData.mapping ? Object.keys(foundData.mapping).length : 0;
        console.log(`[gptcapture] 🟢: ${fileName} | ${json.length}B | ${nodes} nodes | window.__GPTCAPTURE`);
    } catch (err) {
        console.error('[gptcapture] 🔴 (fucked):', err);
    }
})();
