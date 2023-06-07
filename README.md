# ChapGPT (짭GPT)

ChatGPT의 클론 프로젝트인 ChapGPT(짭GPT) 백엔드 레포입니다.

## 목차

- [소개](#소개)
- [설치](#설치)
- [API 엔드포인트](#api-엔드포인트)

## 소개

연습용 ChatGPT 클론 프로젝트의 백엔드 코드입니다. 이 프로젝트는 OpenAI API의 gpt-3.5-turbo 모델만을 사용하여 ChatGPT 서비스와 (거의)유사한 서비스를 제공할 수 있습니다.

### 기술 스택
- 런타임: <code>Node.js</code>
- 프레임워크: <code>express</code>
- ORM: <code>Sequelize</code>
- 데이터베이스: <code>MySQL</code>
- 버전 관리 시스템: <code>Git</code>
- 외부 API: <code>OpenAI API</code>

### 문제해결
- 회원 가입 및 로그인에 주로 사용되는 Users 테이블의 목적과 달리 Credit 조회는 채팅 생성과 대화 시 빈번하게 조회가 이뤄지는 차이 발생 
    - Users Table에서 credit 컬럼을 Credits 테이블로 분리하고, UserId를 FK로 1:1 관계 정의
- API endpoint마다 일관되지 않은 response 형태로 클라이언트에서 API 명세서를 면밀히 살펴야 하는 불편 발생
    - response 클래스를 만들어 API 요청에 따른 응답을 <code> {HTTP 코드, 메시지, 데이터}</code> 형태로 전달 
- OpenAI API 응답 지연에 따른 문제
    - OpenAI API 응답 시간이 OpenAI 서버 상황과 메시지 난이도에 따라 달라져 <code>POST</code> 메서드 응답 지연 시 504 gateway timeout 발생
    - 서버에서 우선 빈 스트링(<code>""</code>)을 데이터베이스에 저장하고, 바로 응답을 보낸 후 openAI API 응답을 기다린 후 데이터베이스에 저장하는 방식으로 수정, 응답 받은 클라이언트는 응답 후 전체 채팅을 조회하는 요청과 함께 응답이 올때까지 주기적인 <code>GET</code> /api/chat/:chatId 요청으로 대화 내용을 갱신하는 것으로 해결
- 크레딧 사용에 따른 OpenAI API 성공/실패 여부와 credit 일관성 유지
    - OpenAI API에서 답변 생성 성공시에만 credit 차감하도록 sequelize trasaction을 이용해서 답변 실패 시 credit 차감을 rollback하도록 구현

## 설치

1. 레포 클론:

   ```bash
   git clone https://github.com/Team2clone/team2CloneBE.git
   ```

2. 의존성 설치:

    ```bash
    npm install
    ```

3. 환경변수 설정: 루트 디렉토리에 .env 파일을 생성하고 다음 환경변수를 정의해야 합니다.

    ```
    DB_HOST=<your_database_host>
    DB_USERNAME=<your_database_username>
    DB_PASSWORD=<your_database_password>
    DB_DATABASE=<your_database_name>
    OPENAI_API_KEY=<your_openai_API_key>
    ```

4. 서버를 실행합니다.:
    ```bash
    npm start
    ```

서버가 http://localhost:3001 에서 실행됩니다.

## API 엔드포인트

백엔드 서버에서 제공하는 API 엔드포인트는 다음과 같습니다:

### User
- <code>POST</code> /api/signup → 사용자 등록
- <code>POST</code> /api/login → 사용자 로그인
- <code>POST</code> /api/logout → 사용자 로그아웃
- <code>GET</code> /api/credit → 사용자 크레딧 확인

### Chat
- <code>POST</code> /api/chat → 새로운 채팅 생성
- <code>GET</code> /api/chat → 전체 채팅 가져오기
- <code>GET</code> /api/chat/:chatId → 채팅 세부 내용 가져오기
- <code>POST</code> /api/chat/:chatId → 채팅에 새로운 메시지 보내기
- <code>PUT</code> /api/chat/:chatId → 채팅 제목 업데이트
- <code>DELETE</code> /api/chat/:chatId → 채팅 삭제