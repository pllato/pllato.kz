import test from 'node:test';import assert from 'node:assert/strict';import {scheduleValue,compareTaskSchedule,taskScheduleLabel} from '../app/task-schedule.js';
test('schedule uses Almaty on every device and sorts undated tasks last',()=>{
 assert.equal(scheduleValue('2026-11-26','15:30'),Date.parse('2026-11-26T10:30Z'));
 const tasks=[{id:'none'},{id:'late',dueDate:'2026-11-27'},{id:'early',dueDate:'2026-11-26',dueTime:'18:00'}];assert.deepEqual(tasks.sort(compareTaskSchedule).map(t=>t.id),['early','late','none']);assert.match(taskScheduleLabel(tasks[0]),/26.11.*18:00/);
 for(const date of ['2026-02-30','bad'])assert.throws(()=>scheduleValue(date));
});
