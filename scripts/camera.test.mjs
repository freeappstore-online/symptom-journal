import {test} from 'node:test';
import assert from 'node:assert/strict';
import {stopCameraStream,connectCamera} from '../web/src/camera.ts';
test('closing camera releases every track; absent streams are harmless',()=>{
 let stopped=0;stopCameraStream({getTracks:()=>[{stop:()=>stopped++},{stop:()=>stopped++}]});assert.equal(stopped,2);assert.doesNotThrow(()=>stopCameraStream(null));
});

test('camera requests resolving after closure release tracks without showing a preview',async()=>{
 let resolve,stopped=0,shown=0;
 const request=new Promise(r=>resolve=r);
 const close=connectCamera(()=>request,()=>shown++,()=>assert.fail('unexpected error'));
 close();resolve({getTracks:()=>[{stop:()=>stopped++}]});await Promise.resolve();await Promise.resolve();
 assert.equal(stopped,1);assert.equal(shown,0);
});
test('active camera streams are released on close and permission errors are surfaced',async()=>{
 let stopped=0,error;
 const close=connectCamera(()=>Promise.resolve({getTracks:()=>[{stop:()=>stopped++}]}),()=>{},()=>{});
 await Promise.resolve();close();assert.equal(stopped,1);
 connectCamera(()=>Promise.reject(Error('denied')),()=>assert.fail(),e=>error=e);
 await Promise.resolve();await Promise.resolve();assert.equal(error.message,'denied');
});
