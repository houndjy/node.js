# Korean News Timeline Search

오늘 기준 최근 1년(12개월)을 1개월 단위로 나눠 한국어 기사만 검색하고,
제목 유사도 85% 이상인 기사를 같은 묶음으로 보여주는 웹 앱입니다.

## 로컬 실행

```bash
npm install
npm start
```

브라우저에서 `http://localhost:3000` 접속 후 검색어를 입력하세요.

## Windows 독립 실행 파일(EXE) 빌드

아래 명령으로 Node.js가 설치되지 않은 Windows 환경에서도 실행 가능한 단일 EXE를 생성할 수 있습니다.

```bash
npm run build:win
```

생성 파일:

- `dist/korean-news-timeline.exe`

실행 방법(Windows):

1. `korean-news-timeline.exe` 실행
2. 터미널에 `Server running at http://localhost:3000` 메시지 확인
3. 브라우저에서 `http://localhost:3000` 접속

> 참고: `pkg`를 사용해 EXE 내부에 `public/` 정적 파일이 포함되도록 `pkg.assets`를 설정했습니다.
