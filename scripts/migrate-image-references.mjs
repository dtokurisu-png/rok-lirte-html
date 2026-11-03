#!/usr/bin/env node
/**
 * Migrate only literal image URLs in the active R.O.K. Lite UI.
 * Does not touch game mechanics, art binaries, historical versions or caches.
 * Canonical asset sha1 is validated against the manifest BEFORE edits.
 */
import {createHash} from 'node:crypto';
import {readFile,writeFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const targetFiles=[
  'game.js','style.css','index.html','firebase-online.js',
  'nueva-version/frontend/js/adventure-bridge.js',
  'nueva-version/frontend/js/ui/spellbook-hud.js',
  'nueva-version/tests/flujo-aventura.test.js','sw.js'
];
const canonicalManifest=JSON.parse(
  await readFile(path.join(ROOT,'assets/manifests/image-paths.json'),'utf8'));
const entries=[...canonicalManifest.entries].sort((a,b)=>b.source.length-a.source.length);
if(entries.length!==175)throw Error('Expected 175 mapped image assets.');
if(new Set(entries.map(x=>x.source)).size!==entries.length)throw Error('Duplicate source key');
if(new Set(entries.map(x=>x.canonical)).size!==entries.length)throw Error('Duplicate canonical target');
for(const entry of entries){
  if(!entry.source.startsWith('assets/')||!entry.canonical.startsWith('assets/images/'))
    throw Error('Unexpected mapping path: '+entry.source);
  const canonicalPath=path.resolve(ROOT,entry.canonical);
  const originalPath=path.resolve(ROOT,entry.source);
  const [original,canonical]=await Promise.all([readFile(originalPath),readFile(canonicalPath)]);
  if(!original.equals(canonical))throw Error('Copied image differs from original: '+entry.source);
  const sha=createHash('sha1').update('blob '+canonical.length+'\\0').update(canonical).digest('hex');
  if(sha!==entry.sha)throw Error('Git blob hash mismatch: '+entry.canonical);
}
const plan=[];let total=0;
for(const file of targetFiles){
  const full=path.resolve(ROOT,file);
  let source=await readFile(full,'utf8');
  let next=source,count=0;
  for(const {source:oldPath,canonical:newPath} of entries){
    const occurrences=next.split(oldPath).length-1;
    if(!occurrences)continue;
    next=next.split(oldPath).join(newPath);
    count+=occurrences;
  }
  const leftover=entries.filter(e=>next.includes(e.source));
  if(leftover.length)throw Error('Legacy literal remains in '+file+': '+leftover[0].source);
  plan.push({file,full,source,next,count});
  total+=count;
}
const verifyOnly=process.argv.includes('--verify');
if(verifyOnly&&total)throw Error(total+' legacy image references still need migration');
if(!verifyOnly&&!total){
  console.log('Already migrated: no changes needed.');
}else if(!verifyOnly){
  // Preflight the syntax of all JavaScript after editing on disk.
  // The files are restored to their original bytes if any check fails.
  const changed=plan.filter(x=>x.next!==x.source);
  try{
    for(const item of changed)await writeFile(item.full,item.next,'utf8');
    for(const item of changed.filter(x=>x.file.endsWith('.js'))){
      const result=spawnSync(process.execPath,['--check',item.full],{encoding:'utf8'});
      if(result.status!==0)throw Error('JavaScript syntax check failed in '+item.file+': '+result.stderr);
    }
  }catch(error){
    for(const item of changed)await writeFile(item.full,item.source,'utf8');
    throw error;
  }
}
for(const item of plan){
  console.log(item.file+': '+item.count+' URL replacements');
}
console.log('Verified '+entries.length+' image byte pairs. Total legacy URL replacements: '+total);
