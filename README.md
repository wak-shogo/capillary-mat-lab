# Capillary Mat Lab

植物育成向けの 3D プリント製毛細管マットを、ブラウザ上で設計して STL として書き出す静的 Web アプリです。

## Features

- パラメータ変更に応じたリアルタイム形状生成
- WebGL ベースの 3D プレビュー
- 平面図プレビュー
- 共有 URL の生成
- ブラウザ内での ASCII STL 書き出し

## Parameters

- 幅
- 長さ
- 厚み
- 格子ピッチ
- 毛細管スリット径
- 目標空隙率
- 外周フレーム幅

## Local Preview

静的ファイルなので、任意の HTTP サーバーでそのまま配信できます。

```bash
python3 -m http.server 8000
```

その後 `http://localhost:8000` を開いてください。

## Deploy

このリポジトリは GitHub Pages の `main` ブランチ / root 配信を前提にしています。
