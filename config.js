// ============================================================
// Supabase 設定
// ============================================================
// 1. https://supabase.com でプロジェクトを作成
// 2. Settings > API から URL と anon key を取得
// 3. 下記に貼り付けてください

const SUPABASE_URL = 'YOUR_SUPABASE_URL';      // 例: https://xxxx.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // 例: eyJhbGci...

// ============================================================
// 管理者パスワード
// ============================================================
// ※ 本番環境ではサーバーサイドで認証することを推奨します
// GitHub Pages のような静的サイトでは簡易認証として利用
const ADMIN_PASSWORD = 'music2024'; // ← ここを変更してください

// ============================================================
// Supabase Storage バケット名
// ============================================================
const STORAGE_AUDIO_BUCKET = 'audio';
const STORAGE_IMAGE_BUCKET = 'instrument-images';
