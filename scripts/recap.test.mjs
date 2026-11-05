import { test } from 'node:test';
import assert from 'node:assert/strict';
import { observations, recentWindow, trendBuckets, recordedTogether, durationEnd } from '../web/src/recap.ts';
const base = { id:'a', profileId:'p', symptom:'Pain', severity:4, occurredAt:'2026-11-04T10:00:00Z', duration:'', notes:'', location:null };
test('recap separates locations and mood, preserving individual scores', () => {
 const rows = observations([base, {...base,id:'b',location:{region:'Left shoulder',view:'front'},feelings:[{name:'Anxious',kind:'mood',intensity:7,notes:''}]}]);
 assert.equal(rows.length,3); assert.equal(new Set(rows.map(r=>r.key)).size,3); assert.equal(rows.find(r=>r.mood).score,7);
});
test('general entries never invent pain scores; zero remains a valid observation', () => {
 const rows = observations([{...base,kind:'general',severity:undefined,feelings:[{name:'Fatigue',kind:'physical',intensity:0,notes:''}]}]);
 assert.equal(rows.length,1); assert.equal(rows[0].score,0);
});
test('recent periods use inclusive local calendar days and exclude future days', () => {
 const now = new Date(2026,10,4,12); const {start,end}=recentWindow(3,now);
 assert.equal(start,new Date(2026,10,2).getTime()); assert.equal(end,new Date(2026,10,4,23,59,59,999).getTime());
});

test('trend averages preserve zero, count logs and leave missing severity blank', () => {
 const rows = observations([{...base,severity:0}, {...base,id:'b',severity:8,occurredAt:'2026-11-04T14:00:00Z'}]);
 const start = new Date(2026,10,4).getTime(), end = new Date(2026,10,5,23,59,59,999).getTime();
 const b = trendBuckets(rows,start,end,1);
 assert.equal(b[0].count,2); assert.equal(b[0].mean,4);
 assert.equal(b[1].count,0); assert.equal(b[1].mean,null); assert.equal(b[1].latestId,null);
 const weekly = trendBuckets(rows,start,end,7); assert.equal(weekly.length,1); assert.equal(weekly[0].count,2);
});
test('recorded together counts distinct entries, never causal relationships', () => {
 const selected = observations([base]);
 const all = [...selected,{...selected[0],id:'x',key:'mood:anxious',label:'Anxious'},{...selected[0],id:'y',key:'mood:anxious',label:'Anxious'}, {...selected[0],entryId:'outside',key:'physical:nausea',label:'Nausea'}];
 assert.deepEqual(recordedTogether(all,selected),[{label:'Anxious',count:1,total:1}]);
});

test('duration bands use explicit units; ambiguous and ongoing entries stay points',()=>{
 const start=Date.parse('2026-11-05T10:00:00Z');
 assert.equal(durationEnd(start,'45 minutes'),start+45*60000);
 assert.equal(durationEnd(start,'1.5 hours'),start+90*60000);
 for(const text of ['', 'ongoing','45','yesterday','-1 hours','999 days'])assert.equal(durationEnd(start,text),null);
 const row=observations([{...base,duration:'45 minutes'}])[0];assert.equal(row.endTime,row.time+45*60000);
});
