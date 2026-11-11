
import os
import re
import math
import json
import unicodedata
import urllib.request
import urllib.parse


BASE_URL = "https://places.googleapis.com/v1"


def api_headers(fields):
    key = os.environ.get("GOOGLE_PLACES_API_KEY", "").strip()

    if not key:
        raise RuntimeError("Google API key not configured")

    return {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": fields,
        "Content-Type": "application/json"
    }


def normalize_place_id(place_id):
    if not isinstance(place_id, str):
        raise ValueError("Invalid Place ID")

    place_id = place_id.strip().removeprefix("places/")
    # Google IDs are opaque and have no documented maximum length.
    if not re.fullmatch(r"[A-Za-z0-9_-]+", place_id):
        raise ValueError("Invalid Place ID")

    return place_id


def _review_summary(rs):
    """Google AI review summary (only returned for supported places/languages). Attribution fields are required when shown."""
    if not isinstance(rs, dict):
        return None
    text = (rs.get("text") or {}).get("text")
    if not text:
        return None
    return {
        "text": str(text)[:1000],
        "disclosure": (rs.get("disclosureText") or {}).get("text") or "Summarized with Gemini",
        "reviewsUri": rs.get("reviewsUri"),
        "flagContentUri": rs.get("flagContentUri")
    }


def _phone(v):
    v = str(v or "").strip()
    return v if re.fullmatch(r"[0-9+\-\s()]{6,24}", v) else None


def _hours(h):
    """공식 운영시간(Google Maps 등록 정보): 요일별 문장 목록 (월요일부터)."""
    if not isinstance(h, dict):
        return None
    days = [str(x)[:80] for x in (h.get("weekdayDescriptions") or []) if isinstance(x, str)][:7]
    return {"weekdayDescriptions": days} if days else None


def get_google_reviews(place_id):
    place_id = normalize_place_id(place_id)

    url = (
        BASE_URL + "/places/"
        + urllib.parse.quote(place_id, safe="")
        + "?languageCode=ko"
    )

    headers = api_headers(
        "displayName,rating,userRatingCount,"
        "reviews,googleMapsUri,attributions,"
        "reviewSummary,regularOpeningHours,"
        "nationalPhoneNumber,internationalPhoneNumber"
    )

    req = urllib.request.Request(url, headers=headers)

    with urllib.request.urlopen(req, timeout=15) as response:
        data = json.load(response)

    return {
        "provider": "Google Maps",
        "placeId": place_id,
        "name": data.get("displayName", {}).get("text"),
        "rating": data.get("rating"),
        "ratingCount": data.get("userRatingCount"),
        "reviews": data.get("reviews", [])[:5],
        "sourceUrl": data.get("googleMapsUri"),
        "attributions": data.get("attributions", []),
        "reviewSummary": _review_summary(data.get("reviewSummary")),
        "hours": _hours(data.get("regularOpeningHours")),
        "phone": _phone(data.get("nationalPhoneNumber")),
        "phoneIntl": _phone(data.get("internationalPhoneNumber"))
    }


def find_google_place(name, lat, lng):
    name = str(name).strip()
    lat = float(lat)
    lng = float(lng)

    if not 1 <= len(name) <= 100:
        raise ValueError("Invalid name")

    if not (
        math.isfinite(lat) and math.isfinite(lng)
        and -90 <= lat <= 90
        and -180 <= lng <= 180
    ):
        raise ValueError("Invalid coordinates")

    payload = {
        "textQuery": name,
        "languageCode": "ko",
        "pageSize": 10,
        "locationBias": {
            "circle": {
                "center": {
                    "latitude": lat,
                    "longitude": lng
                },
                "radius": 400.0
            }
        }
    }

    req = urllib.request.Request(
        BASE_URL + "/places:searchText",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers=api_headers(
            "places.id,places.displayName,places.location"
        ),
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=15) as response:
        data = json.load(response)

    def normalize(value):
        return re.sub(
            r"[^0-9a-z가-힣]",
            "",
            unicodedata.normalize("NFKC", str(value)).lower()
        )

    matches = {}

    for place in data.get("places", []):
        google_name = place.get("displayName", {}).get("text", "")
        location = place.get("location", {})

        if not normalize(name) or normalize(google_name) != normalize(name):
            continue

        if not all(k in location for k in ("latitude", "longitude")):
            continue

        try:
            g_lat = float(location["latitude"])
            g_lng = float(location["longitude"])
            place_id = normalize_place_id(place.get("id"))
        except (ValueError, TypeError):
            continue

        if not (math.isfinite(g_lat) and math.isfinite(g_lng)
                and -90 <= g_lat <= 90 and -180 <= g_lng <= 180):
            continue

        # 두 장소 사이 거리 계산: 미터
        d_lat = math.radians(g_lat - lat)
        d_lng = math.radians(g_lng - lng)

        a = (
            math.sin(d_lat / 2) ** 2
            + math.cos(math.radians(lat))
            * math.cos(math.radians(g_lat))
            * math.sin(d_lng / 2) ** 2
        )

        distance = 6371000 * 2 * math.asin(
            min(1, math.sqrt(a))
        )

        if distance <= 150:
            matches[place_id] = place

    # 여러 곳이 일치하거나 못 찾으면 자동 연결하지 않음
    if len(matches) != 1:
        return None

    return next(iter(matches))


if __name__ == "__main__":
    place_id = "ChIJXTU999hIZTURyl7JAtkw6Wk"

    result = get_google_reviews(place_id)

    print("매장:", result["name"])
    print("평점:", result["rating"])
    print("전체 평점 수:", result["ratingCount"])
    print("받아온 후기:", len(result["reviews"]))
    print("GOOGLE REVIEWS TEST OK")
