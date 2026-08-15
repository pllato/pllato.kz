import assert from 'node:assert/strict';
import { canChangeAnyDealStage } from './stage-permissions.js';

const maya = {
  orgPerms: {
    dealScope: 'all',
    pipelineIds: ['pipeline_yxs0it', 'pipeline_imp_elc'],
  },
};

assert.equal(canChangeAnyDealStage(maya, 'pipeline_yxs0it'), true,
  'dealScope=all can move an unassigned deal inside an allowed pipeline');
assert.equal(canChangeAnyDealStage(maya, 'pipeline_r22lrm'), false,
  'pipeline ACL must remain a hard limit');
assert.equal(canChangeAnyDealStage({ orgPerms: { dealScope: 'own', pipelineIds: null } }, 'pipeline_yxs0it'), false,
  'own scope must not gain access to unassigned deals');
assert.equal(canChangeAnyDealStage({ orgPerms: { dealScope: 'all', pipelineIds: null } }, 'any-pipeline'), true,
  'null pipelineIds means all pipelines');

console.log('stage permission tests: ok');
