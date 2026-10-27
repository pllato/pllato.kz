"""Run with python3 elc-worker/test-wa-history-push.py (stdlib only)."""
import pathlib
import sqlite3
import unittest

ROOT = pathlib.Path(__file__).resolve().parent


class HistoryPushGuardTest(unittest.TestCase):
    def test_recovery_is_silent_but_live_events_are_preserved(self):
        db = sqlite3.connect(':memory:')
        db.execute('CREATE TABLE deals (id TEXT PRIMARY KEY, source_description TEXT)')
        db.executescript((ROOT / 'notifications-schema.sql').read_text())
        db.executemany('INSERT INTO deals VALUES (?, ?)', [
            ('history', 'WhatsApp · сообщение не синхронизировано'),
            ('live', 'WhatsApp'),
            ('site', 'Website'),
        ])
        migration = (ROOT / 'migrate-suppress-wa-history-push.sql').read_text()
        db.executescript(migration)
        db.executescript(migration)

        def insert(key, kind, entity):
            db.execute('''INSERT OR IGNORE INTO notifications
                (id, uid, type, title, entity_id, created_at)
                VALUES (?, 'user', ?, 'Test', ?, 1)''', (key, kind, entity))
            return db.execute('SELECT changes()').fetchone()[0]

        # Zero changes is the production sender's gate for all side effects.
        self.assertEqual(insert('recovered', 'pllato_start_new_lead', 'history'), 0)
        self.assertEqual(insert('live', 'pllato_start_new_lead', 'live'), 1)
        self.assertEqual(insert('site', 'pllato_start_new_lead', 'site'), 1)
        self.assertEqual(insert('message', 'wa_incoming', 'history'), 1)
        self.assertEqual(insert('task', 'task_assigned', None), 1)
        self.assertEqual(insert('live', 'pllato_start_new_lead', 'live'), 0)
        self.assertEqual(db.execute('SELECT count(*) FROM deals').fetchone()[0], 3)
        self.assertEqual(db.execute('SELECT count(*) FROM notifications').fetchone()[0], 4)


if __name__ == '__main__':
    unittest.main()
