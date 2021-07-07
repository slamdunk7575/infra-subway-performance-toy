import http from 'k6/http';
import { check, group, sleep, fail } from 'k6';

export let options = {
    vus: 1,
    duration: '10s',

    thresholds: {
        http_req_duration: ['p(99)<1500'],
    },
};

const BASE_URL = 'https://slamdunk7575.kro.kr/';
const USERNAME = 'slamdunk7575@test.com';
const PASSWORD = '1234';
const 건대입구_ID = 130;
const 잠실_ID = 100;

export default function ()  {
    let 메인_페이지_결과 = 메인_페이지_요청();
    메인_페이지_결과_확인(메인_페이지_결과);

    let 로그인_토큰 = 로그인_요청();
    로그인_확인(로그인_토큰);

    let 내정보 = 내정보_요청(로그인_토큰);
    내정보_확인(내정보);

    let 경로_조회_결과 = 경로_조회_요청(로그인_토큰, 건대입구_ID, 잠실_ID);
    let 예상_출발역 = '건대입구';
    let 예상_도착역 = '잠실';
    let 예상_거리 = 4;
    경로_조회_확인(경로_조회_결과, 예상_출발역, 예상_도착역, 예상_거리);
};

export function 메인_페이지_요청() {
    return http.get(`${BASE_URL}`);
}
export function 메인_페이지_결과_확인(메인페이지_접속_결과) {
    check(메인페이지_접속_결과, {
        'Main Page Access': (response) => response.status === 200
    });
}
export function 로그인_요청() {
    var payload = JSON.stringify({
        email: USERNAME,
        password: PASSWORD,
    });

    var params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    return http.post(`${BASE_URL}/login/token`, payload, params);
}
export function 로그인_확인(로그인_토큰) {
    check(로그인_토큰, {
        'Login Success': (resp) => resp.json('accessToken') !== '',
    });
}
export function 내정보_요청(로그인_토큰) {
    let authHeaders = {
        headers: {
            Authorization: `Bearer ${로그인_토큰.json('accessToken')}`,
        },
    };
    return http.get(`${BASE_URL}/members/me`, authHeaders).json();
};

export function 내정보_확인(내정보) {
    check(내정보, { 'View My Information' : (obj) => obj.id != 0 });
};

export function 경로_조회_요청(로그인_토큰, sourceId, targetId) {

    let authHeaders = {
        headers: {
            Authorization: `Bearer ${로그인_토큰.json('accessToken')}`,
        },
    };

    return http.get(`${BASE_URL}/paths?source=` + sourceId + `&target=` + targetId, authHeaders).json();
};

export function 경로_조회_확인(조회_결과, 예상_거리) {
    check(조회_결과, {
        'Distance Check' : (response) => response['distance'] == 예상_거리,
        'Stations Check' : (response) => response['stations'].length > 0
    });
};
