-- ============================================================
-- Music Library Manager - Supabase テーブル作成SQL
-- Supabase の SQL Editor に貼り付けて実行してください
-- ============================================================

-- 楽器テーブル
CREATE TABLE instruments (
  id             BIGSERIAL PRIMARY KEY,
  name           TEXT NOT NULL,              -- 楽器名
  type           TEXT,                       -- 種類（クラリネット、トランペット等）
  maker          TEXT,                       -- メーカー
  model          TEXT,                       -- モデル名
  purchase_date  DATE,                       -- 購入日
  price          INTEGER,                    -- 購入価格（円）
  status         TEXT DEFAULT '使用中',       -- 状態（使用中/保管中/修理中）
  owner          TEXT,                       -- 担当者・所有者
  image_url      TEXT,                       -- 楽器画像URL（Supabase Storage）
  notes          TEXT,                       -- 備考・メモ
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- 楽譜テーブル
CREATE TABLE scores (
  id              BIGSERIAL PRIMARY KEY,
  title           TEXT NOT NULL,             -- 曲名
  composer        TEXT,                      -- 作曲者
  instrumentation TEXT,                      -- 楽器編成
  audio_url       TEXT,                      -- 音源URL（Supabase Storage）
  tags            TEXT,                      -- タグ（カンマ区切り）
  genre           TEXT,                      -- ジャンル
  is_baseball     BOOLEAN DEFAULT false,     -- 野球応援楽譜フラグ
  notes           TEXT,                      -- 備考・メモ
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- updated_at 自動更新トリガー
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER instruments_updated_at
  BEFORE UPDATE ON instruments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER scores_updated_at
  BEFORE UPDATE ON scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security (RLS)
-- 読み取りは全員可、書き込みは anon キーで可（フロントから操作）
-- ※ より厳密にしたい場合は認証ユーザーのみに変更
-- ============================================================
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- 読み取り：誰でも可
CREATE POLICY "public read instruments" ON instruments FOR SELECT USING (true);
CREATE POLICY "public read scores" ON scores FOR SELECT USING (true);

-- 書き込み：anon（管理者パスワード確認後フロントから操作）
CREATE POLICY "anon write instruments" ON instruments
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon write scores" ON scores
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Supabase Storage バケット作成
-- Supabase Dashboard > Storage で手動作成してください
-- ============================================================
-- バケット名: audio          （音源ファイル用、Public）
-- バケット名: instrument-images  （楽器画像用、Public）
