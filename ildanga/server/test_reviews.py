import unittest
from unittest.mock import patch
from reviews_service import normalize_reviews,validate_summary,ReviewError,summary,find_places
class Tests(unittest.TestCase):
 def test_normalize(self):
  d={'items':[{'review':{'id':'r1','entity_id':'123','text':'주차 공간이 좁았어요.'}},{'review':{'entity_id':'123','text':'주차 공간이 좁았어요.'}},{'review':{'entity_id':'456','text':'다른 매장'}}]}
  out=normalize_reviews(d,'123');self.assertEqual(len(out),1);self.assertNotIn('author',out[0])
 def test_grounding(self):
  reviews=[{'id':'a','text':'빵이 맛있었어요.'},{'id':'b','text':'빵이 맛있었어요.'}]
  self.assertEqual(len(validate_summary({'sentences':[{'kind':'feature','text':'맛에 만족한 후기가 있어요.','evidence':[{'id':'a','quote':'빵이 맛있었어요'},{'id':'b','quote':'빵이 맛있었어요'}]}]},reviews)),1)
  with self.assertRaises(ReviewError):validate_summary({'sentences':[{'text':'주차 무료','evidence':[{'id':'missing','quote':'주차 무료'}]}]},reviews)
 def test_empty_no_ai(self):
  with patch('reviews_service.provider',return_value={'items':[]}),patch('reviews_service.read_json') as read:
   self.assertEqual(summary({'id':['123']})['count'],0);read.assert_not_called()
 def test_local_ai_failure(self):
  with patch('reviews_service.provider',return_value={'items':[{'review':{'entity_id':'123','id':'a','text':'빵이 맛있었어요.'}}]}),patch('reviews_service.read_json',side_effect=OSError()):
   d=summary({'id':['123']});self.assertEqual(d['count'],1);self.assertEqual(d['sentences'],[]);self.assertIn('실패',d['notice'])
class JobTests(unittest.TestCase):
 def test_job_deduplicates_and_hides_raw(self):
  import reviews_service as m,time
  m._JOBS.clear()
  with patch.object(m,'summary',return_value={'sentences':[{'text':'요약','evidence':[{'quote':'원문'}]}],'reviews':[{'text':'원문'}]}) as call:
   m.summary_job({'id':['999']})
   for _ in range(100):
    d=m.summary_job({'id':['999']})
    if d['status']=='ready':break
    time.sleep(.005)
   self.assertEqual(d['status'],'ready');self.assertEqual(call.call_count,1)
   self.assertNotIn('reviews',d['result']);self.assertNotIn('evidence',d['result']['sentences'][0])
if __name__=='__main__':unittest.main()
