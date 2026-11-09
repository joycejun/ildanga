import io, json, unittest, urllib.error
from places_server import search_places,normalize_place
class PlacesTests(unittest.TestCase):
 def test_provider_request_and_fields(self):
  def opener(req,timeout):
   self.assertEqual(req.headers['Authorization'],'KakaoAK test-only')
   self.assertIn('radius=5000',req.full_url);self.assertIn('sort=distance',req.full_url)
   return io.BytesIO(json.dumps({'documents':[{'id':'123','place_name':'실제 API 형식 테스트','x':'127.42','y':'36.32','distance':'250','phone':'042-000-0000','road_address_name':'주소'}],'meta':{'is_end':True}}).encode())
  r=search_places({'query':['빵집'],'lat':['36.3277'],'lng':['127.4273']},'test-only',opener)
  p=r['places'][0];self.assertEqual(p['id'],'kakao123');self.assertEqual(p['distanceMeters'],250)
  self.assertIsNone(p['hours']);self.assertIsNone(p['reviews']);self.assertEqual(p['placeUrl'],'https://place.map.kakao.com/123')
 def test_invalid_input(self):
  for lat in ['nan','inf','1000']:
   with self.assertRaises(ValueError):search_places({'query':['빵집'],'lat':[lat],'lng':['127']},'x')
 def test_invalid_id(self):
  with self.assertRaises(ValueError):normalize_place({'id':'<script>','x':'127','y':'36'})
if __name__=='__main__':unittest.main()
