/**
 * generate.js — HyperFrames × VOICEVOX 音声・HTML 自動生成スクリプト
 *
 * 処理フロー:
 * 1. script.json から台本を読み込む
 * 2. VOICEVOX (ずんだもん, speaker=3, speed=1.45x) で音声を生成
 *    → VOICEVOX 未起動の場合は Google TTS + FFmpeg 1.45x 速度調整でフォールバック
 * 3. ffprobe で各音声ファイルの正確な長さ（秒）を測定
 * 4. 測定した長さを index.html に静的に書き込む（data-duration, audio タグ）
 * 5. npx hyperframes render でレンダリング
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ===== 設定 =====
const VOICEVOX_URL = 'http://localhost:50021';
const SPEAKER_ID = 3; // ずんだもん (ノーマル)
const SPEED_SCALE = 1.45; // 1.45x 爆速

const FFMPEG_BIN =
  'C:\\Users\\oresa\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.1-full_build\\bin';

const BGM_SRC = 'assets/audio/Pocket Quietness.mp3';
const BGM_VOLUME = 0.15; // BGM は控えめに

// ===== VOICEVOX 疎通チェック =====
async function checkVoicevox() {
  try {
    const res = await fetch(`${VOICEVOX_URL}/speakers`);
    return res.ok;
  } catch {
    return false;
  }
}

// ===== ffprobe で正確な音声長を取得（小数点3桁） =====
function getAudioDuration(filePath) {
  try {
    const raw = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { encoding: 'utf8' }
    );
    const dur = parseFloat(parseFloat(raw.trim()).toFixed(3));
    console.log(`  ✓ ${path.basename(filePath)}: ${dur}s`);
    return dur;
  } catch (e) {
    console.error(`  ❌ ffprobe 失敗 (${path.basename(filePath)}):`, e.message);
    return 3.0; // フォールバック値
  }
}

// ===== VOICEVOX 音声生成 =====
async function generateVoicevox(text, filename, outputDir) {
  console.log(`  [VOICEVOX] "${text.slice(0, 30)}..."`);

  const queryRes = await fetch(
    `${VOICEVOX_URL}/audio_query?text=${encodeURIComponent(text)}&speaker=${SPEAKER_ID}`,
    { method: 'POST' }
  );
  if (!queryRes.ok) throw new Error(`audio_query 失敗: HTTP ${queryRes.status}`);
  const queryData = await queryRes.json();

  queryData.speedScale = SPEED_SCALE;

  const synthRes = await fetch(`${VOICEVOX_URL}/synthesis?speaker=${SPEAKER_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(queryData),
  });
  if (!synthRes.ok) throw new Error(`synthesis 失敗: HTTP ${synthRes.status}`);

  const buffer = Buffer.from(await synthRes.arrayBuffer());
  const wavPath = path.join(outputDir, filename.replace('.mp3', '.wav'));
  const mp3Path = path.join(outputDir, filename);
  fs.writeFileSync(wavPath, buffer);

  execSync(`ffmpeg -y -i "${wavPath}" -codec:a libmp3lame -qscale:a 2 "${mp3Path}"`, {
    stdio: 'pipe',
  });
  fs.unlinkSync(wavPath);

  return mp3Path;
}

// ===== Google TTS フォールバック =====
async function generateGoogleTTS(text, filename, outputDir) {
  console.log(`  [Google TTS] "${text.slice(0, 30)}..."`);

  const rawPath = path.join(outputDir, `raw_${filename}`);
  const mp3Path = path.join(outputDir, filename);

  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=ja&client=tw-ob`;
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/100.0.0.0 Safari/537.36',
    },
  });
  if (!res.ok) throw new Error(`Google TTS HTTP ${res.status}`);

  fs.writeFileSync(rawPath, Buffer.from(await res.arrayBuffer()));
  execSync(`ffmpeg -y -i "${rawPath}" -filter:a "atempo=${SPEED_SCALE}" "${mp3Path}"`, {
    stdio: 'pipe',
  });
  fs.unlinkSync(rawPath);

  return mp3Path;
}

// ===== HTML へ音声タイミングを静的に書き込む =====
function injectAudioIntoHtml(htmlPath, audioEntries, totalDuration) {
  let html = fs.readFileSync(htmlPath, 'utf8');

  // --- data-duration の更新 ---
  html = html.replace(
    /(id="root"[^>]+data-duration=")[^"]+(")/,
    `$1${totalDuration}$2`
  );

  // --- audio タグを組み立て ---
  let audioTags = '';

  // BGM (トラック 0)
  audioTags += `        <audio id="audio-bgm" data-start="0" data-duration="${totalDuration}" data-track-index="0" src="${BGM_SRC}" data-volume="${BGM_VOLUME}"></audio>\n`;

  // 各音声ライン (トラック 1〜N)
  audioEntries.forEach((entry, i) => {
    audioTags += `        <audio id="audio-s${i + 1}" data-start="${entry.startTime.toFixed(3)}" data-duration="${entry.duration.toFixed(3)}" data-track-index="${i + 1}" src="assets/audio/${entry.id}.mp3" data-volume="1"></audio>\n`;
  });

  // --- audio-tracks-container の中身を全置換 ---
  const containerRegex =
    /(<div id="audio-tracks-container" class="hidden">)[\s\S]*?(<\/div>)/;
  html = html.replace(
    containerRegex,
    `$1\n        <!-- AUDIO_TRACKS_PLACEHOLDER -->\n${audioTags}      $2`
  );

  // --- sceneTimings を埋め込む（JS 変数として） ---
  // index.html 側の JS でこの変数を参照して字幕タイミングを決定する
  const timingsJson = JSON.stringify(
    audioEntries.map((e) => ({
      id: e.id,
      start: parseFloat(e.startTime.toFixed(3)),
      duration: parseFloat(e.duration.toFixed(3)),
    }))
  );

  // SCENE_TIMINGS_PLACEHOLDER を置換（なければ挿入）
  if (html.includes('/* SCENE_TIMINGS_PLACEHOLDER */')) {
    html = html.replace(
      '/* SCENE_TIMINGS_PLACEHOLDER */',
      `const SCENE_TIMINGS = ${timingsJson};`
    );
  } else {
    // <script> ブロック先頭に挿入
    html = html.replace(
      '<script>\n      // Seeded random',
      `<script>\n      // ★ 音声長から自動生成されたシーンタイミング（generate.js が書き込む）\n      const SCENE_TIMINGS = ${timingsJson};\n\n      // Seeded random`
    );
  }

  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('\n✓ index.html への音声タイミング書き込みが完了しました。');
  console.log(`  総尺: ${totalDuration.toFixed(3)}秒`);
  audioEntries.forEach((e, i) =>
    console.log(`  シーン${i + 1}: start=${e.startTime.toFixed(3)}s  dur=${e.duration.toFixed(3)}s`)
  );
}

// ===== メイン =====
async function main() {
  const __dirname = import.meta.dirname;

  // FFmpeg パスを追加
  process.env.Path = `${FFMPEG_BIN};${process.env.Path}`;

  // script.json 読み込み
  const scriptPath = path.join(__dirname, 'script.json');
  if (!fs.existsSync(scriptPath)) {
    console.error('❌ script.json が見つかりません。');
    process.exit(1);
  }
  const lines = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
  console.log(`\n⚡ script.json: ${lines.length} シーンをロード\n`);

  const audioDir = path.join(__dirname, 'assets', 'audio');
  if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

  // VOICEVOX チェック
  const voicevoxOk = await checkVoicevox();
  if (voicevoxOk) {
    console.log('🎙️  VOICEVOX 検出！ずんだもん音声を生成します...\n');
  } else {
    console.log('💡 VOICEVOX 未起動 → Google TTS + FFmpeg 速度調整にフォールバック...\n');
  }

  // 音声生成
  const audioEntries = [];
  for (const line of lines) {
    const mp3Path = voicevoxOk
      ? await generateVoicevox(line.text, `${line.id}.mp3`, audioDir)
      : await generateGoogleTTS(line.text, `${line.id}.mp3`, audioDir);
    audioEntries.push({ ...line, path: mp3Path });
  }

  // ffprobe で正確な長さを測定
  console.log('\n📏 音声ファイルの正確な長さを測定中...');
  let cursor = 0;
  for (const entry of audioEntries) {
    const dur = getAudioDuration(entry.path);
    entry.startTime = cursor;
    entry.duration = dur;
    cursor += dur;
  }
  const totalDuration = cursor;

  // index.html に書き込み
  const htmlPath = path.join(__dirname, 'index.html');
  injectAudioIntoHtml(htmlPath, audioEntries, totalDuration);

  // HyperFrames レンダリング
  console.log('\n🎬 HyperFrames レンダリング開始...');
  try {
    execSync('npx hyperframes render', { stdio: 'inherit' });
    console.log('\n🚀 レンダリング完了！');
  } catch (e) {
    console.error('❌ レンダリングエラー:', e.message);
  }
}

main();
