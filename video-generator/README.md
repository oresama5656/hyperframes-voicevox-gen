# video-generator

HyperFrames + VOICEVOX で動画を作るためのプロジェクトです。

## まず使うコマンド

このディレクトリで実行します。

```powershell
cd D:\hyperframes-voicevox-gen\video-generator
```

```powershell
npm run dev
```

- プレビュー用の HyperFrames Studio が起動します
- このプロジェクトでは `http://localhost:3002` で開けます
- ブラウザが自動で開かないときは、手で `http://localhost:3002` を開けば OK です
- すでに起動済みなら既存サーバーが再利用されます

確認用コマンド:

```powershell
npx hyperframes preview --list
```

全部止めたいとき:

```powershell
npx hyperframes preview --kill-all
```

## 使い方の流れ

1. `npm run dev` でプレビューを起動する
2. ブラウザで Studio を開く
3. `index.html` を編集する
4. 保存して見た目を確認する
5. 問題なければ `npm run render` で mp4 を出す

## プレビューの開き方

```powershell
npm run dev
```

- これは長時間動かしっぱなしにするコマンドです
- プレビュー中はそのターミナルを閉じないでください
- 編集用のターミナルやエディタは別で開くのがおすすめです

## 編集の仕方

基本は `index.html` を編集します。

- テキスト変更
- 色やフォント変更
- CSS レイアウト調整
- GSAP アニメーション調整
- `data-start` / `data-duration` / `data-track-index` の調整

外部エディタで `index.html` を保存すると、プレビューは自動で更新されます。
HyperFrames Studio は hot reload なので、毎回サーバー再起動は不要です。

## Studio 上でできる編集

HyperFrames Studio では次のような操作ができます。

- 再生 / 一時停止
- タイムラインをクリックしてシーク
- 再生ヘッドをドラッグしてスクラブ
- フレーム単位で前後移動
- 対応しているクリップの移動や trim
- 対応している要素の DOM 編集

タイムライン編集でできること:

- 横ドラッグで `data-start` を動かす
- 縦ドラッグで `data-track-index` を変える
- 右端ドラッグで `data-duration` を短くする
- 行の上下で重なり順を変える

対応している Studio 編集は source HTML に書き戻されます。
ただし、全部の要素が完全にビジュアル編集できるわけではないので、細かい調整は `index.html` を直接直すのが確実です。

## セーブの仕方

保存は 2 パターンあります。

### 1. `index.html` を直接編集した場合

- エディタで保存します
- ふつうに `Ctrl+S` で OK です
- 保存するとプレビューに即反映されます

### 2. Studio 上で対応している編集をした場合

- タイムライン編集や一部の DOM 編集は source に反映されます
- 別形式に export するのではなく、元の HTML を更新するイメージです
- うまく触れない要素は `index.html` 側で直してください

## レンダー方法

最終的に mp4 を出すにはこれです。

```powershell
npm run render
```

- デフォルトでは `renders/` 以下に mp4 が出ます
- このプロジェクトでも `renders\video-generator_*.mp4` が生成されています

出力先を変えたいとき:

```powershell
npx hyperframes render --output renders\my-output.mp4
```

軽く確認用に速く回したいとき:

```powershell
npx hyperframes render --quality draft --output renders\preview.mp4
```

## 事前チェック

レンダー前に一度これを流すのがおすすめです。

```powershell
npm run check
```

- lint
- validate
- inspect

をまとめて実行します。

## よくあるハマりどころ

- `npm run dev` を閉じるとプレビューも止まる
- ブラウザが開かなくても `http://localhost:3002` に直接行けば見られる
- プレビューが起動済みのときは新規起動ではなく再利用される
- レンダーはプレビューより重いので少し時間がかかる
- ローカル render には FFmpeg が必要

## 参考

- HyperFrames Studio package docs: https://hyperframes.heygen.com/packages/studio
- HyperFrames CLI docs: https://hyperframes.heygen.com/packages/cli
- Timeline editing docs: https://hyperframes.heygen.com/guides/timeline-editing
- Rendering docs: https://hyperframes.heygen.com/guides/rendering
