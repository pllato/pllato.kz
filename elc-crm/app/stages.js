// Pllato CRM — стадии активной воронки (proxy через pipelines.js).

import {
  ensurePipelinesInitialized,
  getActivePipelineId,
  getStagesForPipeline,
  saveStagesForPipeline,
  newStageIdForPipeline,
} from "./pipelines.js";

const DEFAULT_STAGES = [
  { id: "new",       title: "Новые",           color: "#8896b3" },
  { id: "qualified", title: "Квалифицированы", color: "#3b82f6" },
  { id: "proposal",  title: "Предложение",     color: "#a855f7" },
  { id: "won",       title: "Выигрыш",         color: "#22c55e" },
  { id: "lost",      title: "Проигрыш",        color: "#5d6b85" },
];

export function getStages(pipelineId) {
  ensurePipelinesInitialized();
  const pid = pipelineId || getActivePipelineId();
  if (!pid) return DEFAULT_STAGES.slice();
  const stages = getStagesForPipeline(pid);
  return stages.length ? stages : DEFAULT_STAGES.slice();
}

export function saveStages(stages, pipelineId) {
  ensurePipelinesInitialized();
  const pid = pipelineId || getActivePipelineId();
  if (pid) saveStagesForPipeline(pid, stages);
}

export function newStageId() {
  return newStageIdForPipeline();
}

export function findStage(id, pipelineId) {
  return getStages(pipelineId).find((s) => s.id === id) || null;
}

export const STAGE_COLORS = [
  "#8896b3", "#3b82f6", "#a855f7", "#22c55e", "#5d6b85",
  "#b8895a", "#ef4444", "#f59e0b", "#06b6d4", "#ec4899",
];
