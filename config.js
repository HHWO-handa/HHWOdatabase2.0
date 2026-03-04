// ============================================================
// Supabase 設定
// ============================================================
// 1. https://supabase.com でプロジェクトを作成
// 2. Settings > API から URL と anon key を取得
// 3. 下記に貼り付けてください

const SUPABASE_URL = 'https://wtwddyzbndsminakxuws.supabase.co';      // 例: https://xxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0d2RkeXpibmRzbWluYWt4dXdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0ODUwMzUsImV4cCI6MjA4ODA2MTAzNX0.ZlzEZE9VIyp8sKlCxY6bzzg0bynxKtNqrkkUUChOyRw'; // 例: eyJhbGci...

// ============================================================
// 管理者パスワード
// ============================================================
// ※ 本番環境ではサーバーサイドで認証することを推奨します
// GitHub Pages のような静的サイトでは簡易認証として利用
const ADMIN_PASSWORD = 'hhwo2026'; // ← ここを変更してください

// ============================================================
// Supabase Storage バケット名
// ============================================================
const STORAGE_IMAGE_BUCKET  = 'instrument-images';
const STORAGE_REPAIR_BUCKET = 'repair-photos';

// ============================================================
// リンク集（config.jsを直接編集して追加・変更してください）
// ============================================================
const LINKS = [
  { label: 'HHWOホームページ', url: 'https://hhwo2023.1web.jp/', icon: '' },
  { label: '愛知県吹奏楽連盟', url: 'https://aiba.cloud/aibaWEB.html', icon: '' },
  { label: '吹奏楽連盟',              url: 'https://www.ajba.or.jp/',         icon: '🎺' },
  // ← ここにリンクを追加してください
  // 例: { label: '楽器店サイト', url: 'https://example.com', icon: '🎸' },
];
