"""Theatre 0.7.2 rejects compound keys containing anything but [A-Za-z0-9]; GLB clip names (and thus state keys) contain spaces/_/-/.
Rewrite each scene state so clip names are alphanumeric (the app applies the same rule to GLB clip names)."""
import json, struct, re, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
c = json.load(open(f"{ROOT}/src/content.json"))
def clips(path):
    b = open(f"{ROOT}/public{path}", "rb").read(); l = struct.unpack("<I", b[12:16])[0]
    return [a["name"] for a in json.loads(b[20:20 + l]).get("animations", [])]
for s in [c["hero"]] + c["sections"]:
    names = {n for a in s["assets"] + s.get("custom", []) if a["kind"] == "glb" for n in clips(a["src"])}
    p = f"{ROOT}/public{s['scene']}"; t = open(p).read(); changed = 0
    for n in names:
        k = re.sub(r"[^A-Za-z0-9]", "", n)
        if k != n and f'"{n}"' in t: t = t.replace(f'"{n}"', f'"{k}"'); changed += 1
    open(p, "w").write(t); print(s.get("id", "hero"), "renamed", changed)
