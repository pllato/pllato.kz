import importlib.util
import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('queue',Path(__file__).with_name('recording-queue.py'))
queue=importlib.util.module_from_spec(spec)
spec.loader.exec_module(queue)

class RecordingQueueTest(unittest.TestCase):
    def test_failure_keeps_audio_and_metadata_then_success_removes(self):
        with tempfile.TemporaryDirectory() as temp:
            queue.ROOT=Path(temp)
            audio=queue.ROOT/'123.4.wav'
            audio.write_bytes(b'RIFF'+b'0'*100)
            queue.enqueue([str(audio),'996553940000','out','1700000000','60','123.4','https://pllato-elc-worker.uurraa.workers.dev/api/sip/recording?secret=test'])
            job=audio.with_suffix('.upload.json')
            with patch.object(queue.urllib.request,'urlopen',side_effect=OSError('offline')):
                queue.flush()
            self.assertTrue(job.exists());self.assertTrue(audio.exists())
            with patch.object(queue.urllib.request,'urlopen',return_value=io.BytesIO(b'{"ok":true}')) as send:
                queue.flush()
                self.assertIn('callKey=123.4',send.call_args.args[0].full_url)
            self.assertFalse(job.exists());self.assertFalse(audio.exists())
    def test_untrusted_path_rejected(self):
        with self.assertRaises(ValueError):
            queue.enqueue(['/etc/passwd','996553940000','out','1700000000','60','123.4','https://example.org'])

if __name__=='__main__':unittest.main()
