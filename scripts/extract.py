"""Normalise the page's decoded loader data (scripts/data.json) into src/content.json and download all assets into public/."""
import json, re, hashlib, os, sys, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(f"{ROOT}/scripts/data.json"))
r = d["loaderData"]["routes/($locale).editions.winter2026"]
dl = {}   # url -> local path (relative to public/)

def fetch_target(url, kind):
    ext = {"json": ".json", "glb": ".glb", "ktx2": ".ktx2"}.get(kind) or os.path.splitext(urllib.parse.urlparse(url).path)[1] or ".bin"
    name = hashlib.sha1(url.encode()).hexdigest()[:12] + ext
    sub = "scenes" if kind in ("json", "glb", "ktx2") else "img"
    dl[url] = f"{sub}/{name}"
    return "/" + dl[url]

def image(o, w=1400):
    if not o: return None
    u = o["url"]
    if "cdn.shopify.com/s/files" in u and "width=" not in u: u += ("&" if "?" in u else "?") + f"width={w}"
    return {"src": fetch_target(u, "img"), "alt": o.get("altText") or "", "w": o.get("width"), "h": o.get("height"), "focal": o.get("focalPoint")}

def card(p):
    pm = p.get("productMedia") or {}; v = pm.get("video")
    out = {"id": p["handle"], "title": p.get("headlineTitle") or p["title"], "html": p.get("descriptionHtml") or "",
           "ctas": [{"t": c["title"], "u": c["url"]} for c in p.get("ctas") or []], "cols": p.get("numberOfColumns"),
           "type": p.get("cardType"), "ratio": p.get("coverAspectRatio"), "xxl": p.get("xxlCardRegistryHandle"),
           "image": image(pm.get("image")), "mobile": image((p.get("mobileMedia") or {}).get("image")), "bg": image(p.get("backgroundImage"), 1000)}
    if v: out["video"] = {"poster": image({"url": v["previewImage"]["url"]}, 1200)["src"], "mp4": (v.get("sources") or [{}])[0].get("url")}
    return out

def asset(a):
    u = a["url"]; kind = "glb" if u.split("?")[0].endswith(".glb") else "ktx2" if ".ktx2" in u else "json" if ".json" in u else "img"
    return {"kind": kind, "src": fetch_target(u, kind), "id": a.get("id")}

def section(c):
    xxl = []
    for g in (c.get("xxlCollections") or []) + (c.get("bottomXxlCollections") or []):
        xxl.append({"id": g["handle"], "title": g["title"], "html": g.get("descriptionHtml") or "", "cards": [card(p) for p in g["products"]],
                    "bottom": g in (c.get("bottomXxlCollections") or [])})
    return {"id": c["handle"], "title": c["title"], "html": c["descriptionHtml"], "mode": c.get("mode"), "camera": c.get("customCameraName"),
            "scene": fetch_target(c["backgroundAnimation"]["url"], "json") if c.get("backgroundAnimation") else None,
            "assets": [asset(a) for a in (c.get("backgroundAssets") or [])],
            "custom": [asset(a) for a in (c.get("backgroundCustomAssets") or [])],
            "fallback": image(c.get("fallbackImage"), 1600), "cards": [card(p) for p in c["products"]], "xxl": xxl}

h = r["hero"]
content = {"hero": {"tagline": h["tagline"], "subtitle": h["subtitle"], "scene": fetch_target(h["backgroundAnimation"]["url"], "json"),
                    "assets": [asset(a) for a in h["backgroundAssets"]], "fallback": image(h["fallbackImage"], 1800)},
           "sections": [section(c) for c in r["collections"]], "youtube": r["youtubeVideos"],
           "nav": [{"id": n["handle"], "title": n["title"]} for n in r["sideNav"]],
           "strings": {k: v for k, v in r["globalStrings"].items() if isinstance(v, (str, dict))}, "topSkills": r["topSkills"]}
json.dump(content, open(f"{ROOT}/src/content.json", "w"), indent=1)
print("unique assets:", len(dl))

def get(item):
    url, rel = item; out = f"{ROOT}/public/{rel}"
    if os.path.exists(out): return 0
    try:
        data = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=60).read()
        open(out, "wb").write(data); return len(data)
    except Exception as e:
        print("FAIL", url[:100], e); return 0
os.makedirs(f"{ROOT}/src", exist_ok=True)
with ThreadPoolExecutor(8) as ex: total = sum(ex.map(get, dl.items()))
print("downloaded MB:", round(total / 1e6, 1))
