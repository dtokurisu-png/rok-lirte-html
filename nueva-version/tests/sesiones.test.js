import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession, getSessionState, performSessionAction, releaseSessions } from '../backend/src/sesiones.js';
const e={id:'enigma-apprentice',mode:'adventure',arenaId:'kiara',playerCasterId:'lioren',rivalCasterId:'kasterKiaraWater'};
const player={id:'lioren',stats:{life:14,attack:2,range:3,movement:3}};
const rival={id:'kasterKiaraWater',stats:{life:8,attack:1,range:2,movement:2}};
test('autoridad de sesion, revision y deduplicacion de ordenes',()=>{
  const {session}=createSession('owner-1',e,player,rival);
  const cmd={sessionId:session.id,actionId:'move-action-0001',expectedRevision:0,type:'move',row:15,col:4};
  assert.equal(getSessionState('intruso',session.id).ok,false);
  assert.equal(performSessionAction('intruso',cmd).ok,false);
  const first=performSessionAction('owner-1',cmd);
  assert.equal(first.ok,true);
  assert.equal(first.state.casters[0].row,15);
  assert.equal(first.state.revision,1);
  const repeated=performSessionAction('owner-1',cmd);
  assert.deepEqual(repeated,first);
  assert.equal(getSessionState('owner-1',session.id).state.revision,1);
  assert.equal(performSessionAction('owner-1',{...cmd,actionId:'move-action-0002'}).error,'stale-revision');
  releaseSessions('owner-1');
  assert.equal(getSessionState('owner-1',session.id).ok,false);
});
test('el turno automatico de Kiara es calculado por el servidor',()=>{
  const {session}=createSession('owner-2',e,player,rival);
  const result=performSessionAction('owner-2',{sessionId:session.id,actionId:'end-turn-000001',
    expectedRevision:0,type:'endTurn'});
  assert.equal(result.ok,true);
  assert.equal(result.state.turn.side,1);
  assert.ok(result.state.revision>=3);
  assert.ok(result.events.some(event=>event.type==='unit.moved'));
  releaseSessions('owner-2');
});
