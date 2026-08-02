// How many reverse proxies sit in front of this process. Express reads the Nth
// entry from the right of X-Forwarded-For, so only a proxy we actually run can
// influence req.ip.
//
// Never set this to `true`: that trusts the whole header, letting any client
// choose the IP recorded in the audit log and defeat per-IP rate limiting.
//
// Anything unparseable falls back to 0, which fails safe — req.ip becomes the
// socket peer, which may be a proxy address but can never be forged.
export function resolveTrustProxyHops(raw: string | undefined): number {
    if (!raw) return 0;
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 0) return 0;
    return parsed;
}
