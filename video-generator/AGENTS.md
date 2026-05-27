# HyperFrames Composition Project

## Skills

This project uses AI agent skills for framework-specific patterns. Install them if not already present:

```bash
npx skills add heygen-com/hyperframes
```

Skills encode patterns like `window.__timelines` registration, `data-*` attribute semantics, Tailwind v4 browser-runtime styling for `--tailwind` projects, and shader-compatible CSS rules that are not in generic web docs. Using them produces correct compositions from the start.

## Commands

```bash
npm run dev          # start the preview server (long-running — keep it alive in background)
npm run check        # lint + validate + inspect
npm run render       # render to MP4
npm run publish      # publish and get a shareable link
npx hyperframes docs <topic> # reference docs in terminal
```

> **`npm run dev` is a long-running server, not a one-shot command.** It blocks until stopped.
> Always run it as a background process so it stays alive while you edit compositions.
> Running it in the foreground will time out and kill the server, breaking the browser preview.

## Project Structure

- `index.html` — main composition (root timeline)
- `compositions/` — sub-compositions referenced via `data-composition-src`
- `assets/` — media files (video, audio, images)
- `meta.json` — project metadata (id, name)
- `transcript.json` — whisper word-level transcript (if generated)

## Linting — Always Run After Changes

After creating or editing any `.html` composition, run the full check before considering the task complete:

```bash
npm run check
```

Fix all errors before presenting the result.

## Key Rules

1. Every timed element needs `data-start`, `data-duration`, and `data-track-index`
2. Visible timed elements **must** have `class="clip"` — the framework uses this for visibility control
3. GSAP timelines must be paused and registered on `window.__timelines`:
   ```js
   window.__timelines = window.__timelines || {};
   window.__timelines["composition-id"] = gsap.timeline({ paused: true });
   ```
4. Videos use `muted` with a separate `<audio>` element for the audio track
5. Sub-compositions use `data-composition-src="compositions/file.html"`
6. Only deterministic logic — no `Date.now()`, no `Math.random()`, no network fetches

## Documentation

Full docs: https://hyperframes.heygen.com/introduction

Machine-readable index for AI tools: https://hyperframes.heygen.com/llms.txt

---

## ⚡️ プロ級Shorts動画デザイン・構築ルール（黄金比）

### 1. 構成・順序の黄金律 (Story Flow)
- **結論ファースト**: 冒頭3秒で「AI丸投げで動画ができた」という衝撃の結論を見せる。
- **行動・実践の即時提示**: 興味を持った視聴者に、2シーン目ですぐに「具体的なやり方・呪文」を提示する。
- **不安・用語の遅延フォロー**: 専門用語などのハードルは、行動を提示した「後」で「メラゾーマみたいなもの」と噛み砕いてフォローする。

### 2. 字幕セグメントの黄金比 (Caption Segmentation)
- **「細切れ（カラオケ）表示禁止」**: 1単語や2〜3文字ずつの細切れ表示は安っぽく見えるため厳禁。
- **「意味の塊（大セグメント）」**: 1シーンにつき、意味の通じる一文（約15〜25文字）を「2〜3段階」で大きく切り替えるのが最も美しい。
- **「声と要約のシンクロ」**: 音声のしゃべりはフルで流しつつ、画面上の字幕は最も視認性の高い形に「微要約」して表示する。

### 3. シングルDOM設計（レイアウト崩れ絶対回避）
- **「文字のズレ防止」**: 太縁字幕を作る際、`stroke` と `fill` などの別々のテキスト要素を重ねるアプローチは絶対に禁止（文字幅やパディングの計算でズレて重なる）。
- **「単一要素＋`paint-order`」**: 必ず1つのテキスト要素のみで構築し、CSSの `-webkit-text-stroke` と `paint-order: stroke fill;` の組み合わせを用いて「絶対にズレようがない極太文字」を表現する。

### 4. プレミアム・ビジュアル (Premium Visuals)
- **「背景は生きているメッシュ」**: 単色や単純なグラデーションは避け、HSLの複数ネオンカラーがゆっくり動く「Dynamic Mesh Background」を採用する。
- **「ガラスの質感（Glassmorphism）」**: 字幕エリアの背景に、背後が美しくボケて透ける半透明ガラスプレート（`backdrop-filter: blur`）を配置し、文字を美しく浮き上がらせる。
- **「極太境界線 ＋ ネオングロー」**: フォントは「Noto Sans JP 900」などの超極太を採用。境界線は14px〜16px of 黒で引き締め、強調ワードには色相に応じた「バックグロー（`text-shadow` 発光）」を施す。

### 5. 🤖 AI自動台本バリデーションルール (AI Automated Script Checker)
AIエージェントは、動画作成（`script.json` 生成・更新）時に、以下の基準で全自動で台本をチェックし、問題があれば自己修正しなければならない：
- **ユーザーとの事前台本合意プロセス (Pre-render User Script Approval) [最優先]**: 動画の音声合成やレンダリング（動画の生成）に進む前に、AIは必ず「作成・修正した台本の全文（セグメント構成案を含む）」を分かりやすくチャット上で提示し、ユーザーの明示的なレビューと承認を得なければならない。ユーザーが『これで作成して！』『GOGO！』等と合意（承認）するまでは、決して音声合成やレンダリングの後続プロセスに進んではならない。
- **ずんだもんペルソナチェック**: 語尾が「〜のだ」「〜なのだ」で統一されているかを厳格に確認し、キャラクターの崩れを防ぐ。
- **1シーンの最大文字数制限（8秒ルール）**: 長尺動画も含め、1つのシーンが長すぎて画面が退屈になるのを防ぐため、1シーンあたりの最大文字数は『60文字（または音声8秒分）』までとする。これを超える場合は、AIが自動的に複数シーンに分割する、または構成を再設計する。
- **インテリジェント・ハイライト（強調箇所の制限）**: AIが台本から重要ワードを自動判断してタグ（`<span class="accent-...">`）を埋め込む際、画面のうるささを防ぐため、1回の字幕表示（セグメント）あたり、強調キーワードは『最大2箇所まで』に抑える。
- **再生時間の自由度**: 動画の総再生時間（Shorts縛りや長尺など）は、作成時にユーザーの意図を汲み取って柔軟に指定可能にする。


