import unittest,tempfile,pathlib,json
from collector import event,collect,HOUR
class CollectorTest(unittest.TestCase):
 def test_sources(self):
  r={'type':'response_item','timestamp':'2026-10-16T09:00:00Z','payload':{'type':'message','role':'user','id':'one','content':[{'type':'input_text','text':'hello'}],'internal_chat_message_metadata_passthrough':{'content_item_kinds':['user.text']}}}
  self.assertIsNotNone(event(r,'codex','s'))
  r['payload']['internal_chat_message_metadata_passthrough']['content_item_kinds']=['environments.environment_context']
  self.assertIsNone(event(r,'codex','s'))
  c={'type':'user','uuid':'u','timestamp':'2026-10-16T09:00:00Z','message':{'content':'hi'},'origin':{'kind':'human'}}
  self.assertIsNotNone(event(c,'claude','s'))
  c['message']['content']=[{'type':'tool_result','content':'ok'}];self.assertIsNone(event(c,'claude','s'))
 def test_dedup_and_missing(self):
  with tempfile.TemporaryDirectory() as temp:
   home=pathlib.Path(temp);state=home/'state.sqlite';now=1792144800000
   self.assertFalse(collect('claude',home,state,now)['available'])
   root=home/'.claude/projects/p';root.mkdir(parents=True)
   r={'type':'user','uuid':'u','timestamp':'2026-10-16T09:00:00Z','message':{'content':'hello'}}
   for name in ['a','b']:(root/(name+'.jsonl')).write_text(json.dumps(r)+'\n')
   a=collect('claude',home,state,now);b=collect('claude',home,state,now)
   self.assertEqual(a['buckets'],b['buckets']);self.assertEqual(sum(x['count'] for x in a['buckets']),1)
   self.assertNotIn('hello',json.dumps(a))
if __name__=='__main__':unittest.main()
