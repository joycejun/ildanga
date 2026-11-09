# v2.6
- Java source compilation with ECJ and Android API classpath: PASS (BuildConfig stub for this compile check only; Gradle generates the real class).
- DOM tests: route operations, stored routes, no comment UI/function, community post/like, search/filter, backup, official hours, KST regular closure label, live-result replacement and persisted provider place, API errors, URL protocol validation, map success/failure: PASS.
- Python unittest: Kakao request fields/headers, normalized response, missing hours/reviews kept null, invalid coordinates/provider ids rejected: PASS (mock provider response).
- Bundled images and Asta Sans licensed font: present.
- No real Kakao key, authenticated provider call, full APK build or Pleos device execution performed.
- Browser render unavailable (Chromium socket permission denied). Layout is code-adjusted to user's screenshot, not visually verified on device.
- Public Python server deployment is not included: loopback-only development proxy, release needs authenticated HTTPS service.

- v2.6 builder phrase, manual region/place selection (2+ stops), resulting route and detail scroll/actions DOM structure: PASS.
- Auto setup script Python syntax: PASS. Windows SDK/device discovery, interactive key validation, adb reverse and server runtime are not executed on the user PC.
