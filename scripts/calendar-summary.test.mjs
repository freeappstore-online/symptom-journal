import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calendarSummary } from '../web/src/calendar-summary.ts';
test('calendar separates symptom counts from temperatures and uses latest timestamp',()=>{
 const symptom={symptom:'Pain',severity:4,symptoms:[{name:'Pain',severity:4},{name:'Swelling',severity:3}],occurredAt:'2026-11-06T09:00:00Z'};
 const reading=(occurredAt,celsius)=>({symptom:'Temperature',temperature:{celsius,method:'Ear'},occurredAt});
 const result=calendarSummary([reading('2026-11-06T20:00:00Z',37.2),symptom,reading('2026-11-06T08:00:00Z',38)]);
 assert.equal(result.symptoms,2);assert.equal(result.temperatureCount,2);assert.equal(result.latest.temperature.celsius,37.2);
 assert.equal(calendarSummary([]).latest,undefined);
});
