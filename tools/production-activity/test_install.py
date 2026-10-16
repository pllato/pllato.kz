import importlib.util,pathlib,tempfile,unittest
spec=importlib.util.spec_from_file_location('installer',pathlib.Path(__file__).with_name('install.py'));installer=importlib.util.module_from_spec(spec);spec.loader.exec_module(installer)
class InstallTests(unittest.TestCase):
 def test_identity_and_retry(self):
  with tempfile.TemporaryDirectory() as d:
   a=pathlib.Path(d)/'a';b=pathlib.Path(d)/'b'
   ca,_=installer.prepare(a,'claude','Mac A');again,_=installer.prepare(a,'claude','Mac A');cb,_=installer.prepare(b,'claude','Mac B');codex,_=installer.prepare(a,'codex','Mac A')
   self.assertEqual(ca,again);self.assertNotEqual(ca['device'],cb['device']);self.assertNotEqual(ca['token'],cb['token'])
   self.assertEqual(ca['machineId'],codex['machineId']);self.assertNotEqual(ca['device'],codex['device'])
if __name__=='__main__':unittest.main()
