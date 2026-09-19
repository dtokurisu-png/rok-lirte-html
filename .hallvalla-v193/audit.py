#!/usr/bin/env python3
from pathlib import Path
import re, json, collections

ROOT=Path('hvsrc')
WEB=ROOT/'web'
js_files=sorted(WEB.rglob('*.js'))
css_files=sorted(WEB.rglob('*.css'))
html_files=sorted(WEB.rglob('*.html'))

def txt(p): return p.read_text(encoding='utf-8',errors='ignore')
def line_of(s,pos): return s.count('\n',0,pos)+1

def find_end(s,start):
    brace=s.find('{',start)
    if brace<0:return None
    depth=0;i=brace;state='code';quote='';esc=False
    while i<len(s):
        ch=s[i];nxt=s[i+1] if i+1<len(s) else ''
        if state=='line':
            if ch=='\n':state='code'
        elif state=='block':
            if ch=='*' and nxt=='/':state='code';i+=1
        elif state=='str':
            if esc:esc=False
            elif ch=='\\':esc=True
            elif ch==quote:state='code'
        elif state=='template':
            if esc:esc=False
            elif ch=='\\':esc=True
            elif ch=='`':state='code'
        else:
            if ch=='/' and nxt=='/':state='line';i+=1
            elif ch=='/' and nxt=='*':state='block';i+=1
            elif ch in ("'",'"'):state='str';quote=ch
            elif ch=='`':state='template'
            elif ch=='{':depth+=1
            elif ch=='}':
                depth-=1
                if depth==0:return i+1
        i+=1
    return None

all_text='\n'.join(txt(p) for p in js_files+css_files+html_files)
ident_counts=collections.Counter(re.findall(r'[A-Za-z_$][\\w$]*',all_text))
files=[];functions=[];symbols=collections.defaultdict(list)
for p in js_files:
    rel=str(p.relative_to(ROOT));s=txt(p);decl=0;longn=0;tops=[]
    for m in re.finditer(r'(?m)^([ \\t]*)(?:async[ \\t]+)?function[ \\t]+([A-Za-z_$][\\w$]*)[ \\t]*\\(',s):
        name=m.group(2);end=find_end(s,m.start())
        if end is None:continue
        sl=line_of(s,m.start());el=line_of(s,end);ln=el-sl+1
        functions.append({'file':rel,'name':name,'start':sl,'end':el,'lines':ln,'refs':ident_counts[name]})
        symbols[name].append((rel,sl,'function'));decl+=1
        if ln>=120:longn+=1
    for m in re.finditer(r'(?m)^(?:const|let|var)[ \\t]+([A-Za-z_$][\\w$]*)',s):
        name=m.group(1);symbols[name].append((rel,line_of(s,m.start()),'var'));tops.append(name)
    files.append({'file':rel,'bytes':p.stat().st_size,'lines':s.count('\n')+1,'functions':decl,'long_functions':longn,'listeners':s.count('.addEventListener('),'dom':s.count('querySelector(')+s.count('querySelectorAll(')+s.count('getElementById('),'localStorage':s.count('localStorage'),'firebase_calls':len(re.findall(r'\\b(?:ref|get|set|update|onValue|runTransaction|remove)\\s*\\(',s)),'global_writes':len(re.findall(r'\\b(?:globalThis|window)\\.[A-Za-z_$][\\w$]*\\s*=',s)),'top_level_names':len(set(tops))})

long_functions=sorted([f for f in functions if f['lines']>=120],key=lambda x:-x['lines'])
dead_funcs=sorted([f for f in functions if f['refs']==1],key=lambda x:(x['file'],x['start']))
duplicate_symbols=[]
for name,locs in symbols.items():
    fs=sorted(set(x[0] for x in locs))
    if len(fs)>1:duplicate_symbols.append({'name':name,'files':fs,'locations':locs[:20]})
duplicate_symbols.sort(key=lambda x:(-len(x['files']),x['name']))

global_writes=collections.defaultdict(list)
for p in js_files:
    rel=str(p.relative_to(ROOT));s=txt(p)
    for m in re.finditer(r'\\b(?:globalThis|window)\\.([A-Za-z_$][\\w$]*)\\s*=',s):
        global_writes[m.group(1)].append({'file':rel,'line':line_of(s,m.start())})
global_collisions=[{'name':k,'writes':v} for k,v in global_writes.items() if len(set(x['file'] for x in v))>1]
global_collisions.sort(key=lambda x:(-len(x['writes']),x['name']))

css_reports=[];css_dups=[]
for p in css_files:
    s=txt(p);rel=str(p.relative_to(ROOT));selc=collections.Counter()
    for chunk in s.split('}'):
        if '{' not in chunk:continue
        head=chunk.rsplit('{',1)[0].strip()
        if not head or head.startswith('@') or len(head)>2500:continue
        for sel in head.split(','):
            sel=' '.join(sel.split())
            if sel and not sel.startswith('@'):selc[sel]+=1
    dups=[(k,v) for k,v in selc.items() if v>1]
    css_reports.append({'file':rel,'bytes':p.stat().st_size,'lines':s.count('\n')+1,'selectors':len(selc),'duplicate_selectors':len(dups),'important':s.count('!important'),'media':s.count('@media')})
    for sel,n in sorted(dups,key=lambda x:-x[1])[:500]:css_dups.append({'file':rel,'selector':sel,'count':n})

markers=[]
for p in js_files+css_files+html_files:
    s=txt(p);rel=str(p.relative_to(ROOT));row={'file':rel}
    for label,pat in [('legacy',r'\\blegacy\\b'),('deprecated',r'\\bdeprecated\\b'),('disabled',r'\\bdisabled\\b'),('todo',r'\\bTODO\\b'),('fixme',r'\\bFIXME\\b'),('if_false',r'if\\s*\\(\\s*false\\s*\\)'),('false_and',r'false\\s*&&')]:
        n=len(re.findall(pat,s,re.I))
        if n:row[label]=n
    if len(row)>1:markers.append(row)

report={'summary':{'js_files':len(js_files),'js_bytes':sum(p.stat().st_size for p in js_files),'js_lines':sum(txt(p).count('\n')+1 for p in js_files),'css_files':len(css_files),'css_bytes':sum(p.stat().st_size for p in css_files),'css_lines':sum(txt(p).count('\n')+1 for p in css_files),'functions':len(functions),'long_functions':len(long_functions),'dead_named_functions_refs1':len(dead_funcs),'duplicate_symbols_across_files':len(duplicate_symbols),'global_write_collisions':len(global_collisions)},'files':sorted(files,key=lambda x:-x['bytes']),'long_functions':long_functions,'dead_named_functions_refs1':dead_funcs,'duplicate_symbols':duplicate_symbols[:300],'global_write_collisions':global_collisions,'css':css_reports,'css_duplicate_selectors_top':sorted(css_dups,key=lambda x:-x['count'])[:300],'markers':markers}
Path('audit193').mkdir(exist_ok=True)
Path('audit193/audit-v193.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')

md=['# HallValla - auditoria profunda v193','']
S=report['summary']
md += ['- JS: %d archivos / %d lineas / %d bytes'%(S['js_files'],S['js_lines'],S['js_bytes']),'- CSS: %d archivos / %d lineas / %d bytes'%(S['css_files'],S['css_lines'],S['css_bytes']),'- Funciones declaradas: %d'%S['functions'],'- Funciones >=120 lineas: %d'%S['long_functions'],'- Funciones refs=1: %d'%S['dead_named_functions_refs1'],'- Simbolos repetidos entre archivos: %d'%S['duplicate_symbols_across_files'],'- Globals escritos desde varios archivos: %d'%S['global_write_collisions'],'','## Hotspots por archivo']
for x in report['files'][:25]:md.append('- %s: %d lineas / %d funciones / %d largas / DOM=%d / listeners=%d / globals=%d'%(x['file'],x['lines'],x['functions'],x['long_functions'],x['dom'],x['listeners'],x['global_writes']))
md += ['','## Funciones largas']
for x in long_functions[:80]:md.append('- %s:%d %s - %d lineas - refs=%d'%(x['file'],x['start'],x['name'],x['lines'],x['refs']))
md += ['','## Funciones refs=1']
for x in dead_funcs:md.append('- %s:%d %s'%(x['file'],x['start'],x['name']))
md += ['','## Globals con multiples escritores']
for x in global_collisions[:80]:md.append('- %s <- %s'%(x['name'],', '.join(sorted(set(w['file'] for w in x['writes'])))))
md += ['','## CSS']
for x in css_reports:md.append('- %s: %d lineas / selectores=%d / duplicados=%d / important=%d / media=%d'%(x['file'],x['lines'],x['selectors'],x['duplicate_selectors'],x['important'],x['media']))
Path('audit193/AUDITORIA_PROFUNDA_v193.md').write_text('\n'.join(md)+'\n',encoding='utf-8')
print('\n'.join(md[:240]))