#!/usr/bin/env python3
from pathlib import Path
import re, json, collections

ROOT=Path("hvsrc")
WEB=ROOT/"web"
js_files=sorted(WEB.rglob("*.js"))
html_files=sorted(WEB.rglob("*.html"))
css_files=sorted(WEB.rglob("*.css"))

texts={str(p.relative_to(ROOT)):p.read_text(encoding="utf-8",errors="ignore") for p in js_files+html_files+css_files}
all_code="\n".join(texts.values())
identifier_counts=collections.Counter(re.findall(r'[A-Za-z_$][\\w$]*',all_code))

func_decl=[]
for p in js_files:
    rel=str(p.relative_to(ROOT))
    t=texts[rel]
    for m in re.finditer(r'(?m)^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(',t):
        name=m.group(1)
        count=len(re.findall(r'(?<![\w$])'+re.escape(name)+r'(?![\w$])', all_code))
        func_decl.append({"name":name,"file":rel,"line":t.count("\n",0,m.start())+1,"refs":count})
single_funcs=sorted([x for x in func_decl if x["refs"]==1],key=lambda x:(x["file"],x["line"]))

var_funcs=[]
for p in js_files:
    rel=str(p.relative_to(ROOT)); t=texts[rel]
    for m in re.finditer(r'(?m)^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^\n]*\)|[A-Za-z_$][\w$]*)\s*=>',t):
        name=m.group(1)
        count=len(re.findall(r'(?<![\w$])'+re.escape(name)+r'(?![\w$])',all_code))
        var_funcs.append({"name":name,"file":rel,"line":t.count("\n",0,m.start())+1,"refs":count})
single_var_funcs=sorted([x for x in var_funcs if x["refs"]==1],key=lambda x:(x["file"],x["line"]))

refs_text="\n".join(v for k,v in texts.items() if k.endswith((".js",".html")))
orphans=[]
for p in js_files:
    rel=str(p.relative_to(WEB))
    name=p.name
    if rel in ("js/bootstrap-loader.js","firebase-config.js","service-worker.js"): continue
    key=rel[3:] if rel.startswith("js/") else rel
    hits=refs_text.count(key)+refs_text.count(name)
    own=texts[str(p.relative_to(ROOT))]
    hits-=own.count(key)+own.count(name)
    if hits<=0:orphans.append({"file":str(p.relative_to(ROOT)),"size":p.stat().st_size})

disabled=[]
for p in js_files:
    rel=str(p.relative_to(ROOT)); t=texts[rel]
    for pat in [r'if\s*\(\s*false\s*\)',r'if\s*\(\s*0\s*\)',r'false\s*&&',r'\bDISABLED\b',r'\bdeprecated\b',r'\blegacy\b']:
        n=len(re.findall(pat,t,re.I))
        if n: disabled.append({"file":rel,"pattern":pat,"count":n})

css_dups=[]
for p in css_files:
    rel=str(p.relative_to(ROOT)); t=texts[rel]
    selectors=collections.Counter()
    # bounded non-nested rule scan; avoid catastrophic backtracking on huge CSS
    for chunk in t.split("}"):
        if "{" not in chunk: continue
        head=chunk.rsplit("{",1)[0].strip()
        if not head or head.startswith("@") or len(head)>2000: continue
        for s in head.split(","):
            s=" ".join(s.split())
            if s and not s.startswith("@"): selectors[s]+=1
    css_dups.extend({"file":rel,"selector":s,"count":n} for s,n in selectors.items() if n>1)
css_dups=sorted(css_dups,key=lambda x:(-x["count"],x["file"],x["selector"]))

sections={}
for p in js_files:
    if p.stat().st_size<50000: continue
    rel=str(p.relative_to(ROOT)); t=texts[rel]
    heads=[]
    for i,line in enumerate(t.splitlines(),1):
        s=line.strip()
        if re.match(r'^(?://|/\*)\s*(?:[-=]{3,}|(?:ETAPA|STAGE|PERF|PVP|PVE|FORGE|MINE|DRAGON|ADVENTURE|BATTLE|AUTH|SHOP|PROFILE|TUTORIAL|SETTINGS|REALTIME|RT)\b)',s,re.I):
            heads.append({"line":i,"text":s[:180]})
    sections[rel]=heads[:120]

sizes=[{"file":str(p.relative_to(ROOT)),"bytes":p.stat().st_size,"lines":texts[str(p.relative_to(ROOT))].count("\n")+1} for p in js_files]
sizes=sorted(sizes,key=lambda x:-x["bytes"])

globals_found=collections.defaultdict(list)
for p in js_files:
    rel=str(p.relative_to(ROOT)); t=texts[rel]
    for m in re.finditer(r'\b(?:globalThis|window)\.([A-Za-z_$][\w$]*)\s*=',t):
        globals_found[m.group(1)].append(rel)
global_collisions=[{"name":k,"files":sorted(set(v))} for k,v in globals_found.items() if len(set(v))>1]

report={
 "js_files":len(js_files),"css_files":len(css_files),"html_files":len(html_files),
 "js_bytes":sum(p.stat().st_size for p in js_files),
 "css_bytes":sum(p.stat().st_size for p in css_files),
 "largest_js":sizes[:40],
 "single_reference_functions":single_funcs,
 "single_reference_arrow_functions":single_var_funcs,
 "orphan_js_files":orphans,
 "disabled_markers":disabled,
 "css_duplicate_selectors_top":css_dups[:250],
 "global_collisions":global_collisions,
 "section_headings":sections,
}
Path("audit").mkdir(exist_ok=True)
Path("audit/audit.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")

md=[]
md.append("# HallValla - auditoria arquitectonica pre-v192")
md.append("")
md.append("- JS: %d archivos / %d bytes"%(report["js_files"],report["js_bytes"]))
md.append("- CSS: %d archivos / %d bytes"%(report["css_files"],report["css_bytes"]))
md.append("- Funciones declaradas con 1 sola referencia: %d"%len(single_funcs))
md.append("- Arrow functions con 1 sola referencia: %d"%len(single_var_funcs))
md.append("- JS potencialmente huerfanos: %d"%len(orphans))
md.append("- Selectores CSS duplicados detectados: %d"%len(css_dups))
md.append("")
md.append("## Archivos JS mas grandes")
for x in sizes[:30]:md.append("- %s: %d B / %d lineas"%(x["file"],x["bytes"],x["lines"]))
md.append("")
md.append("## Funciones candidatas a codigo muerto (refs=1)")
for x in single_funcs:md.append("- %s:%d %s"%(x["file"],x["line"],x["name"]))
md.append("")
md.append("## Arrow functions candidatas (refs=1)")
for x in single_var_funcs:md.append("- %s:%d %s"%(x["file"],x["line"],x["name"]))
md.append("")
md.append("## JS potencialmente huerfanos")
for x in orphans:md.append("- %s (%d B)"%(x["file"],x["size"]))
md.append("")
md.append("## Colisiones de globals")
for x in global_collisions:md.append("- %s: %s"%(x["name"],", ".join(x["files"])))
Path("audit/AUDIT_PRE_V192.md").write_text("\n".join(md)+"\n",encoding="utf-8")
print("\n".join(md[:140]))
