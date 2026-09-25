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

        // high-fidelity deliverable
        const payload = {
            _exporter: 'gptcapture-fidelity-dynamic',
            _exported_at: new Date().toISOString(),
            _source_url: location.href,
            _route_key: routeKey,
            _mapping_nodes: foundData.mapping ? Object.keys(foundData.mapping).length : 0,
            serverResponseData: foundData,
        };

        const json = JSON.stringify(payload, getReplacer(), 2);
        const fileName = ((foundData.title) || location.pathname.split('/').pop() || 'conversation')
            .replace(/[^\w\-]+/g, '_')
            .slice(0, 60);

        window.__GPTCAPTURE = { foundData, routeKey, payload, json };

        // native gzip compression stream pipeline execution
        const gzipBuffer = new Uint8Array(
            await new Response(
                new Blob([new TextEncoder().encode(json)]).stream().pipeThrough(new CompressionStream('gzip'))
            ).arrayBuffer()
        );

        // instantly trigger atomic browser file-storage save op
        const anchor = document.createElement('a');
        anchor.href = URL.createObjectURL(new Blob([gzipBuffer], { type: 'application/gzip' }));
        anchor.download = fileName + '.fidelity.json.gz';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(anchor.href), 2000);

        console.log(`[gptcapture] 🟢: ${fileName}.fidelity.json.gz (ripped) | ${json.length}B raw -> ${gzipBuffer.length}B gz | ${payload._mapping_nodes} nodes | window.__GPTCAPTURE`);
    } catch (err) {
        console.error('[gptcapture] 🔴 (fucked):', err);
    }
})();
