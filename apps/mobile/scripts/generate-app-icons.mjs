/**
 * 앱 아이콘 생성 — assets/app-icon.svg 하나에서 iOS · Android 아이콘을 전부 만든다.
 *
 *   node scripts/generate-app-icons.mjs      (apps/mobile 에서 실행)
 *
 * 아이콘을 손으로 그려 넣지 말 것. 로고가 바뀌면 assets/app-icon.svg 만 고치고
 * 이 스크립트를 다시 돌린다 — 그래야 22개 파일이 한 벡터에서 나온 같은 그림이 된다.
 *
 * sharp 는 react-native-bootsplash 가 이미 의존하고 있어 따로 설치하지 않는다.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'assets', 'app-icon.svg');

/** mdpi 기준 배수 — Android 리소스 디렉터리 규격 */
const DENSITIES = [
  ['mdpi', 1],
  ['hdpi', 1.5],
  ['xhdpi', 2],
  ['xxhdpi', 3],
  ['xxxhdpi', 4],
];

/** 런처 아이콘 48dp, 적응형 아이콘 캔버스 108dp */
const LAUNCHER_DP = 48;
const ADAPTIVE_DP = 108;

/**
 * 적응형 아이콘은 108dp 중 가운데 72dp 만 항상 보인다.
 * 마크가 전체의 64% 여야 하므로 전경 캔버스 기준으로는 72/108 * 64% = 42.6% 로 줄인다.
 */
const MARK_RATIO_FULL = 0.64;
const MARK_RATIO_ADAPTIVE = (72 / 108) * MARK_RATIO_FULL;

/** app-icon.svg 를 배경 · 전경 · 전체 세 가지로 조립하기 위한 원본 문자열 */
const source = await readFile(SRC, 'utf8');

/** <rect ... fill="url(#bg)"/> 뒤의 마크 그룹만 남긴 전경, 배경만 남긴 배경 */
const markGroup = source.slice(source.indexOf('<g transform="translate('), source.lastIndexOf('</svg>'));
const defs = source.slice(source.indexOf('<defs>'), source.indexOf('</defs>') + 7);

function wrap(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${defs}${inner}</svg>`;
}

/** 마크를 원하는 비율로 다시 배치한다 (1024 캔버스 기준) */
function markAt(ratio) {
  const scale = (1024 * ratio) / 52;
  const offset = (1024 - 1024 * ratio) / 2;
  return markGroup.replace(
    /<g transform="translate\([^)]*\) scale\([^)]*\)">/,
    `<g transform="translate(${offset} ${offset}) scale(${scale})">`,
  );
}

const FULL = wrap(`<rect width="1024" height="1024" fill="url(#bg)"/>${markAt(MARK_RATIO_FULL)}`);
const BACKGROUND = wrap('<rect width="1024" height="1024" fill="url(#bg)"/>');
const FOREGROUND = wrap(markAt(MARK_RATIO_ADAPTIVE));

async function png(svgString, size, outPath) {
  await mkdir(dirname(outPath), { recursive: true });
  const buffer = await sharp(Buffer.from(svgString), { density: 384 })
    .resize(size, size, { fit: 'fill' })
    .png()
    .toBuffer();
  await writeFile(outPath, buffer);
  console.log(`  ${size}×${size}  ${outPath.replace(root + '/', '')}`);
}

// iOS — Xcode 14 이후 단일 1024 슬롯
await png(FULL, 1024, join(root, 'ios/hanpun/Images.xcassets/AppIcon.appiconset/Icon-1024.png'));

// Android — 레거시 런처 + 적응형 아이콘 전경/배경
for (const [density, factor] of DENSITIES) {
  const dir = join(root, 'android/app/src/main/res', `mipmap-${density}`);
  const launcher = Math.round(LAUNCHER_DP * factor);
  const adaptive = Math.round(ADAPTIVE_DP * factor);

  await png(FULL, launcher, join(dir, 'ic_launcher.png'));
  await png(FULL, launcher, join(dir, 'ic_launcher_round.png'));
  await png(FOREGROUND, adaptive, join(dir, 'ic_launcher_foreground.png'));
  await png(BACKGROUND, adaptive, join(dir, 'ic_launcher_background.png'));
}

console.log('\n앱 아이콘 생성 완료');
