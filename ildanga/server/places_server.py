
"""
Ildanga Local Place API Server

기능
1. Kakao 장소 검색
2. 기존 SocialCrawl 리뷰 및 AI 요약
3. Google Places 리뷰 조회
4. 매장 이름 + 좌표로 Google Place ID 자동 검색

개발 서버:
http://127.0.0.1:8765

API 키는 환경변수로 관리합니다.
"""

import json
import math
import os
import urllib.parse
import urllib.request
import urllib.error

from http.server import (
    BaseHTTPRequestHandler,
    ThreadingHTTPServer,
)


HOST = "127.0.0.1"
PORT = 8765


# =====================================
# 1. Kakao 장소 데이터 변환
# =====================================

def normalize_place(p):

    pid = str(p.get("id", ""))

    if not pid.isdigit():
        raise ValueError("Invalid provider place id")

    lat = float(p["y"])
    lng = float(p["x"])

    if not (
        math.isfinite(lat)
        and math.isfinite(lng)
        and -90 <= lat <= 90
        and -180 <= lng <= 180
    ):
        raise ValueError("Invalid coordinates")

    return {
        "id": "kakao" + pid,
        "name": str(p["place_name"])[:200],
        "lat": lat,
        "lng": lng,
        "address": str(
            p.get("road_address_name")
            or p.get("address_name", "")
        )[:300],
        "phone": str(p.get("phone", ""))[:40],
        "category": str(
            p.get("category_name", "")
        )[:200],
        "distanceMeters": float(
            p.get("distance") or 0
        ),
        "placeUrl": "https://place.map.kakao.com/" + pid,
        "provider": "Kakao",
        "hours": None,
        "reviews": None,
    }


# =====================================
# 2. Kakao 장소 검색
# =====================================

def search_places(
    params,
    key,
    opener=urllib.request.urlopen
):

    query = params.get("query", [""])[0].strip()
    lat = float(params.get("lat", ["0"])[0])
    lng = float(params.get("lng", ["0"])[0])
    radius = int(params.get("radius", ["5000"])[0])

    valid = (
        bool(query)
        and len(query) <= 80
        and math.isfinite(lat)
        and math.isfinite(lng)
        and -90 <= lat <= 90
        and -180 <= lng <= 180
        and 100 <= radius <= 5000
    )

    if not valid:
        raise ValueError("Invalid search parameters")

    qs = urllib.parse.urlencode({
        "query": query,
        "y": lat,
        "x": lng,
        "radius": radius,
        "sort": "distance",
        "size": 15,
    })

    url = (
        "https://dapi.kakao.com/"
        "v2/local/search/keyword.json?"
        + qs
    )

    req = urllib.request.Request(
        url,
        headers={
            "Authorization": "KakaoAK " + key,
            "Accept": "application/json",
        },
    )

    with opener(req, timeout=10) as response:
        payload = json.load(response)

    results = []

    for p in payload.get("documents", []):
        try:
            results.append(normalize_place(p))
        except (
            ValueError,
            KeyError,
            TypeError,
        ):
            continue

    return {
        "provider": "Kakao",
        "places": results,
        "more": not payload.get(
            "meta", {}
        ).get("is_end", True),
        "note": (
            "거리순 검색입니다. "
            "인기 순위를 의미하지 않습니다. "
            "영업시간과 후기는 카카오 장소 검색 "
            "API에 포함되지 않습니다."
        ),
    }


# =====================================
# 3. HTTP API 서버
# =====================================

class Handler(BaseHTTPRequestHandler):

    def log_message(self, *args):
        # API 키와 위치 정보 로그 방지
        pass

    def send_json(self, code, data):

        body = json.dumps(
            data,
            ensure_ascii=False
        ).encode("utf-8")

        self.send_response(code)

        self.send_header(
            "Content-Type",
            "application/json; charset=utf-8"
        )

        self.send_header(
            "Cache-Control",
            "no-store"
        )

        self.send_header(
            "Content-Length",
            str(len(body))
        )

        self.end_headers()
        self.wfile.write(body)

    # =================================
    # GET 요청 처리
    # =================================

    def do_GET(self):

        u = urllib.parse.urlsplit(self.path)
        path = u.path

        params = urllib.parse.parse_qs(u.query)

        kakao_key = os.environ.get(
            "KAKAO_REST_API_KEY", ""
        ).strip()

        # -----------------------------
        # 서버 상태 확인
        # -----------------------------

        if path == "/api/health":

            google_key = os.environ.get(
                "GOOGLE_PLACES_API_KEY", ""
            ).strip()

            return self.send_json(200, {
                "connected": True,
                "searchConfigured": bool(kakao_key),
                "provider": "Kakao",
                "googleReviewsConfigured": bool(
                    google_key
                ),
                "googleReviewsVersion": 1,
            })

        # -----------------------------
        # 기존 네이버 리뷰 기능
        # -----------------------------

        if path in (
            "/api/reviews/places",
            "/api/reviews/summary",
        ):

            try:
                from reviews_service import (
                    find_places,
                    summary_job,
                    ReviewError,
                )

                if path.endswith("/places"):
                    result = find_places(params)
                else:
                    result = summary_job(params)

                return self.send_json(200, result)

            except ReviewError as e:

                return self.send_json(503, {
                    "error": str(e)
                })

            except Exception:

                return self.send_json(502, {
                    "error": (
                        "후기 처리 중 오류가 발생했어요."
                    )
                })

        # -----------------------------
        # Google 리뷰 조회
        # -----------------------------

        if path == "/api/google/reviews":

            try:
                from google_reviews import (
                    get_google_reviews,
                    find_google_place,
                    normalize_place_id,
                )

                place_id = params.get(
                    "placeId", [""]
                )[0].strip()

                # Place ID가 없으면 이름과 좌표 검색
                if not place_id:

                    name = params.get(
                        "name", [""]
                    )[0].strip()

                    lat = params.get(
                        "lat", [""]
                    )[0]

                    lng = params.get(
                        "lng", [""]
                    )[0]

                    place_id = find_google_place(
                        name,
                        lat,
                        lng
                    )

                    if not place_id:
                        return self.send_json(404, {
                            "error": (
                                "일치하는 구글 매장을 "
                                "찾지 못했어요."
                            )
                        })

                # Place ID 검증
                try:
                    place_id = normalize_place_id(place_id)
                except ValueError:
                    return self.send_json(400, {
                        "error": (
                            "올바르지 않은 Place ID입니다."
                        )
                    })

                # 실제 Google 리뷰 조회
                result = get_google_reviews(
                    place_id
                )

                return self.send_json(200, result)

            except (ValueError, TypeError):

                return self.send_json(400, {
                    "error": (
                        "매장 이름과 좌표를 "
                        "확인해 주세요."
                    )
                })

            except RuntimeError:

                return self.send_json(503, {
                    "error": (
                        "Google API 키를 "
                        "확인해 주세요."
                    )
                })

            except urllib.error.HTTPError as e:

                e.close()
                return self.send_json(502, {
                    "error": (
                        "Google API 오류: "
                        f"HTTP {e.code}"
                    )
                })

            except Exception:

                return self.send_json(502, {
                    "error": (
                        "구글 후기 조회에 실패했습니다."
                    )
                })

        # -----------------------------
        # Kakao 장소 검색
        # -----------------------------

        if path != "/api/places/search":

            return self.send_json(404, {
                "error": "지원하지 않는 요청입니다."
            })

        if not kakao_key:

            return self.send_json(503, {
                "error": (
                    "서버에 KAKAO_REST_API_KEY를 "
                    "설정해 주세요."
                )
            })

        try:

            result = search_places(
                params,
                kakao_key
            )

            return self.send_json(200, result)

        except (ValueError, TypeError):

            return self.send_json(400, {
                "error": (
                    "검색어, 좌표, 반경을 "
                    "확인해 주세요."
                )
            })

        except urllib.error.HTTPError as e:

            if e.code in (401, 403):
                msg = (
                    "카카오 API 키와 "
                    "사용 권한을 확인해 주세요."
                )
            else:
                msg = (
                    "장소 제공사 오류 또는 "
                    "사용량 제한입니다."
                )

            return self.send_json(502, {
                "error": msg
            })

        except Exception:

            return self.send_json(502, {
                "error": (
                    "장소 검색 연결이 실패했어요. "
                    "인터넷을 확인해 주세요."
                )
            })


# =====================================
# 4. 서버 시작
# =====================================

if __name__ == "__main__":

    print("=" * 45)
    print("ILDANGA PLACE API SERVER")
    print("=" * 45)
    print(f"Server: http://{HOST}:{PORT}")
    print("Kakao Places: Supported")
    print("Google Reviews: Supported")
    print("Legacy Reviews: Supported")
    print("Ctrl+C to stop")
    print("=" * 45)

    server = ThreadingHTTPServer(
        (HOST, PORT),
        Handler
    )

    server.serve_forever()
