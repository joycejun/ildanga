from pathlib import Path
import re,sys,shutil
root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
main=root/'app/src/main/java/com/example/dateapp/MainActivity.java'
smart=root/'server/smart_routes.py'
if not main.exists() or not smart.exists():raise SystemExit('현재 일단가 프로젝트 폴더에서 실행하세요. (MainActivity.java 또는 smart_routes.py 없음)')
source=main.read_text(encoding='utf-8')
needle='''    String[] positions={"FIRST","SECOND","THIRD","FOURTH","FIFTH"};'''
if needle not in source and 'WaypointIndex.valueOf(positions[i])' not in source:
    if 'availableWaypointIndices' in source: print('이미 내비 enum 수정이 적용되어 있어요.')
    else:raise SystemExit('예상 내비 코드와 달라 중단했습니다. MainActivity.java는 변경하지 않았어요.')
else:
    # Only use waypoint index enum constants actually present in the installed SDK.
    replacement='''    java.util.List<WaypointIndex> availableWaypointIndices=new java.util.ArrayList<>();
    for(String indexName:new String[]{"FIRST","SECOND","THIRD","FOURTH","FIFTH"}){
     try{availableWaypointIndices.add(WaypointIndex.valueOf(indexName));}
     catch(IllegalArgumentException ignored){break;}
    }
    int requiredWaypoints=points.size()-1;
    if(requiredWaypoints>availableWaypointIndices.size()){
     String warning="현재 PLEOS SDK가 지원하는 경유지는 "+availableWaypointIndices.size()+"곳인데 선택 코스에는 "+requiredWaypoints+"곳이 있어요. 경유지를 줄이거나 SDK의 지원 범위를 확인해 주세요. 경유지를 임의로 생략하지 않습니다.";
     navigationFeedback("error",warning);
     return;
    }'''
    source=source.replace(needle,replacement,1)
    source=source.replace('WaypointIndex.valueOf(positions[i])','availableWaypointIndices.get(i)',1)
    bak=main.with_name('MainActivity.java.before-waypoint-hotfix.bak')
    if not bak.exists():shutil.copy2(main,bak)
    main.write_text(source,encoding='utf-8')
    print('내비 수정: 존재하지 않는 WaypointIndex.THIRD 사용 방지')
# Increase actual-candidate diversity without inventing places: search additional relevant terms, keep cached result logic.
s=smart.read_text(encoding='utf-8')
a='''            for word in keyterms[:2]:'''
b='''            for word in keyterms[:3]:'''
if a in s:
    s=s.replace(a,b,1)
    # Add an independent supplementary search term for cafes and bakeries.
    s=s.replace('''            for w in SEARCH_TERMS[kind]:
                if w not in keyterms:keyterms.append(w)''','''            for w in SEARCH_TERMS[kind]:
                if w not in keyterms:keyterms.append(w)
            for w in ({'카페':['로스터리','디저트'],'빵집':['베이커리 카페'],'명소':['관광명소']}.get(kind,[])):
                if w not in keyterms:keyterms.append(w)''',1)
    bak=smart.with_name('smart_routes.py.before-waypoint-hotfix.bak')
    if not bak.exists():shutil.copy2(smart,bak)
    smart.write_text(s,encoding='utf-8')
    print('검색 보완: 동네별 실제 카카오 후보 검색어 확대 (장소 수 부족 시 1개일 수 있음)')
else:print('스마트 검색 확장 적용 여부 확인: 기존 루프 형식이 다르거나 이미 수정됨')
print('완료. CONNECT_REVIEWS.cmd 재시작 -> Android Studio Rebuild/Run')
