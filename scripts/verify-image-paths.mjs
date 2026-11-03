#!/usr/bin/env node
// Verifica que las referencias activas migraron y que todos los activos canónicos
// son copias exactas, antes de permitir el commit del workflow.
import {readFileSync,existsSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Script} from 'node:vm';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';

const manifest=JSON.parse(readFileSync('assets/manifests/image-paths.json','utf8'));
const status=JSON.parse(readFileSync('assets/manifests/image-migration-status.json','utf8'));
assert.equal(manifest.entries.length,175);
assert.ok(status.changedReferences>=400);

const files=[
  'game.js','style.css','index.html','firebase-online.js','sw.js',
  'nueva-version/frontend/js/adventure-bridge.js',
  'nueva-version/frontend/js/ui/spellbook-hud.js'
];
for(const filename of files){
  const source=readFileSync(filename,'utf8');
  for(const record of manifest.entries){
    assert.ok(!source.includes(record.source),filename+' still references '+record.source);
  }
  if(filename.endsWith('.js')){
    const syntax=spawnSync(process.execPath,
      ['--check','--input-type='+
        (filename.includes('ui/spellbook-hud.js')?'module':'commonjs')],
      {input:source,encoding:'utf8',maxBuffer:1024*1024});
    assert.equal(syntax.status,0,filename+': '+syntax.stderr);
  }
  if(filename==='index.html'){
    for(const match of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){
      if(match[1].trim())new Script(match[1],{filename});
    }
  }
}
for(const {source,canonical,sha} of manifest.entries){
  assert.ok(existsSync(source),'Missing legacy alias '+source);
  assert.ok(existsSync(canonical),'Missing canonical file '+canonical);
  const a=readFileSync(source),b=readFileSync(canonical);
  assert.equal(a.length,b.length,canonical);
  const gitSha=buffer=>createHash('sha1').update('blob '+buffer.length+'\0').update(buffer).digest('hex');
  assert.equal(gitSha(a),sha,'Legacy SHA mismatch '+source);
  assert.equal(gitSha(b),sha,'Canonical SHA mismatch '+canonical);
}
console.log('Migration verified:',manifest.entries.length,'exact image copies and',
  status.changedReferences,'updated references across',files.length,'active source files.');
