import type { Entry } from "./store";
import { entrySymptoms } from "./logging.ts";
export function calendarSummary(entries:Entry[]) {
 const symptoms=entries.reduce((sum,e)=>sum+entrySymptoms(e).length+(e.feelings?.length??0),0);
 const temperatures=entries.filter(e=>e.temperature).sort((a,b)=>Date.parse(b.occurredAt)-Date.parse(a.occurredAt));
 return {symptoms,temperatureCount:temperatures.length,latest:temperatures[0]};
}
