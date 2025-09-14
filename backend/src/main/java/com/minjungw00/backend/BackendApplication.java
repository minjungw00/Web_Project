package com.minjungw00.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/** Spring Boot 애플리케이션 시작 클래스. */
@SpringBootApplication
public class BackendApplication {

  /**
   * 애플리케이션 엔트리 포인트.
   *
   * @param args 커맨드라인 인자
   */
  public static void main(String[] args) {
    SpringApplication.run(BackendApplication.class, args);
  }
}
