import unittest, tempfile, pathlib, sqlite3
from claude_cloud import sync, pages
from collector import event, timestamp, collect

class CloudTests(unittest.TestCase):
 def test_history_dedup_filters_pagination_and_cache(self):
  with tempfile.TemporaryDirectory() as t:
   state=pathlib.Path(t)/'state.sqlite';at='2026-11-04T10:00:00Z';since=timestamp('2026-10-28T00:00:00Z');now=timestamp(at)+1000
   human={'type':'user','uuid':'same-local-id','timestamp':at,'message':{'content':'private prompt'}}
   rows=[{'event_type':'user','payload':human},{'event_type':'user','payload':{**human,'uuid':'tool','message':{'content':[{'type':'tool_result'}]}}},{'event_type':'user','is_compaction':True,'payload':{**human,'uuid':'summary'}},{'event_type':'user','payload':{**human,'uuid':'agent','isSidechain':True}}]
   calls=[]
   def get(path):
    calls.append(path)
    if '/teleport-events' in path:
     return {'data':rows} if 'cursor=' in path else {'data':rows,'next_cursor':'page2'}
    return {'data':[{'id':'s','environment_kind':'anthropic_cloud','last_event_at':at}]}
   self.assertEqual(sync(state,since,now,event,timestamp,get),1)
   self.assertEqual(sync(state,since,now,event,timestamp,get),0)
   self.assertEqual(len(calls),4)
   root=pathlib.Path(t)/'.claude/projects/p';root.mkdir(parents=True)
   import json
   (root/'s.jsonl').write_text(json.dumps(human))
   body=collect('claude',pathlib.Path(t),state,now)
   self.assertEqual(sum(b['count'] for b in body['buckets']),1)
   self.assertNotIn('private prompt',state.read_bytes().decode(errors='ignore'))
 def test_partial_fetch_not_marked_complete(self):
  with tempfile.TemporaryDirectory() as t:
   state=pathlib.Path(t)/'state.sqlite'
   def get(path):
    if '/teleport-events' in path:raise RuntimeError('offline')
    return {'data':[{'id':'s','environment_kind':'anthropic_cloud','last_event_at':'2026-11-04T10:00:00Z'}]}
   with self.assertRaises(RuntimeError):sync(state,1,9999999999999,event,timestamp,get)
   with sqlite3.connect(state) as db:self.assertEqual(db.execute('select count(*) from cloud_sessions').fetchone()[0],0)
 def test_list_change_stream_token_is_not_pagination(self):
  self.assertEqual(list(pages(lambda _: {'data':[1],'resume_token':'changes'},'/v1/code/sessions','cursor')),[[1]])
 def test_repeated_cursor_fails(self):
  with self.assertRaises(RuntimeError):list(pages(lambda _: {'data':[],'next_cursor':'same'},'/v1/code/sessions','cursor'))

if __name__=='__main__':unittest.main()
