# 🎵 Music Library Manager

楽器・楽譜を管理するWebアプリです。
GitHub Pages（無料）でホスティングし、Supabase（無料）でデータ管理します。

---

## 📁 ファイル構成

```
music-manager/
├── index.html    # メインHTML
├── style.css     # スタイル（深緑テーマ）
├── app.js        # アプリロジック
├── config.js     # Supabase設定（★要変更）
├── schema.sql    # DBテーブル作成SQL
└── README.md     # この説明書
```

---

## 🚀 セットアップ手順

### Step 1: Supabaseプロジェクト作成

1. [https://supabase.com](https://supabase.com) にアクセス
2. 「Start your project」→ GitHubアカウントでログイン
3. 「New project」→ プロジェクト名・リージョン（Northeast Asia）・DBパスワードを設定
4. プロジェクト作成を待つ（1〜2分）

### Step 2: データベース作成

1. 左メニュー「SQL Editor」を開く
2. `schema.sql` の内容をすべてコピー＆ペースト
3. 「RUN」ボタンで実行

### Step 3: Storageバケット作成

1. 左メニュー「Storage」を開く
2. 「New bucket」で以下を作成：
   - 名前：`audio`　→ Public にチェック ✅
   - 名前：`instrument-images`　→ Public にチェック ✅

### Step 4: APIキーを取得

1. 左メニュー「Settings」→「API」
2. 以下をコピー：
   - **Project URL**（例：`https://xxxx.supabase.co`）
   - **anon public key**（`eyJhbGci...` で始まる長い文字列）

### Step 5: config.js を編集

```js
const SUPABASE_URL = 'https://xxxx.supabase.co';  // ← 貼り付け
const SUPABASE_ANON_KEY = 'eyJhbGci...';           // ← 貼り付け
const ADMIN_PASSWORD = 'your_password';             // ← 変更推奨
```

### Step 6: GitHub Pages でデプロイ

1. GitHubで新しいリポジトリを作成（例：`music-manager`）
2. このフォルダのファイルをすべてアップロード
3. リポジトリの「Settings」→「Pages」
4. Branch: `main` / Folder: `/ (root)` → 「Save」
5. しばらく待つと `https://ユーザー名.github.io/music-manager/` で公開 🎉

---

## 🔑 管理者機能の使い方

1. 右上の「管理者」ボタンをタップ
2. パスワードを入力（`config.js` の `ADMIN_PASSWORD`）
3. 管理パネルから楽器・楽譜の追加・編集・削除が可能

---

## 🖼️ 画像・音源のアップロード方法

1. Supabase Dashboard の「Storage」を開く
2. 対象バケット（`instrument-images` or `audio`）を選択
3. ファイルをドラッグ＆ドロップでアップロード
4. ファイルを右クリック →「Copy URL」でURLを取得
5. 管理パネルの編集フォームのURL欄に貼り付けて保存

---

## 📱 対応ページ

| ページ | 内容 |
|---|---|
| 楽器一覧 | 全楽器の表示・検索・詳細確認 |
| 楽譜一覧 | 全楽譜（野球応援除く）の表示 |
| 修理楽器 | 状態が「修理中」の楽器のみ表示 |
| 野球応援楽譜 | 野球応援フラグが立った楽譜のみ表示 |

---

## 🔧 今後の拡張案

- 楽譜PDFのプレビュー機能
- QRコード生成（楽器管理票）
- 貸し出し履歴管理
- 演奏会記録テーブル
- メンテナンス記録テーブル

---

## ⚠️ デモモード

`config.js` の `SUPABASE_URL` を変更しない場合、
サンプルデータで動作確認できます（データは保存されません）。
