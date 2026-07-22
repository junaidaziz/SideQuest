import { spawnSync } from 'node:child_process';

const allowedPackages = new Map([
  ['@expo/cli', ['node_modules/expo/node_modules/@expo/cli']],
  ['@expo/config', ['node_modules/@expo/config']],
  ['@expo/config-plugins', ['node_modules/@expo/config-plugins']],
  ['@expo/inline-modules', ['node_modules/@expo/inline-modules']],
  ['@expo/local-build-cache-provider', ['node_modules/@expo/local-build-cache-provider']],
  ['@expo/metro-config', ['node_modules/@expo/metro-config']],
  ['@expo/prebuild-config', ['node_modules/@expo/prebuild-config']],
  ['@react-native-firebase/analytics', ['node_modules/@react-native-firebase/analytics']],
  ['@react-native-firebase/app', ['node_modules/@react-native-firebase/app']],
  ['@react-native-firebase/crashlytics', ['node_modules/@react-native-firebase/crashlytics']],
  ['@react-native-google-signin/google-signin', ['node_modules/@react-native-google-signin/google-signin']],
  ['@sentry/react-native', ['node_modules/@sentry/react-native']],
  ['expo', ['node_modules/expo']],
  ['expo-splash-screen', ['node_modules/expo-splash-screen']],
  ['uuid', ['node_modules/uuid']],
  ['xcode', ['node_modules/xcode']],
]);
const allowedAdvisories = new Set(['uuid:GHSA-w5hq-g745-h8pq']);

const result = spawnSync('npm', ['audit', '--omit=dev', '--json'], { encoding: 'utf8' });
if (!result.stdout) {
  process.stderr.write(result.stderr || 'npm audit produced no report\n');
  process.exit(1);
}
let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error('npm audit returned invalid JSON.');
  process.exit(1);
}
if (report.error || !report.metadata?.vulnerabilities || !report.vulnerabilities) {
  console.error(report.message ?? 'npm audit failed before producing a vulnerability report.');
  process.exit(1);
}

const entries = Object.entries(report.vulnerabilities);
const failures = [];
if (report.metadata.vulnerabilities.total !== entries.length) {
  failures.push(`metadata reports ${report.metadata.vulnerabilities.total} records but ${entries.length} were inspectable`);
}
if (entries.length !== allowedPackages.size) {
  failures.push(`expected ${allowedPackages.size} vulnerability records, received ${entries.length}`);
}
const seenAdvisories = new Set();
for (const [name, vulnerability] of entries) {
  const expectedNodes = allowedPackages.get(name);
  if (!expectedNodes) failures.push(`unallowlisted vulnerable package: ${name}`);
  if (vulnerability.name !== name) failures.push(`package identity mismatch: ${name}`);
  if (JSON.stringify([...(vulnerability.nodes ?? [])].sort()) !== JSON.stringify([...(expectedNodes ?? [])].sort())) {
    failures.push(`unexpected install path for ${name}: ${(vulnerability.nodes ?? []).join(', ')}`);
  }
  for (const via of vulnerability.via ?? []) {
    if (typeof via === 'string') {
      if (!report.vulnerabilities[via]) failures.push(`${name} references unidentified vulnerability ${via}`);
      continue;
    }
    const advisory = via?.url?.match(/GHSA-[\w-]+/)?.[0];
    const key = advisory ? `${name}:${advisory}` : null;
    if (!key || !allowedAdvisories.has(key)) failures.push(`unallowlisted or unidentified advisory for ${name}`);
    else seenAdvisories.add(key);
  }
}
for (const advisory of allowedAdvisories) {
  if (!seenAdvisories.has(advisory)) failures.push(`documented advisory disappeared or moved: ${advisory}`);
}
if (failures.length) {
  console.error(`Production dependency audit rejected:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Production dependency audit passed with ${seenAdvisories.size} exact upstream advisory exception(s).`);
