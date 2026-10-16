// Keep message history; membership is revoked for inactive identities and their aliases.
const inactiveIds = `SELECT alias.uid FROM users inactive JOIN users alias
 ON alias.uid=inactive.uid OR (TRIM(COALESCE(inactive.email,''))<>'' AND LOWER(TRIM(alias.email))=LOWER(TRIM(inactive.email)))
 WHERE inactive.active=0`;
export const CHAT_MEMBERSHIP_GUARDS = [
 `CREATE TRIGGER IF NOT EXISTS team_chat_deactivated_user AFTER UPDATE OF active ON users WHEN NEW.active=0 BEGIN
 DELETE FROM team_chat_members WHERE user_id IN (SELECT uid FROM users WHERE uid=NEW.uid OR (TRIM(COALESCE(NEW.email,''))<>'' AND LOWER(TRIM(email))=LOWER(TRIM(NEW.email)))); END`,
 `CREATE TRIGGER IF NOT EXISTS team_chat_no_inactive_insert BEFORE INSERT ON team_chat_members
 WHEN NEW.user_id IN (${inactiveIds}) BEGIN SELECT RAISE(ABORT,'inactive employee cannot join chats'); END`,
 `CREATE TRIGGER IF NOT EXISTS team_chat_no_inactive_update BEFORE UPDATE OF user_id ON team_chat_members
 WHEN NEW.user_id IN (${inactiveIds}) BEGIN SELECT RAISE(ABORT,'inactive employee cannot join chats'); END`,
 `DELETE FROM team_chat_members WHERE user_id IN (${inactiveIds})`,
];
let ready;
export function ensureActiveChatMemberships(env){
 if(!ready)ready=env.DB.batch(CHAT_MEMBERSHIP_GUARDS.map(sql=>env.DB.prepare(sql))).catch(error=>{ready=null;throw error;});
 return ready;
}
export async function isInactiveChatUser(env,uid){
 return !!await env.DB.prepare(`SELECT 1 FROM users WHERE uid=? AND uid IN (${inactiveIds})`).bind(uid).first();
}
