# Make Calendar（カレンダーメーカー）

ブラウザだけで、写真入りのオリジナルカレンダーを作って **A4 PDF** に書き出せる Web アプリです。  
データは端末内（IndexedDB）に保存され、複数のカレンダーを「工房」で管理できます。

リポジトリ: [github.com/jpsarchgac-blip/make-calendar](https://github.com/jpsarchgac-blip/make-calendar)

## できること

- **複数プロジェクト** — カレンダー工房で作成・名前変更・削除
- **12か月分の編集** — 表面（カレンダー）・裏面（写真3枚）・任意の表紙
- **期間の自由設定** — 開始年・開始月（例: 2026年9月〜翌年9月）
- **写真** — フォルダ一括取り込み、配置ラベル、枠内トリミング
- **予定・祝日** — 日付クリックでイベント追加、日本の祝日表示
- **PDF** — 両面印刷向け（表紙の裏は白紙、裏面の上下反転オプション）
<img width="1124" height="861" alt="スクリーンショット 2026-09-20 020718" src="https://github.com/user-attachments/assets/f84f9cad-7974-4226-86e2-68ca2b91a820" />
<img width="1102" height="785" alt="スクリーンショット 2026-09-20 020621" src="https://github.com/user-attachments/assets/04fe4c42-cac8-4ecf-9c26-cf2135025ff1" />
<img width="1102" height="767" alt="スクリーンショット 2026-09-20 020452" src="https://github.com/user-attachments/assets/f82342f9-360c-449f-9e38-b0413efba5a3" />
<img width="1101" height="780" alt="スクリーンショット 2026-09-20 020431" src="https://github.com/user-attachments/assets/f6c8a471-20cb-4471-8af4-4709a9b96ef9" />

## 必要環境

- [Node.js](https://nodejs.org/) 20 以降を推奨
- モダンブラウザ（Chrome / Edge 推奨。フォルダ選択は `showDirectoryPicker` 対応ブラウザで快適）

## セットアップ

```bash
git clone https://github.com/jpsarchgac-blip/make-calendar.git
cd make-calendar
npm install
npm run dev
```

表示された URL（通常 `http://localhost:5173`）をブラウザで開きます。

## スクリプト

| コマンド | 説明 |
|----------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド（`dist/`） |
| `npm run preview` | ビルド結果のプレビュー |
| `npm run lint` | oxlint |

## 使い方の流れ

1. **カレンダー工房**で「新しいカレンダー」を作成するか、既存を開く
2. サイドバーから **基本設定**（タイトル・期間・向き）と **写真フォルダ** を整える
3. 月ごとに表面・裏面・表紙を編集（プレビューをクリックで拡大・トリミング）
4. **PDF** ボタンで A4 をダウンロード（印刷は「長辺とじ」など、プリンタ設定に合わせてください）

### PDF のオプション（表示オプション）

- **PDFの先頭に表紙を付ける** — 表紙の直後に **白紙1枚** を入れます（表紙の裏用）
- **PDFの裏面を上下反転** — 長辺とじの両面印刷で裏面の向きを合わせます（既定: オン）

## 技術スタック

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- 保存: IndexedDB（プロジェクト・写真）
- PDF: [html2canvas](https://github.com/niklasvh/html2canvas) + [jsPDF](https://github.com/parallax/jsPDF)

## ディレクトリ構成（抜粋）

```
src/
  App.tsx              … 画面全体・PDF書き出し
  components/          … カレンダーUI・表紙・サイドバーなど
  storage.ts           … IndexedDB
  pdf.ts               … ページ画像化・PDF生成
  folderImport.ts      … フォルダから写真取り込み
public/data/kinenbi.json … 「何の日」データ
```

## ライセンス

このリポジトリに LICENSE がない場合は、利用・再配布前にリポジトリ管理者に確認してください。

## 開発メモ

- 写真はブラウザ内に圧縮保存されます。大量の高解像度画像は端末の容量・メモリに注意してください。
- PDF は画面を画像化して作るため、プレビューと完全一致しない場合があります。問題があれば Issue で知らせてください。
