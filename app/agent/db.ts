import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.resolve(process.cwd(), 'chat_history.db')
const db = new Database(dbPath)

export type SessionType = 'normal' | 'testcase'

export interface Session {
  id: string
  name: string
  type: SessionType
  created_at: string
}

export function initSessionTable() {
  db.prepare(
    `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT DEFAULT 'normal',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`
  ).run()

  try {
    db.prepare(`ALTER TABLE sessions ADD COLUMN type TEXT DEFAULT 'normal'`).run()
  } catch {}
}

export function createSession(id: string, name: string, type: SessionType = 'normal') {
  db.prepare('INSERT INTO sessions (id, name, type) VALUES (?, ?, ?)').run(id, name, type)
}

export function getAllSessions(): Session[] {
  return db.prepare('SELECT id, name, type, created_at FROM sessions ORDER BY created_at DESC').all() as Session[]
}

export function getSessionsByType(type: SessionType): Session[] {
  return db.prepare('SELECT id, name, type, created_at FROM sessions WHERE type = ? ORDER BY created_at DESC').all(type) as Session[]
}

export function getSession(id: string): Session | undefined {
  return db.prepare('SELECT id, name, type, created_at FROM sessions WHERE id = ?').get(id) as Session | undefined
}

export function updateSessionName(id: string, name: string) {
  db.prepare('UPDATE sessions SET name = ? WHERE id = ?').run(name, id)
}

export function updateSessionType(id: string, type: SessionType) {
  db.prepare('UPDATE sessions SET type = ? WHERE id = ?').run(type, id)
}

export function deleteSession(id: string) {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(id)
}

export default db
