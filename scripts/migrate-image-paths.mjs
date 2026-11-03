#!/usr/bin/env node
// Migración conservadora de referencias a imágenes: solo sustituye rutas exactas
// inventariadas; nunca modifica mecánicas, hojas antiguas o datos guardados.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {Script} from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';

const cwd=process.cwd();
const read=p=>readFileSync(path.resolve(cwd,p),'utf8');
const write=(p,s)=>writeFileSync(path.resolve(cwd,p),s);
const manifest=JSON.parse(read('assets/manifests/image-paths.json'));
assert.equal(manifest.entries.length,175,'Se esperaban 175 imágenes inventariadas');
const list=manifest.entries.map(x=>({source:x.source,canonical:x.canonical,sha:x.sha}))
  .sort((a,b)=>b.source.length-a.source.length);
for(const row of list){
  assert.ok(row.source.startsWith('assets/'));
  assert.ok(row.canonical.startsWith('assets/images/'));
  assert.ok(existsSync(row.canonical),'Falta destino: '+row.canonical);
}
const files=[
  'game.js','style.css','index.html',
  'firebase-online.js','sw.js',
  'nueva-version/frontend/js/adventure-bridge.js',
  'nueva-version/frontend/js/ui/spellbook-hud.js'
];
const changes=[];
for(const filename of files){
  const before=read(filename);
  let after=before, replaced=0;
  for(const {source,canonical} of list){
    const parts=after.split(source);
    if(parts.length>1){replaced+=parts.length-1;after=parts.join(canonical);}
  }
  if(filename==='sw.js'){
    const old="rok-lite-v9-89-mobile-bypass-auth-test";
    const updated="rok-lite-v9-90-organized-assets";
    if(after.includes(old))after=after.replace(old,updated);
  }
  if(after===before){changes.push({file:filename,replacements:0,unchanged:true});continue;}
  // Garantizar que la operación es reversible al byte: ninguna lógica alterada.
  let restored=after;
  for(const {source,canonical} of list){
    restored=restored.split(canonical).join(source);
  }
  if(filename==='sw.js')restored=restored.replace('rok-lite-v9-90-organized-assets','rok-lite-v9-89-mobile-bypass-auth-test');
  assert.equal(restored,before,'La sustitución no fue reversible en '+filename);
  if(filename.endsWith('.js')){
    const isModule=filename==='nueva-version/frontend/js/ui/spellbook-hud.js';
    const check=spawnSync(process.execPath,
      ['--check','--input-type='+ (isModule?'module':'commonjs')],
      {input:after,encoding:'utf8',maxBuffer:1024*1024});
    assert.equal(check.status,0,'JS sintaxis '+filename+': '+check.stderr);
  }
  if(filename.endsWith('.html')){
    for(const part of after.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){
      if(part[1].trim())new Script(part[1],{filename});
    }
  }
  // Los archivos históricamente complejos se comprueban también por referencias:
  for(const {source} of list)assert.ok(!after.includes(source),
    'Quedó ruta antigua '+source+' en '+filename);
  write(filename,after);
  changes.push({file:filename,replacements:replaced,bytesBefore:Buffer.byteLength(before),bytesAfter:Buffer.byteLength(after)});
}
const total=changes.reduce((n,c)=>n+c.replacements,0);
assert.ok(total>=400,'La migración sustituyó inesperadamente pocas rutas: '+total);
const record={
  schemaVersion:1,
  migrationDate:'2026-11-03',
  phase:'static references migrated, legacy URL aliases retained for persisted user data',
  copiedImages:list.length,
  changedReferences:total,
  files:changes,
  compatibility:'Original public asset paths retained until runtime and saved-data audit.'
};
write('assets/manifests/image-migration-status.json',JSON.stringify(record,null,2)+'\n');
console.log('ROK asset migration:',JSON.stringify(record,null,2));
