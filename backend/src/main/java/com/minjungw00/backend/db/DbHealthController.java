package com.minjungw00.backend.db;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 가벼운 데이터베이스 연결 상태를 확인하는 엔드포인트를 제공합니다. */
@RestController
@RequestMapping(path = "/db", produces = MediaType.APPLICATION_JSON_VALUE)
public class DbHealthController {

  private final JdbcTemplate jdbcTemplate;

  /**
   * 전달된 {@link DataSource}로 자체 {@link JdbcTemplate}을 생성하여 보관합니다.
   *
   * <p>외부에서 전달된 변경 가능한 객체 참조를 그대로 보관하지 않기 위해 방어적으로 새로운 {@code JdbcTemplate} 인스턴스를 생성합니다.
   *
   * @param dataSource Spring이 관리하는 데이터소스
   */
  public DbHealthController(DataSource dataSource) {
    this.jdbcTemplate = new JdbcTemplate(dataSource);
  }

  /**
   * 데이터소스에 접근 가능한지 확인하기 위해 간단히 SELECT 1을 수행합니다.
   *
   * @return 성공 시 소요 시간과 함께 HTTP 200을 반환하고, 실패 시 오류 정보와 함께 HTTP 503을 반환합니다.
   */
  @GetMapping("/health")
  public ResponseEntity<Map<String, Object>> check() {
    Map<String, Object> body = new LinkedHashMap<>();
    Instant start = Instant.now();
    try {
      Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
      body.put("status", "UP");
      body.put("result", result);
      body.put("elapsedMs", Duration.between(start, Instant.now()).toMillis());
      return ResponseEntity.ok(body);
    } catch (DataAccessException ex) {
      body.put("status", "DOWN");
      body.put("error", ex.getMessage());
      body.put("elapsedMs", Duration.between(start, Instant.now()).toMillis());
      return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(body);
    } catch (RuntimeException ex) { // 기타 런타임 문제에 대한 폴백 처리
      body.put("status", "DOWN");
      body.put("error", ex.getMessage());
      body.put("elapsedMs", Duration.between(start, Instant.now()).toMillis());
      return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(body);
    }
  }
}
