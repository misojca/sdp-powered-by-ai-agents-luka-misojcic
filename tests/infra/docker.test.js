const fs = require('fs');
const path = require('path');

const projectRoot = fs.existsSync('/app/package.json') ? '/app' : path.join(__dirname, '../..');

describe('INFRA: Project structure and deployment verification', () => {
  it('INFRA-S1: package.json exists with test script', () => {
    // GIVEN the project root
    // WHEN reading package.json
    // THEN test script is defined
    const pkg = require(path.join(projectRoot, 'package.json'));
    expect(pkg.scripts).toHaveProperty('test');
  });

  it('INFRA-S2: src directory contains all bounded contexts', () => {
    // GIVEN the src directory
    // WHEN checking for bounded context folders
    // THEN all 4 contexts exist
    const srcPath = path.join(projectRoot, 'src');
    expect(fs.existsSync(path.join(srcPath, 'users'))).toBe(true);
    expect(fs.existsSync(path.join(srcPath, 'catalog'))).toBe(true);
    expect(fs.existsSync(path.join(srcPath, 'orders'))).toBe(true);
    expect(fs.existsSync(path.join(srcPath, 'payment'))).toBe(true);
  });

  it('INFRA-S3: app.js entry point exists', () => {
    // GIVEN the src directory
    // WHEN checking for app entry point
    // THEN app.js exists
    expect(fs.existsSync(path.join(projectRoot, 'src', 'app.js'))).toBe(true);
  });

  it('INFRA-S4: tests directory contains all domain test suites', () => {
    // GIVEN the tests directory
    // WHEN checking for domain test folders
    // THEN all 4 domain test folders exist
    const testsPath = path.join(projectRoot, 'tests');
    expect(fs.existsSync(path.join(testsPath, 'users'))).toBe(true);
    expect(fs.existsSync(path.join(testsPath, 'catalog'))).toBe(true);
    expect(fs.existsSync(path.join(testsPath, 'orders'))).toBe(true);
    expect(fs.existsSync(path.join(testsPath, 'payment'))).toBe(true);
  });
});
