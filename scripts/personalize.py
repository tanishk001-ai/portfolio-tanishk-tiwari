"""Build src/content.json for the portfolio page from scripts/content.shopify.json (the decoded Shopify Editions page data).
Keeps only what the scenes need: the hero scene plus three section scenes reused for Work / About / Contact.
All copy lives in src/portfolio.js, not here. Unreferenced downloaded assets are pruned from public/ (re-run extract.py to restore)."""
import json, os, copy
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = json.load(open(f"{ROOT}/scripts/content.shopify.json"))
pick = {"online": "work", "sidekick": "about", "developer": "contact"}   # scene reused -> portfolio section id
out = {"hero": copy.deepcopy(src["hero"]), "sections": []}
for s in src["sections"]:
    if s["id"] in pick:
        t = {k: s[k] for k in ("mode", "camera", "scene", "assets", "custom", "fallback")}
        t["id"] = pick[s["id"]]; t["scene_origin"] = s["id"]; out["sections"].append(t)
order = {"work": 0, "about": 1, "contact": 2}; out["sections"].sort(key=lambda s: order[s["id"]])
json.dump(out, open(f"{ROOT}/src/content.json", "w"), indent=1, ensure_ascii=False)

# prune unreferenced assets
keep = set()
def walk(o):
    if isinstance(o, dict):
        for k, v in o.items():
            if k in ("src", "scene") and isinstance(v, str) and v.startswith("/"): keep.add(v.lstrip("/"))
            walk(v)
    elif isinstance(o, list):
        for v in o: walk(v)
walk(out)
removed = 0
for sub in ("scenes", "img"):
    for f in os.listdir(f"{ROOT}/public/{sub}"):
        if f"{sub}/{f}" not in keep: os.remove(f"{ROOT}/public/{sub}/{f}"); removed += 1
print("sections:", [s["id"] for s in out["sections"]], "kept assets:", len(keep), "pruned:", removed)
