// Vercel Serverless Function — fetches real news from Google News RSS
// No API key required. Returns real articles with working URLs.

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const query = req.method === 'POST' ? req.body?.query : req.query?.query;
    if (!query) return res.status(400).json({ error: 'query required' });

    try {
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
        const response = await fetch(rssUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FranklinFullCircle/1.0)' },
        });

        if (!response.ok) throw new Error(`RSS fetch failed: ${response.status}`);

        const xml = await response.text();
        const articles = [];

        for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
            const item = match[1];

            const titleRaw = (item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
                              item.match(/<title>([\s\S]*?)<\/title>/))?.[1]?.trim() || '';
            const link     = (item.match(/<link>([\s\S]*?)<\/link>/) ||
                              item.match(/<guid isPermaLink="true">([\s\S]*?)<\/guid>/))?.[1]?.trim() || '';
            const pubDate  = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || '';
            const sourceEl = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.trim() || '';

            if (!titleRaw || !link) continue;

            // Google News RSS appends " - Source Name" to titles; strip it
            let title = titleRaw;
            let source = sourceEl;
            const lastDash = titleRaw.lastIndexOf(' - ');
            if (lastDash !== -1) {
                const candidate = titleRaw.slice(lastDash + 3);
                if (!source) source = candidate;
                // Only strip if it matches the source tag (avoids stripping dashes in real titles)
                if (candidate === source) title = titleRaw.slice(0, lastDash);
            }

            const date = pubDate
                ? new Date(pubDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : '';

            articles.push({ title: title.trim(), url: link, source: source.trim(), date });
            if (articles.length >= 8) break;
        }

        return res.status(200).json({ articles });
    } catch (err) {
        console.error('News fetch error:', err);
        return res.status(500).json({ error: err.message });
    }
}
