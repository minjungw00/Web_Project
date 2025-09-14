package com.minjungw00.backend.temp;

import java.util.HashMap;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 간단한 상태 확인 엔드포인트를 제공하는 컨트롤러. */
@RestController
@RequestMapping
public class TempController {

  /**
   * 루트 경로 응답.
   *
   * @return 서비스 상태 안내 문자열
   */
  @GetMapping(path = "/", produces = MediaType.TEXT_PLAIN_VALUE)
  public String home() {
    return "Backend is running. Try GET /api/health";
  }

  /**
   * 헬스체크 응답.
   *
   * @return 상태 정보 맵
   */
  @GetMapping(path = "/api/health", produces = MediaType.APPLICATION_JSON_VALUE)
  public Map<String, Object> health() {
    Map<String, Object> resp = new HashMap<>();
    resp.put("status", "UP");
    return resp;
  }
}
