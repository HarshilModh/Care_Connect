

export const toSeconds = (ttl) => {
    if (!ttl) return 7 * 24 * 60 * 60; // default 7d
    if (/^\d+$/.test(ttl)) return parseInt(ttl, 10); // already seconds
    const m = ttl.match(/^(\d+)([smhd])$/i);
    if (!m) return 7 * 24 * 60 * 60;
    const n = parseInt(m[1], 10);
    const unit = m[2].toLowerCase();
    const mult = { s: 1, m: 60, h: 3600, d: 86400 }[unit];
    return n * mult;
  };