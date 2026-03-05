// ============================================================
// Supabase クライアント初期化
// ============================================================
const { createClient } = supabase;
let db;
try {
  db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch(e) {
  console.warn('Supabaseと接続できませんでした。デモデータで動作します。');
}

// ============================================================
// デモデータ
// ============================================================
const DEMO_INSTRUMENTS = [
  { id:1, instnumber:103001, qr:'QR-001', instcode:'CL-001', name:'正しく起動できませんでした', maker:'Buffet Crampon', model:'R13', purchase_date:'2020-04-01', owner:'田中 花子', equipcode:'EQ-001', image_url:null, notes:'リードは3番を使用。' },
  { id:2, instnumber:104002, qr:'QR-002', instcode:'SAX-001', name:'104002 SAX-001', maker:'Yamaha', model:'YTS-82Z', purchase_date:'2019-09-15', owner:'鈴木 一郎', equipcode:'EQ-002', image_url:null, notes:'定期メンテナンス済み（2023年10月）' },
  { id:3, instnumber:203003, qr:'QR-003', instcode:'TP-001', name:'203003 TP-001', maker:'Bach', model:'Stradivarius 37', purchase_date:'2021-03-20', owner:'佐藤 次郎', equipcode:'EQ-003', image_url:null, notes:'バルブ不調のため修理依頼中。' },
];
const DEMO_SCORES = [
  { id:1, scorenumber:1, jatitle:'正しく起動できませんでした', entitle:'Takarajima', jahititle:'たからじま', composer:'和泉宏隆', artist:'T-SQUARE', hiragana:'た', alphabet:'T', instrumentation:'吹奏楽フルバンド', tags:'ポップス,定番', asyear:null, is_baseball:false, notes:'定期演奏会のメイン曲。' },
  { id:2, scorenumber:2, jatitle:'アルヴァマー序曲', entitle:'Alvamar Overture', jahititle:'あるヴぁまーじょきょく', composer:'James Barnes', artist:'', hiragana:'あ', alphabet:'A', instrumentation:'吹奏楽フルバンド', tags:'コンクール,Classic', asyear:null, is_baseball:false, notes:'コンクールA部門用。' },
  { id:3, scorenumber:3, jatitle:'VICTORY（応援歌）', entitle:'VICTORY', jahititle:'びくとりー', composer:'編曲：山田太郎', artist:'', hiragana:'ひ', alphabet:'V', instrumentation:'吹奏楽', tags:'野球,応援', asyear:null, is_baseball:true, notes:'攻撃時に演奏' },
];
const DEMO_REPAIRS = [
  { id:1, repair_id:'RPR-A1B2C3D4', instnumber:203003, qr:'QR-003', instcode:'TP-001', status:'違和感による修理', repair_content:'バルブの動きが重く感じる', repair_photo:null, repair_date:'2024-01-15' },
  { id:2, repair_id:'RPR-E5F6G7H8', instnumber:104002, qr:'QR-002', instcode:'SAX-001', status:'定期点検', repair_content:'年次点検', repair_photo:null, repair_date:'2023-10-20' },
];

// ============================================================
// 状態管理
// ============================================================
let currentPage = 'instruments';
let isAdmin = false;
let allInstruments = [];
let allScores = [];
let allRepairs = [];

// QRスキャナー（モード: 'search' | 'repair_form'）
let qrStream = null;
let qrAnimFrame = null;
let qrMode = 'search';

// 管理者パネル検索（入力確定後に検索するためのタイマー）
let adminSearchQuery = '';
let adminSearchTimer = null;

// ============================================================
// 初期化
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  renderPage();
  setupSearch();
  renderSideMenu();
});

// ============================================================
// データ読み込み
// ============================================================
async function loadData() {
  if (!db || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    allInstruments = DEMO_INSTRUMENTS;
    allScores = DEMO_SCORES;
    allRepairs = DEMO_REPAIRS;
    return;
  }
  const [r1, r2, r3] = await Promise.all([
    db.from('instruments').select('*').order('instnumber'),
    db.from('scores').select('*').order('scorenumber'),
    db.from('repairs').select('*').order('created_at', { ascending: false }),
  ]);
  if (r1.error) console.error('instruments:', r1.error);
  if (r2.error) console.error('scores:', r2.error);
  if (r3.error) console.error('repairs:', r3.error);
  allInstruments = r1.data || [];
  allScores = r2.data || [];
  allRepairs = r3.data || [];
}

// ============================================================
// サイドメニュー
// ============================================================
function renderSideMenu() {
  // 統計
  document.getElementById('stat-instruments').textContent = allInstruments.length;
  document.getElementById('stat-scores').textContent = allScores.length;
  const maxScore = allScores.reduce((max, s) => Math.max(max, s.scorenumber || 0), 0);
  document.getElementById('stat-last-score').textContent = maxScore || '—';

  // リンク集（config.jsのLINKS配列から生成）
  const linksList = document.getElementById('linksList');
  if (typeof LINKS !== 'undefined' && LINKS.length > 0) {
    linksList.innerHTML = LINKS.map(link => `
      <a href="${esc(link.url)}" target="_blank" rel="noopener" class="link-item">
        <span class="link-icon">${link.icon || '🔗'}</span>
        <span class="link-label">${esc(link.label)}</span>
        <span class="link-arrow">›</span>
      </a>
    `).join('');
  } else {
    linksList.innerHTML = '<p style="color:var(--text-muted);font-size:13px;padding:8px 0">config.jsのLINKS配列にリンクを追加してください</p>';
  }
}

function toggleSideMenu() {
  const menu = document.getElementById('sideMenu');
  const overlay = document.getElementById('sideOverlay');
  const isOpen = menu.classList.contains('open');
  if (isOpen) {
    closeSideMenu();
  } else {
    // 統計を最新に更新してから開く
    renderSideMenu();
    menu.classList.add('open');
    overlay.classList.add('open');
    document.getElementById('hamburgerBtn').classList.add('open');
  }
}

function closeSideMenu() {
  document.getElementById('sideMenu').classList.remove('open');
  document.getElementById('sideOverlay').classList.remove('open');
  document.getElementById('hamburgerBtn').classList.remove('open');
}

// ============================================================
// ページ切り替え
// ============================================================
function switchPage(page) {
  currentPage = page;
  document.querySelectorAll('.nav-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.page === page)
  );
  document.getElementById('searchInput').value = '';
  document.getElementById('repairAddBtn').style.display =
    page === 'repair' ? 'flex' : 'none';
  document.getElementById('qrBtn').style.display =
    (page === 'instruments' || page === 'repair') ? 'flex' : 'none';
  renderPage();
}

// ============================================================
// ページ描画
// ============================================================
function renderPage() {
  const titles = {
    instruments: { title: '楽器一覧',        sub: '所有する楽器を管理します' },
    scores:      { title: '楽譜一覧',        sub: '所有する楽譜を管理します' },
    repair:      { title: '修理記録',         sub: '修理・点検の記録を管理します' },
    baseball:    { title: '野球応援楽譜一覧', sub: '野球応援で使用する楽譜' },
  };
  const t = titles[currentPage];
  document.getElementById('pageTitle').textContent = t.title;
  document.getElementById('pageSubtitle').textContent = t.sub;

  const query = document.getElementById('searchInput').value.toLowerCase();
  switch(currentPage) {
    case 'instruments': renderInstrumentsTable(allInstruments, query); break;
    case 'scores':      renderScoresTable(allScores.filter(s => !s.is_baseball), query); break;
    case 'repair':      renderRepairsTable(allRepairs, query); break;
    case 'baseball':    renderScoresTable(allScores.filter(s => s.is_baseball), query); break;
  }
}

// ============================================================
// 楽器テーブル描画（サムネイル付き）
// ============================================================
function renderInstrumentsTable(data, query = '') {
  const filtered = query ? data.filter(i =>
    (i.name||'').toLowerCase().includes(query) ||
    (i.instcode||'').toLowerCase().includes(query) ||
    (i.maker||'').toLowerCase().includes(query) ||
    (i.owner||'').toLowerCase().includes(query) ||
    (i.equipcode||'').toLowerCase().includes(query) ||
    (i.qr||'').toLowerCase().includes(query) ||
    String(i.instnumber||'').includes(query)
  ) : data;

  const container = document.getElementById('tableContainer');
  const empty = document.getElementById('emptyState');
  if (filtered.length === 0) { container.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  container.innerHTML = `
    <table class="data-table">
      <thead><tr>
        <th style="width:44px"></th>
        <th>楽器番号</th>
        <th>楽器名</th>
        <th class="hide-mobile">楽器コード</th>
        <th class="hide-mobile">所有元</th>
        <th></th>
      </tr></thead>
      <tbody>
        ${filtered.map(i => `
          <tr onclick="openInstrumentDetail(${i.id})">
            <td class="thumb-cell">
              ${i.image_url
                ? `<img src="${esc(i.image_url)}" class="row-thumb" onerror="this.style.display='none'">`
                : `<div class="row-thumb-placeholder">🎷</div>`}
            </td>
            <td class="muted" style="font-family:var(--font-mono);font-size:12px;white-space:nowrap">${esc(String(i.instnumber||''))}</td>
            <td>
              <div style="font-weight:500">${esc(i.name||'')}</div>
              <div style="font-size:12px;color:var(--text-muted)">${esc(i.maker||'')} ${esc(i.model||'')}</div>
            </td>
            <td class="muted hide-mobile" style="font-family:var(--font-mono);font-size:12px">${esc(i.instcode||'-')}</td>
            <td class="muted hide-mobile">${esc(i.owner||'-')}</td>
            <td class="row-arrow">›</td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

// ============================================================
// 楽譜テーブル描画
// ============================================================
function renderScoresTable(data, query = '') {
  const filtered = query ? data.filter(s =>
    (s.jatitle||'').toLowerCase().includes(query) ||
    (s.entitle||'').toLowerCase().includes(query) ||
    (s.jahititle||'').toLowerCase().includes(query) ||
    (s.composer||'').toLowerCase().includes(query) ||
    (s.artist||'').toLowerCase().includes(query) ||
    (s.tags||'').toLowerCase().includes(query) ||
    String(s.scorenumber||'').includes(query)
  ) : data;

  const container = document.getElementById('tableContainer');
  const empty = document.getElementById('emptyState');
  if (filtered.length === 0) { container.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  container.innerHTML = `
    <table class="data-table">
      <thead><tr>
        <th>No.</th><th>曲名</th>
        <th class="hide-mobile">作曲者 / アーティスト</th>
        <th class="hide-mobile">編成</th><th></th>
      </tr></thead>
      <tbody>
        ${filtered.map(s => `
          <tr onclick="openScoreDetail(${s.id})">
            <td class="muted" style="font-family:var(--font-mono);font-size:12px;white-space:nowrap">${esc(String(s.scorenumber||''))}</td>
            <td>
              <div style="font-weight:500">${esc(s.jatitle)}</div>
              <div style="font-size:12px;color:var(--text-muted)">${esc(s.entitle||'')}</div>
            </td>
            <td class="muted hide-mobile">
              <div>${esc(s.composer||'-')}</div>
              ${s.artist ? `<div style="font-size:12px">${esc(s.artist)}</div>` : ''}
            </td>
            <td class="muted hide-mobile">${esc(s.instrumentation||'-')}</td>
            <td class="row-arrow">›</td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

// ============================================================
// 修理テーブル描画（サムネイル付き）
// ============================================================
const REPAIR_STATUS_MAP = {
  '破損による修理':   'badge-repair',
  '違和感による修理': 'badge-warn',
  '原因不明の問題':   'badge-unknown',
  'その他修理':       'badge-storage',
  '定期点検':         'badge-check',
  'その他':           'badge-storage',
};

function renderRepairsTable(data, query = '') {
  const filtered = query ? data.filter(r =>
    (r.repair_id||'').toLowerCase().includes(query) ||
    (r.instcode||'').toLowerCase().includes(query) ||
    (r.qr||'').toLowerCase().includes(query) ||
    (r.status||'').toLowerCase().includes(query) ||
    (r.repair_content||'').toLowerCase().includes(query) ||
    String(r.instnumber||'').includes(query)
  ) : data;

  const container = document.getElementById('tableContainer');
  const empty = document.getElementById('emptyState');
  if (filtered.length === 0) { container.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  container.innerHTML = `
    <table class="data-table">
      <thead><tr>
        <th style="width:44px"></th>
        <th>修理ID</th><th>楽器No.</th><th>状態</th>
        <th class="hide-mobile">修理日</th><th></th>
      </tr></thead>
      <tbody>
        ${filtered.map(r => {
          const inst = allInstruments.find(i =>
            String(i.instnumber) === String(r.instnumber) || i.qr === r.qr
          );
          const imgUrl = inst?.image_url || null;
          const instName = inst?.name || '-';
          return `
          <tr onclick="openRepairDetail(${r.id})">
            <td class="thumb-cell">
              ${imgUrl
                ? `<img src="${esc(imgUrl)}" class="row-thumb" onerror="this.style.display='none'">`
                : `<div class="row-thumb-placeholder">🔧</div>`}
            </td>
            <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${esc(r.repair_id||'')}</td>
            <td>
              <div style="font-weight:500">#${esc(String(r.instnumber||'-'))}</div>
              <div style="font-size:11px;color:var(--text-muted)">${esc(instName)}</div>
            </td>
            <td><span class="badge ${REPAIR_STATUS_MAP[r.status]||'badge-storage'}">${esc(r.status||'-')}</span></td>
            <td class="muted hide-mobile">${formatDate(r.repair_date)}</td>
            <td class="row-arrow">›</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

// ============================================================
// 詳細モーダル
// ============================================================
function openInstrumentDetail(id) {
  const item = allInstruments.find(i => i.id === id);
  if (!item) return;
  const imageHtml = item.image_url ? `<img src="${esc(item.image_url)}" class="detail-image" onerror="this.style.display='none'">` : '';
  const noteHtml = item.notes ? `<div class="detail-note">${esc(item.notes)}</div>` : '<span style="color:var(--text-muted)">なし</span>';
  document.getElementById('modalContent').innerHTML = `
    <div class="detail-header">
      <div class="detail-category">楽器 #${esc(String(item.instnumber||''))}</div>
      <div class="detail-title">${esc(item.name||'')}</div>
    </div>
    ${imageHtml}
    <div class="detail-grid">
      <div class="detail-item"><span class="detail-label">楽器コード</span><span class="detail-value mono">${esc(item.instcode||'-')}</span></div>
      <div class="detail-item"><span class="detail-label">備品番号</span><span class="detail-value mono">${esc(item.equipcode||'-')}</span></div>
      <div class="detail-item"><span class="detail-label">QRコード</span><span class="detail-value mono">${esc(item.qr||'-')}</span></div>
      <div class="detail-item"><span class="detail-label">メーカー</span><span class="detail-value">${esc(item.maker||'-')}</span></div>
      <div class="detail-item"><span class="detail-label">モデル</span><span class="detail-value">${esc(item.model||'-')}</span></div>
      <div class="detail-item"><span class="detail-label">所有元</span><span class="detail-value">${esc(item.owner||'-')}</span></div>
      <div class="detail-item"><span class="detail-label">購入日</span><span class="detail-value mono">${formatDate(item.purchase_date)}</span></div>
    </div>
    <div class="detail-item"><span class="detail-label">備考・メモ</span>${noteHtml}</div>`;
  openModal();
}

function openScoreDetail(id) {
  const item = allScores.find(s => s.id === id);
  if (!item) return;
  const tagsHtml = item.tags
    ? item.tags.split(',').map(t => `<span class="badge badge-genre">${esc(t.trim())}</span>`).join('')
    : '<span style="color:var(--text-muted)">なし</span>';
  const noteHtml = item.notes ? `<div class="detail-note">${esc(item.notes)}</div>` : '<span style="color:var(--text-muted)">なし</span>';
  document.getElementById('modalContent').innerHTML = `
    <div class="detail-header">
      <div class="detail-category">${item.is_baseball ? '⚾ 野球応援楽譜' : '🎵 楽譜'} #${esc(String(item.scorenumber||''))}</div>
      <div class="detail-title">${esc(item.jatitle)}</div>
      ${item.entitle ? `<div style="font-size:14px;color:var(--text-muted);margin-top:4px">${esc(item.entitle)}</div>` : ''}
      ${item.jahititle ? `<div style="font-size:12px;color:var(--text-muted)">${esc(item.jahititle)}</div>` : ''}
    </div>
    <div class="detail-grid">
      <div class="detail-item"><span class="detail-label">作曲者</span><span class="detail-value">${esc(item.composer||'-')}</span></div>
      <div class="detail-item"><span class="detail-label">アーティスト</span><span class="detail-value">${esc(item.artist||'-')}</span></div>
      <div class="detail-item"><span class="detail-label">50音索引</span><span class="detail-value mono">${esc(item.hiragana||'-')}</span></div>
      <div class="detail-item"><span class="detail-label">アルファベット索引</span><span class="detail-value mono">${esc(item.alphabet||'-')}</span></div>
      ${item.asyear ? `<div class="detail-item"><span class="detail-label">課題曲年</span><span class="detail-value mono">${esc(String(item.asyear))}</span></div>` : ''}
      <div class="detail-item full"><span class="detail-label">楽器編成</span><span class="detail-value">${esc(item.instrumentation||'-')}</span></div>
      <div class="detail-item full"><span class="detail-label">タグ</span><div class="tag-list">${tagsHtml}</div></div>
    </div>
    <div class="detail-item"><span class="detail-label">備考・メモ</span>${noteHtml}</div>`;
  openModal();
}

function openRepairDetail(id) {
  const item = allRepairs.find(r => r.id === id);
  if (!item) return;
  const inst = allInstruments.find(i => String(i.instnumber) === String(item.instnumber) || i.qr === item.qr);
  const photoHtml = item.repair_photo ? `<img src="${esc(item.repair_photo)}" class="detail-image" onerror="this.style.display='none'">` : '';
  const noteHtml = item.repair_content ? `<div class="detail-note">${esc(item.repair_content)}</div>` : '<span style="color:var(--text-muted)">なし</span>';
  document.getElementById('modalContent').innerHTML = `
    <div class="detail-header">
      <div class="detail-category">🔧 修理記録</div>
      <div class="detail-title" style="font-size:16px;font-family:var(--font-mono)">${esc(item.repair_id||'')}</div>
    </div>
    ${photoHtml}
    <div class="detail-grid">
      <div class="detail-item"><span class="detail-label">楽器No.</span><span class="detail-value mono">${esc(String(item.instnumber||'-'))}</span></div>
      <div class="detail-item"><span class="detail-label">楽器名</span><span class="detail-value">${esc(inst?.name||'-')}</span></div>
      <div class="detail-item"><span class="detail-label">QRコード</span><span class="detail-value mono">${esc(item.qr||'-')}</span></div>
      <div class="detail-item"><span class="detail-label">楽器コード</span><span class="detail-value mono">${esc(item.instcode||'-')}</span></div>
      <div class="detail-item full">
        <span class="detail-label">状態</span>
        <span class="badge ${REPAIR_STATUS_MAP[item.status]||'badge-storage'}" style="margin-top:4px">${esc(item.status||'-')}</span>
      </div>
      <div class="detail-item"><span class="detail-label">修理日</span><span class="detail-value mono">${formatDate(item.repair_date)}</span></div>
    </div>
    <div class="detail-item"><span class="detail-label">修理内容・備考</span>${noteHtml}</div>`;
  openModal();
}

function openModal()  { document.getElementById('modalOverlay').classList.add('open'); }
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }

// ============================================================
// 管理者認証
// ============================================================
document.getElementById('adminBtn').addEventListener('click', () => {
  if (isAdmin) { openAdminPanel(); }
  else {
    document.getElementById('authOverlay').classList.add('open');
    setTimeout(() => document.getElementById('authInput').focus(), 100);
  }
});

function checkAuth() {
  const input = document.getElementById('authInput').value;
  if (input === ADMIN_PASSWORD) {
    isAdmin = true;
    document.getElementById('authOverlay').classList.remove('open');
    document.getElementById('authInput').value = '';
    document.getElementById('authError').textContent = '';
    document.getElementById('adminBtn').textContent = '⚙️ 管理者';
    openAdminPanel();
  } else {
    document.getElementById('authError').textContent = 'パスワードが違います';
    document.getElementById('authInput').value = '';
    document.getElementById('authInput').focus();
  }
}

function closeAuth() {
  document.getElementById('authOverlay').classList.remove('open');
  document.getElementById('authInput').value = '';
  document.getElementById('authError').textContent = '';
}

// ============================================================
// 管理者パネル（検索：300ms debounce で入力を妨げない）
// ============================================================
function openAdminPanel() {
  adminSearchQuery = '';
  renderAdminPanel();
  document.getElementById('adminPanelOverlay').classList.add('open');
}

function renderAdminPanel() {
  const isRepairPage     = currentPage === 'repair';
  const isInstrumentPage = currentPage === 'instruments' || isRepairPage;
  let type, data, titleLabel;

  if (isRepairPage) {
    type = 'repair'; data = allRepairs; titleLabel = '修理記録';
  } else if (isInstrumentPage) {
    type = 'instrument'; data = allInstruments; titleLabel = '楽器';
  } else {
    type = 'score';
    data = allScores.filter(s => currentPage === 'baseball' ? s.is_baseball : !s.is_baseball);
    titleLabel = '楽譜';
  }

  const q = adminSearchQuery.toLowerCase();
  const filtered = q ? data.filter(item => {
    if (type === 'instrument') return (item.name||'').toLowerCase().includes(q) || String(item.instnumber||'').includes(q) || (item.instcode||'').toLowerCase().includes(q);
    if (type === 'score')      return (item.jatitle||'').toLowerCase().includes(q) || String(item.scorenumber||'').includes(q);
    if (type === 'repair')     return (item.repair_id||'').toLowerCase().includes(q) || String(item.instnumber||'').includes(q) || (item.status||'').toLowerCase().includes(q);
    return true;
  }) : data;

  const rows = filtered.map(item => {
    const label = type === 'instrument' ? (item.name||'') : type === 'score' ? item.jatitle : item.repair_id;
    const sub   = type === 'instrument' ? String(item.instnumber||'') : type === 'score' ? String(item.scorenumber||'') : (item.status||'');
    return `<tr>
      <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${esc(sub)}</td>
      <td>${esc(label)}</td>
      <td><div class="action-btns">
        ${type !== 'repair' ? `<button class="edit-btn" onclick="openEditForm('${type}',${item.id})">編集</button>` : ''}
        <button class="delete-btn" onclick="deleteItem('${type}',${item.id})">削除</button>
      </div></td>
    </tr>`;
  }).join('');

  document.getElementById('adminContent').innerHTML = `
    <div class="admin-header">
      <h2 class="admin-title">${titleLabel}管理</h2>
      ${type !== 'repair' ? `<button class="add-btn" onclick="openAddForm('${type}')">＋ 追加</button>` : ''}
    </div>
    <div class="admin-search-wrap">
      <input type="text" class="admin-search-input"
        placeholder="検索..."
        value="${esc(adminSearchQuery)}"
        id="adminSearchInput"
        oninput="onAdminSearchInput(this.value)"
        onkeydown="if(event.key==='Enter'){clearTimeout(adminSearchTimer);adminSearchQuery=this.value;renderAdminPanel();}">
      <span class="admin-search-icon">🔍</span>
    </div>
    <div style="overflow-x:auto">
      <table class="admin-table">
        <thead><tr>
          <th>${type === 'repair' ? 'ID' : 'No.'}</th>
          <th>${type === 'instrument' ? '楽器名' : type === 'score' ? '曲名' : '修理ID'}</th>
          <th>操作</th>
        </tr></thead>
        <tbody>${rows || '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:20px">データなし</td></tr>'}</tbody>
      </table>
    </div>`;

  // 再描画後にフォーカスを戻す（検索欄が消えないように）
  const inp = document.getElementById('adminSearchInput');
  if (inp && adminSearchQuery) {
    inp.focus();
    inp.setSelectionRange(inp.value.length, inp.value.length);
  }
}

// debounce: 500ms 待ってから検索実行（途中入力を妨げない）
function onAdminSearchInput(value) {
  clearTimeout(adminSearchTimer);
  adminSearchTimer = setTimeout(() => {
    adminSearchQuery = value;
    renderAdminPanel();
  }, 500);
}

function closeAdminPanel() {
  document.getElementById('adminPanelOverlay').classList.remove('open');
}

// ============================================================
// フォーム
// ============================================================
function openAddForm(type)      { renderForm(type, null); }
function openEditForm(type, id) {
  const item = type === 'instrument' ? allInstruments.find(i => i.id === id)
             : type === 'score'      ? allScores.find(s => s.id === id)
             :                         allRepairs.find(r => r.id === id);
  renderForm(type, item);
}
function renderForm(type, item) {
  document.getElementById('formContent').innerHTML =
    type === 'instrument' ? instrumentForm(item)
    : type === 'score'    ? scoreForm(item)
    :                        repairForm(item);
  document.getElementById('formOverlay').classList.add('open');
}
function openRepairForm(item) { renderForm('repair', item); }
function closeForm() { document.getElementById('formOverlay').classList.remove('open'); }

// ============================================================
// 楽器フォーム
// ============================================================
function instrumentForm(item) {
  const v = f => item ? esc(String(item[f] ?? '')) : '';
  return `
    <h2 class="form-title">${item ? '楽器を編集' : '楽器を追加'}</h2>
    <input type="hidden" id="formId" value="${item ? item.id : ''}">

    <div class="form-group">
      <label class="form-label required">楽器番号（6桁）</label>
      <div class="instnumber-row">
        <div class="instnumber-part">
          <label class="instnumber-sublabel">①種類<br><span style="font-size:10px;color:var(--text-muted)">1桁目</span></label>
          <input type="number" class="form-input instnumber-input" id="f_inst_type"
            value="${item ? Math.floor(parseInt(String(item.instnumber||'0').padStart(6,'0').slice(0,1))) : ''}"
            min="0" max="9" placeholder="例：1"
            oninput="onInstTypeInput(this.value)">
        </div>
        <div class="instnumber-sep">—</div>
        <div class="instnumber-part">
          <label class="instnumber-sublabel">②種類内順番<br><span style="font-size:10px;color:var(--text-muted)">2-3桁目</span></label>
          <input type="number" class="form-input instnumber-input" id="f_inst_seq"
            value="${item ? parseInt(String(item.instnumber||'000000').padStart(6,'0').slice(1,3)) : ''}"
            min="0" max="99" placeholder="自動">
        </div>
        <div class="instnumber-sep">—</div>
        <div class="instnumber-part">
          <label class="instnumber-sublabel">③全体順番<br><span style="font-size:10px;color:var(--text-muted)">4-6桁目</span></label>
          <input type="number" class="form-input instnumber-input" id="f_inst_total"
            value="${item ? parseInt(String(item.instnumber||'000000').padStart(6,'0').slice(3,6)) : ''}"
            min="0" max="999" placeholder="自動">
        </div>
      </div>
      <div class="instnumber-preview-wrap">
        <span style="font-size:12px;color:var(--text-muted)">楽器番号プレビュー：</span>
        <span class="instnumber-preview" id="instnumber-preview">——</span>
      </div>
      <p class="form-file-hint">① 1桁を入力すると②③が自動計算されます。手動修正も可能です。</p>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">楽器コード</label>
        <input type="text" class="form-input" id="f_instcode" value="${v('instcode')}"
          placeholder="例：CL-001" oninput="updateInstName()">
      </div>
      <div class="form-group">
        <label class="form-label">QRコード（自動入力）</label>
        <input type="text" class="form-input" id="f_qr" value="${v('qr')}" placeholder="">
      </div>
    </div>

    <div class="form-group">
      <label class="form-label required">楽器名 <span style="font-size:11px;font-weight:400;color:var(--text-muted)"></span></label>
      <input type="text" class="form-input" id="f_name" value="${v('name')}"
        placeholder="例：フルート5">
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">メーカー</label>
        <input type="text" class="form-input" id="f_maker" value="${v('maker')}" placeholder="例：YAMAHA">
      </div>
      <div class="form-group">
        <label class="form-label">モデル</label>
        <input type="text" class="form-input" id="f_model" value="${v('model')}" placeholder="例：YCL-650">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">購入日</label>
        <input type="date" class="form-input" id="f_purchase_date" value="${v('purchase_date')}">
      </div>
      <div class="form-group">
        <label class="form-label">備品番号</label>
        <input type="text" class="form-input" id="f_equipcode" value="${v('equipcode')}" placeholder="例：1234567 1234 1234567">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">担当者・所有者</label>
      <select class="form-select" id="f_maker">
          <option value="">-- 選択 --</option>
          <option value="学校備品" selected>学校備品</option>
          <option value="ばらさのグッズ">ばらさのグッズ</option>
          <option value="寄付・寄贈">寄付・寄贈</option>
          <option value="その他">その他</option>
        </select>
    </div>

    <div class="form-group">
      <label class="form-label">楽器画像</label>
      <div class="image-upload-area">
        <div id="imagePreviewWrap">
          ${item?.image_url
            ? `<img src="${esc(item.image_url)}" class="image-preview" onerror="this.style.display='none'">`
            : `<div class="image-preview-placeholder">画像未設定</div>`}
        </div>
        <div class="image-upload-btns">
          <label class="upload-file-btn">
            📁 ファイルを選択してアップロード
            <input type="file" id="f_image_file" accept="image/*" style="display:none"
              onchange="handleImageSelect(event,'instrument')">
          </label>
        </div>
        <input type="text" class="form-input" id="f_image_url" value="${v('image_url')}"
          placeholder="またはURLを直接入力"
          oninput="previewImageUrl(this.value,'imagePreviewWrap')" style="margin-top:8px">
        <div id="uploadStatus" class="upload-status"></div>
      </div>
      <p class="form-file-hint">📌 ファイル選択でSupabase Storageに自動アップロードされます</p>
    </div>

    <div class="form-group">
      <label class="form-label">備考・メモ</label>
      <textarea class="form-textarea" id="f_notes" placeholder="自由記述...">${v('notes')}</textarea>
    </div>
    <div class="form-actions">
      <button class="cancel-btn" onclick="closeForm()">キャンセル</button>
      <button class="submit-btn" onclick="saveInstrument()">保存</button>
    </div>`;
}

// ============================================================
// 楽器番号 自動計算ロジック
// ============================================================
// 1桁目（種類）を入力したとき
function onInstTypeInput(typeVal) {
  const type = parseInt(typeVal);
  if (isNaN(type) || typeVal === '') {
    document.getElementById('f_inst_seq').value = '';
    document.getElementById('f_inst_total').value = '';
    updateInstnumberPreview();
    return;
  }

  // 同じ種類（1桁目）を持つ楽器を検索
  const sameType = allInstruments.filter(i => {
    const s = String(i.instnumber || '').padStart(6, '0');
    return parseInt(s[0]) === type;
  });

  // 2-3桁目（種類内順番）の最大値 + 1
  const maxSeq = sameType.reduce((max, i) => {
    const s = String(i.instnumber || '').padStart(6, '0');
    return Math.max(max, parseInt(s.slice(1, 3)));
  }, 0);
  document.getElementById('f_inst_seq').value = maxSeq + 1;

  // 4-6桁目（全体順番）の最大値 + 1
  const maxTotal = allInstruments.reduce((max, i) => {
    const s = String(i.instnumber || '').padStart(6, '0');
    return Math.max(max, parseInt(s.slice(3, 6)));
  }, 0);
  document.getElementById('f_inst_total').value = maxTotal + 1;

  updateInstnumberPreview();
  updateInstName();
}

// 入力変更時にプレビューを更新
document.addEventListener('input', e => {
  if (['f_inst_seq','f_inst_total'].includes(e.target?.id)) {
    updateInstnumberPreview();
    updateInstName();
  }
});

function getInstnumberValue() {
  const typeVal  = document.getElementById('f_inst_type')?.value  || '';
  const seqVal   = document.getElementById('f_inst_seq')?.value   || '';
  const totalVal = document.getElementById('f_inst_total')?.value || '';
  if (!typeVal) return null;
  const type  = String(parseInt(typeVal)).slice(0,1);
  const seq   = String(parseInt(seqVal)   || 0).padStart(2, '0');
  const total = String(parseInt(totalVal) || 0).padStart(3, '0');
  return parseInt(`${type}${seq}${total}`);
}

function updateInstnumberPreview() {
  const val = getInstnumberValue();
  const el = document.getElementById('instnumber-preview');
  if (el) el.textContent = val !== null ? String(val).padStart(6, '0') : '——';
}

// 楽器名を「instnumber instcode」形式で自動生成
function updateInstName() {
  const instNum = getInstnumberValue();
  const instcode = (document.getElementById('f_instcode')?.value || '').trim();
  const nameField = document.getElementById('f_qr');
  if (!nameField) return;
  const numStr = instNum !== null ? String(instNum).padStart(6, '0') : '';
  if (numStr || instcode) {
    nameField.value = [numStr, instcode].filter(Boolean).join(' ');
  }
}

// ============================================================
// 楽譜フォーム
// ============================================================
function scoreForm(item) {
  const v = f => item ? esc(String(item[f] ?? '')) : '';
  return `
    <h2 class="form-title">${item ? '楽譜を編集' : '楽譜を追加'}</h2>
    <input type="hidden" id="formId" value="${item ? item.id : ''}">
    <div class="form-group">
      <label class="form-label required">楽譜番号</label>
      <input type="number" class="form-input" id="f_scorenumber" value="${v('scorenumber')}" placeholder="例：1">
    </div>
    <div class="form-group">
      <label class="form-label required">曲名（日本語）</label>
      <input type="text" class="form-input" id="f_jatitle" value="${v('jatitle')}" placeholder="例：宝島">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label required">曲名（英語）</label>
        <input type="text" class="form-input" id="f_entitle" value="${v('entitle')}" placeholder="例：Takarajima">
      </div>
      <div class="form-group">
        <label class="form-label required">曲名（ひらがな）</label>
        <input type="text" class="form-input" id="f_jahititle" value="${v('jahititle')}" placeholder="例：たからじま">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">作曲者</label>
        <input type="text" class="form-input" id="f_composer" value="${v('composer')}" placeholder="例：和泉宏隆">
      </div>
      <div class="form-group">
        <label class="form-label">アーティスト</label>
        <input type="text" class="form-input" id="f_artist" value="${v('artist')}" placeholder="例：T-SQUARE">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">50音索引</label>
        <input type="text" class="form-input" id="f_hiragana" value="${v('hiragana')}" placeholder="例：た">
      </div>
      <div class="form-group">
        <label class="form-label">アルファベット索引</label>
        <input type="text" class="form-input" id="f_alphabet" value="${v('alphabet')}" placeholder="例：T(半角大文字)">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">楽器編成</label>
        <select class="form-select" id="f_maker">
          <option value="">-- 選択 --</option>
          <option value="吹奏楽" selected>吹奏楽</option>
          <option value="木管">木管</option>
          <option value="金管">金管</option>
          <option value="打楽器">打楽器</option>
          <option value="フルート">フルート</option>
          <option value="クラリネット">クラリネット</option>
          <option value="サックス">サックス</option>
          <option value="トランペット">トランペット</option>
          <option value="ホルン">ホルン</option>
          <option value="トロンボーン">トロンボーン</option>
          <option value="バリ・チューバ">バリ・チューバ</option>
          <option value="フレックス">フレックス</option>

        </select>
      </div>
      <div class="form-group">
        <label class="form-label">課題曲年</label>
        <input type="number" class="form-input" id="f_asyear" value="${v('asyear')}" placeholder="例：2023">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">タグ（カンマ区切り）</label>
      <input type="text" class="form-input" id="f_tags" value="${v('tags')}" placeholder="例：ポップス,定番,課題曲">
    </div>
    <div class="form-group">
      <label class="form-label">野球応援楽譜</label>
      <select class="form-select" id="f_is_baseball">
        <option value="false" ${!item?.is_baseball ? 'selected' : ''}>いいえ</option>
        <option value="true"  ${item?.is_baseball  ? 'selected' : ''}>はい</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">備考・メモ</label>
      <textarea class="form-textarea" id="f_notes" placeholder="演奏上の注意、不足楽譜など">${v('notes')}</textarea>
    </div>
    <div class="form-actions">
      <button class="cancel-btn" onclick="closeForm()">キャンセル</button>
      <button class="submit-btn" onclick="saveScore()">保存</button>
    </div>`;
}

// ============================================================
// 修理フォーム（QRスキャン対応）
// ============================================================
function repairForm(item) {
  const v = f => item ? esc(String(item[f] ?? '')) : '';
  const instOptions = allInstruments.map(i =>
    `<option value="${i.instnumber}" data-qr="${esc(i.qr||'')}" data-instcode="${esc(i.instcode||'')}" data-name="${esc(i.name||'')}"
      ${String(item?.instnumber) === String(i.instnumber) ? 'selected' : ''}>
      #${String(i.instnumber).padStart(6,'0')} ${esc(i.name||'')}
    </option>`
  ).join('');
  const statusOptions = ['破損による修理','違和感による修理','原因不明の問題','その他修理','定期点検','その他']
    .map(s => `<option value="${s}" ${item?.status === s ? 'selected' : ''}>${s}</option>`).join('');

  return `
    <h2 class="form-title">${item ? '修理記録を編集' : '修理登録'}</h2>
    <input type="hidden" id="formId" value="${item ? item.id : ''}">

    <div class="form-group">
      <label class="form-label required">楽器を選択</label>
      <div style="display:flex;gap:8px;align-items:flex-start">
        <select class="form-select" id="f_instnumber" style="flex:1" onchange="onInstSelect(this)">
          <option value="">-- 楽器を選択してください --</option>
          ${instOptions}
        </select>
        <button type="button" class="qr-scan-inline-btn" onclick="openQrScanner('repair_form')" title="QRで楽器を選択">
          📷 QR
        </button>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">QRコード</label>
        <input type="text" class="form-input" id="f_qr" value="${v('qr')}" placeholder="自動入力" readonly style="background:var(--bg-surface)">
      </div>
      <div class="form-group">
        <label class="form-label">楽器コード</label>
        <input type="text" class="form-input" id="f_instcode" value="${v('instcode')}" placeholder="自動入力" readonly style="background:var(--bg-surface)">
      </div>
    </div>

    <div class="form-group">
      <label class="form-label required">状態・種別</label>
      <select class="form-select" id="f_status">
        <option value="">-- 選択してください --</option>
        ${statusOptions}
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">修理日</label>
      <input type="date" class="form-input" id="f_repair_date" value="${v('repair_date')}">
    </div>

    <div class="form-group">
      <label class="form-label">修理写真</label>
      <div class="image-upload-area">
        <div id="repairPreviewWrap">
          ${item?.repair_photo
            ? `<img src="${esc(item.repair_photo)}" class="image-preview" onerror="this.style.display='none'">`
            : `<div class="image-preview-placeholder">写真未設定</div>`}
        </div>
        <div class="image-upload-btns">
          <label class="upload-file-btn">
            📷 写真を選択してアップロード
            <input type="file" id="f_repair_photo_file" accept="image/*" style="display:none"
              onchange="handleImageSelect(event,'repair')">
          </label>
        </div>
        <input type="text" class="form-input" id="f_repair_photo" value="${v('repair_photo')}"
          placeholder="またはURLを直接入力"
          oninput="previewImageUrl(this.value,'repairPreviewWrap')" style="margin-top:8px">
        <div id="uploadStatus" class="upload-status"></div>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">修理内容・備考</label>
      <textarea class="form-textarea" id="f_repair_content" placeholder="症状や修理内容を記述...">${v('repair_content')}</textarea>
    </div>

    <div class="form-actions">
      <button class="cancel-btn" onclick="closeForm()">キャンセル</button>
      <button class="submit-btn" onclick="saveRepair()">登録</button>
    </div>`;
}

// 楽器選択プルダウン変更時
function onInstSelect(sel) {
  const opt = sel.options[sel.selectedIndex];
  document.getElementById('f_qr').value      = opt.dataset.qr      || '';
  document.getElementById('f_instcode').value = opt.dataset.instcode || '';
}

// QRスキャンで楽器を特定してフォームにセット
function fillRepairFormByQr(qrValue) {
  const inst = allInstruments.find(i => i.qr === qrValue);
  if (!inst) {
    alert(`QRコード「${qrValue}」に対応する楽器が見つかりませんでした`);
    return;
  }
  const sel = document.getElementById('f_instnumber');
  if (!sel) return;
  // プルダウンの選択を合わせる
  for (let i = 0; i < sel.options.length; i++) {
    if (String(sel.options[i].value) === String(inst.instnumber)) {
      sel.selectedIndex = i;
      break;
    }
  }
  document.getElementById('f_qr').value      = inst.qr      || '';
  document.getElementById('f_instcode').value = inst.instcode || '';
}

// ============================================================
// 画像アップロード（Supabase Storage）
// ============================================================
async function handleImageSelect(event, target) {
  const file = event.target.files[0];
  if (!file) return;
  const wrapId    = target === 'repair' ? 'repairPreviewWrap' : 'imagePreviewWrap';
  const urlFieldId = target === 'repair' ? 'f_repair_photo'   : 'f_image_url';
  const bucket    = target === 'repair' ? STORAGE_REPAIR_BUCKET : STORAGE_IMAGE_BUCKET;

  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById(wrapId).innerHTML = `<img src="${e.target.result}" class="image-preview">`;
  };
  reader.readAsDataURL(file);

  if (!db || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    setUploadStatus('⚠️ デモモード：アップロードされません', 'warn'); return;
  }
  setUploadStatus('⏳ アップロード中...', 'loading');
  const ext = file.name.split('.').pop().toLowerCase();
  const fileName = `${target}_${Date.now()}.${ext}`;
  const { error } = await db.storage.from(bucket).upload(fileName, file, { upsert: true });
  if (error) { setUploadStatus('❌ 失敗: ' + error.message, 'error'); return; }
  const { data: urlData } = db.storage.from(bucket).getPublicUrl(fileName);
  document.getElementById(urlFieldId).value = urlData.publicUrl;
  setUploadStatus('✅ アップロード完了', 'success');
}

function previewImageUrl(url, wrapId) {
  if (!url) return;
  const wrap = document.getElementById(wrapId);
  if (wrap) wrap.innerHTML = `<img src="${esc(url)}" class="image-preview" onerror="this.style.display='none'">`;
}

function setUploadStatus(msg, type) {
  const el = document.getElementById('uploadStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = `upload-status upload-status-${type}`;
}

// ============================================================
// 保存処理
// ============================================================
async function saveInstrument() {
  const id = document.getElementById('formId').value;
  const instnumber = getInstnumberValue();
  const name = document.getElementById('f_name').value.trim();
  if (!instnumber) { alert('楽器番号（①種類）は必須です'); return; }
  if (!name) { alert('楽器名は必須です'); return; }
  const qrVal = document.getElementById('f_qr').value.trim();
  const data = {
    instnumber,
    qr: qrVal || `QR-${String(instnumber).padStart(6,'0')}`,
    instcode: document.getElementById('f_instcode').value.trim() || null,
    name,
    maker: document.getElementById('f_maker').value.trim() || null,
    model: document.getElementById('f_model').value.trim() || null,
    purchase_date: document.getElementById('f_purchase_date').value || null,
    owner: document.getElementById('f_owner').value.trim() || null,
    image_url: document.getElementById('f_image_url').value.trim() || null,
    equipcode: document.getElementById('f_equipcode').value.trim() || null,
    notes: document.getElementById('f_notes').value.trim() || null,
  };
  await upsertData('instruments', id, data, allInstruments);
}

async function saveScore() {
  const id = document.getElementById('formId').value;
  const scorenumber = parseInt(document.getElementById('f_scorenumber').value);
  const jatitle = document.getElementById('f_jatitle').value.trim();
  const entitle = document.getElementById('f_entitle').value.trim();
  const jahititle = document.getElementById('f_jahititle').value.trim();
  if (!scorenumber) { alert('楽譜番号は必須です'); return; }
  if (!jatitle) { alert('曲名（日本語）は必須です'); return; }
  if (!entitle) { alert('曲名（英語）は必須です'); return; }
  if (!jahititle) { alert('曲名（ひらがな）は必須です'); return; }
  const data = {
    scorenumber, jatitle, entitle, jahititle,
    composer: document.getElementById('f_composer').value.trim() || null,
    artist: document.getElementById('f_artist').value.trim() || null,
    hiragana: document.getElementById('f_hiragana').value.trim() || null,
    alphabet: document.getElementById('f_alphabet').value.trim() || null,
    instrumentation: document.getElementById('f_instrumentation').value.trim() || null,
    tags: document.getElementById('f_tags').value.trim() || null,
    asyear: parseInt(document.getElementById('f_asyear').value) || null,
    is_baseball: document.getElementById('f_is_baseball').value === 'true',
    notes: document.getElementById('f_notes').value.trim() || null,
  };
  await upsertData('scores', id, data, allScores);
}

async function saveRepair() {
  const id = document.getElementById('formId').value;
  const instnumber = parseInt(document.getElementById('f_instnumber').value);
  const status = document.getElementById('f_status').value;
  if (!instnumber) { alert('楽器を選択してください'); return; }
  if (!status)     { alert('状態・種別を選択してください'); return; }
  const repairId = id ? null : generateRepairId();
  const data = {
    ...(repairId ? { repair_id: repairId } : {}),
    instnumber,
    qr: document.getElementById('f_qr').value.trim() || null,
    instcode: document.getElementById('f_instcode').value.trim() || null,
    status,
    repair_date: document.getElementById('f_repair_date').value || null,
    repair_photo: document.getElementById('f_repair_photo').value.trim() || null,
    repair_content: document.getElementById('f_repair_content').value.trim() || null,
  };
  await upsertData('repairs', id, data, allRepairs);
}

function generateRepairId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let r = 'RPR-';
  for (let i = 0; i < 8; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return r;
}

async function upsertData(table, id, data, localArray) {
  if (!db || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    if (id) {
      const idx = localArray.findIndex(i => i.id == id);
      if (idx !== -1) localArray[idx] = { ...localArray[idx], ...data };
    } else {
      data.id = Date.now();
      localArray.push(data);
    }
  } else {
    let error;
    if (id) {
      ({ error } = await db.from(table).update(data).eq('id', id));
    } else {
      ({ error } = await db.from(table).insert(data));
    }
    if (error) { alert('保存に失敗しました:\n' + error.message); console.error(error); return; }
    await loadData();
  }
  closeForm();
  renderPage();
  if (document.getElementById('adminPanelOverlay').classList.contains('open')) renderAdminPanel();
}

// ============================================================
// 削除処理（管理者のみ）
// ============================================================
async function deleteItem(type, id) {
  if (!confirm('本当に削除しますか？')) return;
  const tableMap = { instrument: 'instruments', score: 'scores', repair: 'repairs' };
  if (!db || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    if (type === 'instrument') allInstruments = allInstruments.filter(i => i.id !== id);
    else if (type === 'score') allScores = allScores.filter(s => s.id !== id);
    else allRepairs = allRepairs.filter(r => r.id !== id);
  } else {
    const { error } = await db.from(tableMap[type]).delete().eq('id', id);
    if (error) { alert('削除に失敗しました: ' + error.message); return; }
    await loadData();
  }
  renderPage();
  renderAdminPanel();
}

// ============================================================
// 検索
// ============================================================
function setupSearch() {
  document.getElementById('searchInput').addEventListener('input', () => renderPage());
}

// ============================================================
// QRコードスキャナー（モード対応）
// mode: 'search'       → 検索欄に入力
// mode: 'repair_form'  → 修理フォームの楽器選択に反映
// ============================================================
function openQrScanner(mode) {
  qrMode = mode || 'search';
  const descEl = document.getElementById('qrDesc');
  if (descEl) {
    descEl.textContent = qrMode === 'repair_form'
      ? '楽器のQRコードをかざして楽器を選択します'
      : 'カメラにQRコードをかざしてください';
  }
  document.getElementById('qrOverlay').classList.add('open');
  startQrCamera();
}

function closeQrScanner() {
  stopQrCamera();
  document.getElementById('qrOverlay').classList.remove('open');
}

async function startQrCamera() {
  const video = document.getElementById('qrVideo');
  document.getElementById('qrStatus').textContent = 'カメラを起動中...';
  try {
    qrStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = qrStream;
    video.play();
    video.addEventListener('loadedmetadata', () => {
      document.getElementById('qrStatus').textContent = 'QRコードをかざしてください';
      scanQrFrame(video);
    }, { once: true });
  } catch(e) {
    document.getElementById('qrStatus').textContent = 'カメラへのアクセスが拒否されました';
  }
}

function scanQrFrame(video) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  function tick() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
      if (code) {
        closeQrScanner();
        if (qrMode === 'repair_form') {
          fillRepairFormByQr(code.data);
        } else {
          document.getElementById('searchInput').value = code.data;
          renderPage();
        }
        return;
      }
    }
    qrAnimFrame = requestAnimationFrame(tick);
  }
  qrAnimFrame = requestAnimationFrame(tick);
}

function stopQrCamera() {
  if (qrAnimFrame) { cancelAnimationFrame(qrAnimFrame); qrAnimFrame = null; }
  if (qrStream) { qrStream.getTracks().forEach(t => t.stop()); qrStream = null; }
  const video = document.getElementById('qrVideo');
  if (video) video.srcObject = null;
}

// ============================================================
// ユーティリティ
// ============================================================
function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
}
