import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {guideSteps} from '../app/stroy/dwg/onboarding-steps.mjs';
test('onboarding covers full workflow with unique stable IDs and local screenshots',()=>{
 assert.equal(new Set(guideSteps.map(s=>s.id)).size,guideSteps.length);
 for(const id of ['open','units','create','sheet','select','assign','draw','edit','cut','device','leader','ledger','history','export'])assert.ok(guideSteps.some(s=>s.id===id));
 for(const step of guideSteps){assert.ok(step.target&&step.action&&step.intro&&step.result);assert.ok(step.steps.length>=2);assert.match(step.image,/^[a-z]+$/);const image=readFileSync(new URL(`../app/stroy/dwg/guide-assets/${step.image}.jpg`,import.meta.url));assert.equal(image[0],255);assert.equal(image[1],216);assert.ok(image.length<400000);}
});
