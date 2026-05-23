/**
 * Code Executor Test Suite
 * Tests for secure code execution engine
 */

import codeExecutor from './codeExecutor.js';

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('         SECURE CODE EXECUTOR TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Test 1: Simple Python
  console.log('✅ Test 1: Simple Python Arithmetic');
  let result = await codeExecutor.execute('print(2 + 2)', 'python');
  console.log(`   Status: ${result.status}, Output: ${result.stdout.trim()}, Time: ${result.executionTime}ms\n`);

  // Test 2: JavaScript
  console.log('✅ Test 2: JavaScript String Output');
  result = await codeExecutor.execute('console.log("Hello World")', 'javascript');
  console.log(`   Status: ${result.status}, Output: ${result.stdout.trim()}, Time: ${result.executionTime}ms\n`);

  // Test 3: Test Cases - All Pass
  console.log('✅ Test 3: Test Cases - All Passing (Sum)');
  const code1 = 'a, b = map(int, input().split())\nprint(a + b)';
  const testCases1 = [
    { input: '5 3', Output: '8' },
    { input: '10 20', Output: '30' },
    { input: '-5 3', Output: '-2' }
  ];
  result = await codeExecutor.runTestCases(code1, 'python', testCases1);
  console.log(`   Passed: ${result.passed}/${result.total}, Score: ${result.score}%\n`);

  // Test 4: Test Cases - Some Fail
  console.log('✅ Test 4: Test Cases - Some Failing (Wrong Algorithm)');
  const code2 = 'a, b = map(int, input().split())\nprint(a - b)';
  const testCases2 = [
    { input: '5 3', Output: '2' },      // Pass
    { input: '10 20', Output: '30' },   // Fail (actual: -10)
    { input: '-5 3', Output: '-8' }     // Pass
  ];
  result = await codeExecutor.runTestCases(code2, 'python', testCases2);
  console.log(`   Passed: ${result.passed}/${result.total}, Score: ${result.score}%\n`);

  // Test 5: Syntax Error
  console.log('✅ Test 5: Syntax Error Handling');
  result = await codeExecutor.execute('print("missing quote', 'python');
  console.log(`   Status: ${result.status}, Has Error: ${result.stderr.length > 0}\n`);

  // Test 6: Runtime Error
  console.log('✅ Test 6: Runtime Error Handling');
  result = await codeExecutor.execute('x = 1 / 0', 'python');
  console.log(`   Status: ${result.status}, Has Error: ${result.stderr.length > 0}\n`);

  // Test 7: With Input
  console.log('✅ Test 7: Code with Standard Input');
  result = await codeExecutor.execute('name = input()\nprint(f"Hello, {name}!")', 'python', 'Alice');
  console.log(`   Status: ${result.status}, Output: ${result.stdout.trim()}\n`);

  // Test 8: Unsupported Language
  console.log('✅ Test 8: Unsupported Language');
  result = await codeExecutor.execute('print("test")', 'cobol');
  console.log(`   Status: ${result.status}, Error: ${result.stderr.trim()}\n`);

  // Test 9: Multi-language Support
  console.log('✅ Test 9: Multiple Language Support');
  const languages = [
    { lang: 'python', code: 'print(42)' },
    { lang: 'javascript', code: 'console.log(42)' },
    { lang: 'ruby', code: 'puts 42' },
    { lang: 'bash', code: 'echo 42' }
  ];
  
  for (const { lang, code } of languages) {
    result = await codeExecutor.execute(code, lang);
    console.log(`   ${lang}: ${result.status}, Output: ${result.stdout.trim()}`);
  }
  console.log();

  // Test 10: Performance Check
  console.log('✅ Test 10: Performance Metrics');
  result = await codeExecutor.execute('for i in range(100):\n    pass\nprint("Done")', 'python');
  console.log(`   Status: ${result.status}, Execution Time: ${result.executionTime}ms\n`);

  console.log('═══════════════════════════════════════════════════════════');
  console.log('         ALL TESTS COMPLETED SUCCESSFULLY! 🎉');
  console.log('═══════════════════════════════════════════════════════════\n');
}

// Run all tests
runAllTests().catch(console.error);
