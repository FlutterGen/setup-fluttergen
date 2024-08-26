import { execa } from 'execa';
import { getInput, setOutput, setFailed, info, addPath } from '@actions/core';
import { downloadTool, extractTar } from '@actions/tool-cache';
import { restoreCache, saveCache } from '@actions/cache';
import { existsSync, readFileSync, chmodSync } from 'fs';
import { join, dirname } from 'path';
import { valid } from 'semver';

async function run() {
  try {
    checkPlatformCompatibility();

    const inputVersion: string | undefined = getInput('version');
    const cacheEnabled: boolean = getInput('cache') === 'true';
    const inputCacheKey: string | undefined = getInput('cache-key');
    const inputCachePath: string | undefined = getInput('cache-path');

    let version: string | undefined;
    if (inputVersion) {
      version = inputVersion;
    } else {
      version = await detectFlutterGenVersion();
      if (!version) {
        throw new Error(
          'FlutterGen version not found. Please specify it explicitly or add it to your project configuration.',
        );
      }
    }

    if (!valid(version)) {
      throw new Error(`Invalid version format: ${version}`);
    }

    let cacheKey: string | undefined;
    if (inputCacheKey) {
      cacheKey = inputCacheKey;
    } else {
      cacheKey = `fluttergen-${process.platform}-${process.arch}-${version}`;
    }

    let cachePath: string | undefined;
    if (inputCachePath) {
      cachePath = inputCachePath;
    } else {
      cachePath = join(process.env.RUNNER_TOOL_CACHE!, '.fluttergen');
    }

    const installedPath = await installFlutterGen(version, cacheEnabled, cacheKey, cachePath);
    info(`FlutterGen installed: ${installedPath}`);

    await makeExecutable(installedPath);

    const { stdout } = await execa('fluttergen', ['--version']);
    if (stdout !== `FlutterGen v${version}`) {
      throw new Error(`commnad doesn't work as expected: ${stdout}`);
    }

    setOutput('version', version);
  } catch (error) {
    if (error instanceof Error) {
      setFailed(error.message);
    } else {
      setFailed('An unexpected error occurred.');
    }
  }
}

function checkPlatformCompatibility(): void {
  if (process.platform !== 'linux' && process.platform !== 'darwin') {
    throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

async function detectFlutterGenVersion(): Promise<string | undefined> {
  const toolVersionsPath = join(process.env.GITHUB_WORKSPACE!, '.tool-versions');
  if (existsSync(toolVersionsPath)) {
    const content = readFileSync(toolVersionsPath, 'utf-8');
    const match = content.match(/fluttergen\s*(\d+\.\d+\.\d+)/m);
    if (match) {
      return match[1];
    }
  }
  const miseTomlPath = join(process.env.GITHUB_WORKSPACE!, '.mise.toml');
  if (existsSync(miseTomlPath)) {
    const content = readFileSync(miseTomlPath, 'utf-8');
    const match = content.match(/fluttergen\s*=\s*("|')(\d+\.\d+\.\d+)("|')/m);
    if (match) {
      return match[2];
    }
  }
  return undefined;
}

async function installFlutterGen(
  version: string,
  cacheEnabled: boolean,
  cacheKey: string,
  cachePath: string,
): Promise<string> {
  if (cacheEnabled) {
    const hitCacheKey = await restoreCache([cachePath], cacheKey);
    if (hitCacheKey) {
      info(`Restored FlutterGen from cache: ${cachePath}`);
      return cachePath;
    }
  }

  info(`Downloading FlutterGen version ${version}`);

  const platform = process.platform === 'darwin' ? 'macos' : process.platform;
  const downloadUrl = `https://github.com/FlutterGen/flutter_gen/releases/download/v${version}/fluttergen-${platform}.tar.gz`;
  const downloadPath = await downloadTool(downloadUrl);

  const extractDir = await extractTar(downloadPath, cachePath);

  if (cacheEnabled) {
    await saveCache([extractDir], cacheKey);
    info(`Saved FlutterGen to cache: ${extractDir}`);
  }

  return extractDir;
}

async function makeExecutable(installedPath: string): Promise<void> {
  const fluttergenPath = join(installedPath, 'fluttergen');
  chmodSync(fluttergenPath, '755');
  addPath(dirname(fluttergenPath));
}

run();
