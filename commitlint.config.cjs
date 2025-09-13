const regex =
  /^(?:frontend|backend|infra|docs|chore)(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?$/;

/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    {
      rules: {
        // scope 정규식 매칭 룰
        "scope-regex": (parsed, when = "always", value = regex) => {
          const { scope } = parsed;
          if (!scope) return [true]; // scope 생략 허용 시
          const pass = value.test(scope);
          return [
            when === "always" ? pass : !pass,
            `scope must match ${value}`,
          ];
        },
      },
    },
  ],
  rules: {
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 100],
    "scope-empty": [1, "never"],
    "scope-enum": [0], // 기본 scope-enum 끄기
    "scope-regex": [2, "always", regex],
  },
};
