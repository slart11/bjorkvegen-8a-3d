import os
import json
import base64
import zipfile

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, "src")
ART = os.path.join(BASE, "art_crops")
THREE_PATH = os.path.join(BASE, "vendor", "three.min.js")

def read_txt(p):
    with open(p, "r", encoding="utf-8") as f:
        return f.read()

tpl = read_txt(os.path.join(BASE, "template.html"))
css = read_txt(os.path.join(SRC, "styles.css"))
three_js = read_txt(THREE_PATH)

art_files = {
    "doig": "art_doig.jpg",
    "floral": "art_floral.jpg",
    "louisiana_gill": "art_louisiana_gill.jpg",
    "peacock": "art_peacock.jpg",
    "huhta": "art_huhta.jpg",
    "master_blue": "art_master_blue.jpg",
    "master_bw": "art_master_bw.jpg",
    "east_blush": "art_east_blush.jpg",
}

art_data = {}
for k, fn in art_files.items():
    p = os.path.join(ART, fn)
    if os.path.exists(p):
        with open(p, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("ascii")
        art_data[k] = f"data:image/jpeg;base64,{b64}"

js_parts = []
for fn in ["textures.js", "architecture.js", "furniture_living.js", "furniture_rooms.js", "blaster.js", "zombies.js", "app.js"]:
    js_parts.append(f"// === {fn} ===\n" + read_txt(os.path.join(SRC, fn)))
app_scripts = "\n\n".join(js_parts)

html = (
    tpl.replace("__CSS__", css, 1)
       .replace("__THREE_JS__", three_js, 1)
       .replace("__ART_DATA__", json.dumps(art_data), 1)
       .replace("__APP_SCRIPTS__", app_scripts, 1)
)

out_html = os.path.join(BASE, "bjorkvegen-8a-3d.html")
index_html = os.path.join(BASE, "index.html")
deploy_dir = os.path.join(BASE, "netlify-deploy")
deploy_sub = os.path.join(deploy_dir, "bjorkvegen8a")
os.makedirs(deploy_sub, exist_ok=True)
deploy_root_index = os.path.join(deploy_dir, "index.html")
deploy_sub_index = os.path.join(deploy_sub, "index.html")
zip_path = os.path.join(BASE, "netlify-deploy.zip")

for p in (out_html, index_html, deploy_root_index, deploy_sub_index):
    with open(p, "w", encoding="utf-8") as f:
        f.write(html)

with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
    zf.write(deploy_root_index, arcname="index.html")
    zf.write(deploy_sub_index, arcname="bjorkvegen8a/index.html")

size_kb = os.path.getsize(out_html) / 1024
zip_kb = os.path.getsize(zip_path) / 1024
print(f"Built {out_html}, {index_html}, {deploy_sub_index} ({size_kb:.1f} KB) and {zip_path} ({zip_kb:.1f} KB)")
