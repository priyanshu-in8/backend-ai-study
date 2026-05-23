import { exec } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";
import { promisify } from "util";

const execPromise = promisify(exec);

class CodeExecutor {

  constructor() {
    this.tempDir = "/tmp";
    this.timeout = 20000;
  }

  getDockerImage(language) {

    return {

      javascript: "node:18",

      python: "python:3.10",

      cpp: "gcc:latest",

      c: "gcc:latest",

      java: "openjdk:17"

    }[language];
  }

  generateFilename(language) {

    const ext = {

      javascript: ".js",

      python: ".py",

      cpp: ".cpp",

      c: ".c",

      java: ".java"

    }[language];

    return `code_${randomBytes(6).toString("hex")}${ext}`;
  }

  // No wrapping needed now
  wrapCode(code) {
    return code;
  }

  async execute(code, language, stdin) {

    const filename = join(
      this.tempDir,
      this.generateFilename(language)
    );

    const inputFile = join(
      this.tempDir,
      `input_${randomBytes(5).toString("hex")}.txt`
    );

    const inputFileName =
      inputFile.split("/").pop();

    try {

      // Write stdin to temp file
      await writeFile(
        inputFile,
        stdin,
        "utf-8"
      );

      // Write user code
      const wrapped =
        this.wrapCode(code);

      await writeFile(
        filename,
        wrapped,
        "utf-8"
      );

      const file =
        filename.split("/").pop();

      // Java classname
      const javaClassName =
        file.replace(".java", "");

      // Commands
      const runCmdMap = {

        javascript:
          `node ${file} < ${inputFileName}`,

        python:
          `python3 ${file} < ${inputFileName}`,

        cpp:
          `g++ ${file} -o out && ./out < ${inputFileName}`,

        c:
          `gcc ${file} -o out && ./out < ${inputFileName}`,

        java:
          `javac ${file} && java ${javaClassName} < ${inputFileName}`
      };

      const dockerCmd = `
docker run --rm \
--memory=128m \
--cpus=0.5 \
--network=none \
-v ${this.tempDir}:/app \
-w /app \
${this.getDockerImage(language)} \
sh -c '${runCmdMap[language]}'
`;

      console.log("DOCKER CMD:");
      console.log(dockerCmd);

      const { stdout, stderr } =
        await execPromise(
          dockerCmd,
          {
            timeout: this.timeout
          }
        );

      return {

        stdout: stdout.trim(),

        stderr: stderr.trim(),

        status:
          stderr ? "error" : "success"
      };

    } catch (err) {

      return {

        stdout: "",

        stderr: err.message,

        status: "error"
      };

    } finally {

      try {

        await unlink(filename);

        await unlink(inputFile);

      } catch {}
    }
  }

  async runTestCases(
    code,
    language,
    testCases
  ) {

    let passed = 0;

    const results = [];

    console.log(
      "🧪 Received testCases:",
      testCases
    );

    for (const tc of testCases) {

      const res = await this.execute(
        code,
        language,
        tc.input
      );

      const normalize = (s) =>
        (s ?? "")
          .toString()
          .replace(/\s+/g, "");

      const expectedValue =
        tc.expectedOutput ??
        tc.expected ??
        "";

      const isPassed =
        normalize(res.stdout) ===
        normalize(expectedValue);

      if (isPassed) passed++;

      results.push({

        input: tc.input,

        expected: expectedValue,

        actual: res.stdout,

        passed: isPassed,

        error: res.stderr || null
      });

      console.log(
        `📝 Test Result: ${
          isPassed ? "✅" : "❌"
        }`
      );

      console.log(
        `Expected: "${expectedValue}"`
      );

      console.log(
        `Got: "${res.stdout}"`
      );
    }

    const returnValue = {

      passed,

      total: testCases.length,

      score: Math.round(
        (passed / testCases.length) * 100
      ),

      testCases: results
    };

    console.log(
      "✅ Returning:",
      JSON.stringify(
        returnValue,
        null,
        2
      )
    );

    return returnValue;
  }
}

export default new CodeExecutor();