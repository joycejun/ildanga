"""Google matching and HTTP contract tests; provider calls are mocked."""
import io
import json
import os
import threading
import unittest
import urllib.error
import urllib.parse
import urllib.request
from http.server import ThreadingHTTPServer
from unittest.mock import patch

import google_reviews as google
from places_server import Handler


PLACE_ID = "ChIJXTU999hIZTURyl7JAtkw6Wk"


def response(data):
    return io.BytesIO(json.dumps(data).encode("utf-8"))


def candidate(name="성심당 본점", lat=36.3277, lng=127.4273, pid=PLACE_ID):
    return {"id": pid, "displayName": {"text": name},
            "location": {"latitude": lat, "longitude": lng}}


class GoogleTests(unittest.TestCase):
    def test_place_ids_and_resource_names(self):
        self.assertEqual(google.normalize_place_id(" places/" + PLACE_ID + " "), PLACE_ID)
        self.assertEqual(google.normalize_place_id("A" * 300), "A" * 300)
        for value in (None, "", "places/", "../places/x", "id?key=x", "한글"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                google.normalize_place_id(value)

    @patch.dict(os.environ, {"GOOGLE_PLACES_API_KEY": "test-only"})
    def test_details_fields_attribution_and_five_review_limit(self):
        raw = {"displayName": {"text": "성심당 본점"}, "rating": 4.5,
               "userRatingCount": 13033, "reviews": [{"rating": 5}] * 6,
               "googleMapsUri": "https://maps.google.com/?cid=1",
               "attributions": [{"provider": "Example", "providerUri": "https://example.com"}]}
        with patch.object(google.urllib.request, "urlopen", return_value=response(raw)) as call:
            result = google.get_google_reviews("places/" + PLACE_ID)
        req = call.call_args.args[0]
        self.assertIn("/places/" + PLACE_ID + "?languageCode=ko", req.full_url)
        self.assertNotIn("test-only", req.full_url)
        self.assertIn("attributions", req.get_header("X-goog-fieldmask"))
        self.assertEqual(result["placeId"], PLACE_ID)
        self.assertEqual(result["ratingCount"], 13033)
        self.assertEqual(len(result["reviews"]), 5)
        self.assertEqual(result["attributions"], raw["attributions"])

    @patch.dict(os.environ, {"GOOGLE_PLACES_API_KEY": "test-only"})
    def test_auto_matching_uses_name_and_location(self):
        with patch.object(google.urllib.request, "urlopen", return_value=response({"places": [candidate("성심당본점")]})) as call:
            self.assertEqual(google.find_google_place("성심당 본점", 36.3277, 127.4273), PLACE_ID)
        req = call.call_args.args[0]
        payload = json.loads(req.data)
        self.assertEqual(payload["textQuery"], "성심당 본점")
        self.assertEqual(payload["locationBias"]["circle"]["center"],
                         {"latitude": 36.3277, "longitude": 127.4273})
        self.assertIn("places.id", req.get_header("X-goog-fieldmask"))

    @patch.dict(os.environ, {"GOOGLE_PLACES_API_KEY": "test-only"})
    def test_wrong_branch_distant_and_ambiguous_places_are_rejected(self):
        for candidates in ([candidate("성심당 대전역점")], [candidate(lat=37.0)],
                           [candidate(), candidate(pid="ChIJAnotherPlace123")], []):
            with self.subTest(candidates=candidates), patch.object(google.urllib.request, "urlopen", return_value=response({"places": candidates})):
                self.assertIsNone(google.find_google_place("성심당 본점", 36.3277, 127.4273))

    @patch.dict(os.environ, {"GOOGLE_PLACES_API_KEY": "test-only"})
    def test_other_store_unicode_and_duplicate_ids(self):
        places = [candidate("ABC 카페", pid="OtherStorePlace123")] * 2
        with patch.object(google.urllib.request, "urlopen", return_value=response({"places": places})):
            self.assertEqual(google.find_google_place("ＡＢＣ 카페", 36.3277, 127.4273), "OtherStorePlace123")

    @patch.dict(os.environ, {"GOOGLE_PLACES_API_KEY": "test-only"})
    def test_invalid_candidates_are_skipped(self):
        places = [candidate(lat=float("nan")), candidate(pid=None), candidate(lat="bad"), candidate()]
        with patch.object(google.urllib.request, "urlopen", return_value=response({"places": places})):
            self.assertEqual(google.find_google_place("성심당 본점", 36.3277, 127.4273), PLACE_ID)

    def test_invalid_search_does_not_call_google(self):
        for name, lat, lng in (("", 36, 127), ("매장", "nan", 127), ("매장", 91, 127), ("매장", 36, 181)):
            with self.subTest(name=name, lat=lat), patch.object(google.urllib.request, "urlopen") as call:
                with self.assertRaises(ValueError):
                    google.find_google_place(name, lat, lng)
                call.assert_not_called()

    @patch.dict(os.environ, {"GOOGLE_PLACES_API_KEY": ""})
    def test_missing_key_does_not_call_google(self):
        with patch.object(google.urllib.request, "urlopen") as call:
            with self.assertRaises(RuntimeError):
                google.get_google_reviews(PLACE_ID)
            call.assert_not_called()


class GoogleHttpTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = "http://127.0.0.1:" + str(cls.server.server_port)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def request(self, path, **params):
        try:
            with urllib.request.urlopen(self.base + path + "?" + urllib.parse.urlencode(params), timeout=5) as r:
                return r.status, json.load(r)
        except urllib.error.HTTPError as e:
            with e:
                return e.code, json.load(e)

    @patch.dict(os.environ, {"GOOGLE_PLACES_API_KEY": "test-only"})
    def test_health_identifies_latest_google_server_without_key(self):
        code, data = self.request("/api/health")
        self.assertEqual(code, 200)
        self.assertTrue(data["googleReviewsConfigured"])
        self.assertEqual(data["googleReviewsVersion"], 1)
        self.assertNotIn("test-only", json.dumps(data))

    def test_name_coordinates_resolve_before_id_validation(self):
        with patch.object(google, "find_google_place", return_value=PLACE_ID) as find, patch.object(google, "get_google_reviews", return_value={"provider": "Google Maps", "reviews": []}) as details:
            code, data = self.request("/api/google/reviews", name="성심당 본점", lat="36.3277", lng="127.4273")
        self.assertEqual(code, 200)
        find.assert_called_once_with("성심당 본점", "36.3277", "127.4273")
        details.assert_called_once_with(PLACE_ID)
        self.assertEqual(data["provider"], "Google Maps")

    def test_explicit_id_skips_search_and_normalizes_resource(self):
        with patch.object(google, "find_google_place") as find, patch.object(google, "get_google_reviews", return_value={"reviews": []}) as details:
            self.assertEqual(self.request("/api/google/reviews", placeId="places/" + PLACE_ID)[0], 200)
        find.assert_not_called()
        details.assert_called_once_with(PLACE_ID)

    def test_no_match_does_not_fetch_another_store(self):
        with patch.object(google, "find_google_place", return_value=None), patch.object(google, "get_google_reviews") as details:
            self.assertEqual(self.request("/api/google/reviews", name="매장", lat=36, lng=127)[0], 404)
        details.assert_not_called()

    def test_invalid_id_does_not_fetch(self):
        with patch.object(google, "get_google_reviews") as details:
            self.assertEqual(self.request("/api/google/reviews", placeId="../bad")[0], 400)
        details.assert_not_called()

    @patch.dict(os.environ, {"GOOGLE_PLACES_API_KEY": ""})
    def test_missing_key_returns_503(self):
        self.assertEqual(self.request("/api/google/reviews", placeId=PLACE_ID)[0], 503)

    def test_upstream_error_does_not_leak_provider_response(self):
        error = urllib.error.HTTPError("https://places.googleapis.com", 403, "secret-provider-message", {}, None)
        with patch.object(google, "get_google_reviews", side_effect=error):
            code, data = self.request("/api/google/reviews", placeId=PLACE_ID)
        self.assertEqual(code, 502)
        self.assertNotIn("secret-provider-message", json.dumps(data))


if __name__ == "__main__":
    unittest.main()
