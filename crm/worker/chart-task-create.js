// Atomic create-only write: retries must not reset completed, moved or deleted tasks.
export async function insertChartTaskIfAbsent(db, teamId, item) {
  await db.prepare(`INSERT INTO store (team_id, collection, id, data, created_at, updated_at)
    VALUES (?, 'chart_week_tasks', ?, ?, ?, ?)
    ON CONFLICT(team_id, collection, id) DO NOTHING`)
    .bind(teamId,item.id,JSON.stringify(item),item.createdAt,Date.now()).run();
}
