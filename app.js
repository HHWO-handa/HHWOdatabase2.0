// ============================================================
// Supabase クライアント初期化
// ============================================================
const { createClient } = supabase;
let db;

try {
  db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch(e) {
  console.warn('Supabase未設定。デモデータで動作します。');
}

// ============================================================
// デモデータ（Supabase未設定時に使用）
// ============================================================
const DEMO_INSTRUMENTS = [
  {
    id: 1, instnumber: 1, qr: 'QR-001', instcode: 'CL-001',
    name: 'Bb クラリネット', maker: 'Buffet Crampon', model: 'R13',
    purchase_date: '2020-04-01', owner: '田中 花子',
    equipcode: 'EQ-001', image_url: null,
    notes: 'リードは3番を使用。ケースに予備リード5枚あり。'
  },
  {
    id: 2, instnumber: 2, qr: 'QR-002', instcode: 'SAX-001',
    name: 'テナーサックス', maker: 'Yamaha', model: 'YTS-82Z',
    purchase_date: '2019-09-15', owner: '鈴木 一郎',
    equipcode: 'EQ-002', image_url: null,
    notes: '定期メンテナンス済み（2023年10月）'
  },
  {
    id: 3, instnumber: 3, qr: 'QR-003', instcode: 'TP-001',
    name: 'トランペット', maker: 'Bach', model: 'Stradivarius 37',
    purchase_date: '2021-03-20', owner: '佐藤 次郎',
    equipcode: 'EQ-003', image_url: null,
    notes: 'バルブ不調のため修理依頼中。完了予定：来月'
  },
];

const DEMO_SCORES = [
  {
    id: 1, scorenumber: 1,
    jatitle: '宝島', entitle: 'Takarajima', jahititle: 'たからじま',
    composer: '和泉宏隆', artist: 'T-SQUARE',
    hiragana: 'た', alphabet: 'T',
    instrumentation: '吹奏楽フルバンド', tags: 'ポップス,定番',
    asyear: null, is_baseball: false,
    notes: '定期演奏会のメイン曲。テンポ♩=138で演奏。'
  },
  {
    id: 2, scorenumber: 2,
    jatitle: 'アルヴァマー序曲', entitle: 'Alvamar Overture', jahititle: 'あるヴぁまーじょきょく',
    composer: 'James Barnes', artist: '',
    hiragana: 'あ', alphabet: 'A',
    instrumentation: '吹奏楽フルバンド', tags: 'コンクール,Classic',
    asyear: null, is_baseball: false,
    notes: 'コンクールA部門用。'
  },
  {
    id: 3, scorenumber: 3,
    jatitle: 'VICTORY（応援歌）', entitle: 'VICTORY', jahititle: 'びくとりー',
    composer: '編曲：山田太郎', artist: '',
    hiragana: 'ひ', alphabet: 'V',
    instrumentation: '吹奏楽', tags: '野球,応援',
    asyear: null, is_baseball: true,
    notes: '攻撃時・2塁打以上で演奏'
  },
];

// ============================================================
// 状態管理
// ============================================================
let currentPage = 'instruments';
let isAdmin = false;
let allInstruments = [];
let allScores = [];

// ============================================================
// 初期化
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  renderPage();
  setupSearch();
});

// ============================================================
// データ読み込み
// ============================================================
async function loadData() {
  if (!db || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    allInstruments = DEMO_INSTRUMENTS;
    allScores = DEMO_SCORES;
    return;
  }

  const [{ data: instruments, error: e1 }, { data: scores, error: e2 }] = await Promise.all([
    db.from('instruments').select('*').order('instnumber'),
    db.from('scores').select('*').order('scorenumber'),
  ]);

  if (e1) console.error('instruments取得エラー:', e1);
  if (e2) console.error('scores取得エラー:', e2);

  allInstruments = instruments || [];
  allScores = scores || [];
}

// ============================================================
// ページ切り替え
// ============================================================
function switchPage(page) {
  currentPage = page;
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });
  document.getElementById('searchInput').value = '';
  renderPage();
}

// ============================================================
// ページ描画
// ============================================================
function renderPage() {
  const titles = {
    instruments: { title: '楽器一覧', sub: '登録された楽器を管理します' },
    scores:      { title: '楽譜一覧', sub: '演奏楽譜の管理をします' },
    repair:      { title: '修理楽器一覧', sub: '修理・点検が必要な楽器' },
    baseball:    { title: '野球応援楽譜一覧', sub: '野球応援で使用する楽譜' },
  };

  const t = titles[currentPage];
  document.getElementById('pageTitle').textContent = t.title;
  document.getElementById('pageSubtitle').textContent = t.sub;

  const query = document.getElementById('searchInput').value.toLowerCase();

  switch(currentPage) {
    case 'instruments': renderInstrumentsTable(allInstruments, query); break;
    case 'scores':      renderScoresTable(allScores.filter(s => !s.is_baseball), query); break;
    case 'repair':      renderInstrumentsTable(allInstruments.filter(i => i.status === '修理中'), query); break;
    case 'baseball':    renderScoresTable(allScores.filter(s => s.is_baseball), query); break;
  }
}

// ============================================================
// 楽器テーブル描画
// ============================================================
function renderInstrumentsTable(data, query = '') {
  const filtered = query
    ? data.filter(i =>
        (i.name||'').toLowerCase().includes(query) ||
        (i.instcode||'').toLowerCase().includes(query) ||
        (i.maker||'').toLowerCase().includes(query) ||
        (i.owner||'').toLowerCase().includes(query) ||
        (i.equipcode||'').toLowerCase().includes(query) ||
        String(i.instnumber||'').includes(query)
      )
    : data;

  const container = document.getElementById('tableContainer');
  const empty = document.getElementById('emptyState');

  if (filtered.length === 0) {
    container.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>No.</th>
          <th>楽器名</th>
          <th class="hide-mobile">楽器コード</th>
          <th class="hide-mobile">担当者</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(i => `
          <tr onclick="openInstrumentDetail(${i.id})">
            <td class="muted" style="font-family:var(--font-mono);font-size:12px;white-space:nowrap">${esc(String(i.instnumber||''))}</td>
            <td>
              <div style="font-weight:500">${esc(i.name)}</div>
              <div style="font-size:12px;color:var(--text-muted)">${esc(i.maker || '')} ${esc(i.model || '')}</div>
            </td>
            <td class="muted hide-mobile" style="font-family:var(--font-mono);font-size:12px">${esc(i.instcode || '-')}</td>
            <td class="muted hide-mobile">${esc(i.owner || '-')}</td>
            <td class="row-arrow">›</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ============================================================
// 楽譜テーブル描画
// ============================================================
function renderScoresTable(data, query = '') {
  const filtered = query
    ? data.filter(s =>
        (s.jatitle||'').toLowerCase().includes(query) ||
        (s.entitle||'').toLowerCase().includes(query) ||
        (s.jahititle||'').toLowerCase().includes(query) ||
        (s.composer||'').toLowerCase().includes(query) ||
        (s.artist||'').toLowerCase().includes(query) ||
        (s.tags||'').toLowerCase().includes(query) ||
        String(s.scorenumber||'').includes(query)
      )
    : data;

  const container = document.getElementById('tableContainer');
  const empty = document.getElementById('emptyState');

  if (filtered.length === 0) {
    container.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>No.</th>
          <th>曲名</th>
          <th class="hide-mobile">作曲者 / アーティスト</th>
          <th class="hide-mobile">編成</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(s => `
          <tr onclick="openScoreDetail(${s.id})">
            <td class="muted" style="font-family:var(--font-mono);font-size:12px;white-space:nowrap">${esc(String(s.scorenumber||''))}</td>
            <td>
              <div style="font-weight:500">${esc(s.jatitle)}</div>
              <div style="font-size:12px;color:var(--text-muted)">${esc(s.entitle || '')}</div>
            </td>
            <td class="muted hide-mobile">
              <div>${esc(s.composer || '-')}</div>
              ${s.artist ? `<div style="font-size:12px">${esc(s.artist)}</div>` : ''}
            </td>
            <td class="muted hide-mobile">${esc(s.instrumentation || '-')}</td>
            <td class="row-arrow">›</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ============================================================
// 楽器詳細モーダル
// ============================================================
function openInstrumentDetail(id) {
  const item = allInstruments.find(i => i.id === id);
  if (!item) return;

  const imageHtml = item.image_url
    ? `<img src="${esc(item.image_url)}" alt="${esc(item.name)}" class="detail-image" onerror="this.style.display='none'">`
    : '';

  const noteHtml = item.notes
    ? `<div class="detail-note">${esc(item.notes)}</div>`
    : '<span style="color:var(--text-muted)">なし</span>';

  document.getElementById('modalContent').innerHTML = `
    <div class="detail-header">
      <div class="detail-category">楽器 #${esc(String(item.instnumber||''))}</div>
      <div class="detail-title">${esc(item.name)}</div>
    </div>
    ${imageHtml}
    <div class="detail-grid">
      <div class="detail-item">
        <span class="detail-label">楽器コード</span>
        <span class="detail-value mono">${esc(item.instcode || '-')}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">備品番号</span>
        <span class="detail-value mono">${esc(item.equipcode || '-')}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">QRコード</span>
        <span class="detail-value mono">${esc(item.qr || '-')}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">メーカー</span>
        <span class="detail-value">${esc(item.maker || '-')}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">モデル</span>
        <span class="detail-value">${esc(item.model || '-')}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">担当者・所有者</span>
        <span class="detail-value">${esc(item.owner || '-')}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">購入日</span>
        <span class="detail-value mono">${formatDate(item.purchase_date)}</span>
      </div>
    </div>
    <div class="detail-item">
      <span class="detail-label">備考・メモ</span>
      ${noteHtml}
    </div>
  `;

  openModal();
}

// ============================================================
// 楽譜詳細モーダル
// ============================================================
function openScoreDetail(id) {
  const item = allScores.find(s => s.id === id);
  if (!item) return;

  const tagsHtml = item.tags
    ? item.tags.split(',').map(t => `<span class="badge badge-genre">${esc(t.trim())}</span>`).join('')
    : '<span style="color:var(--text-muted)">なし</span>';

  const noteHtml = item.notes
    ? `<div class="detail-note">${esc(item.notes)}</div>`
    : '<span style="color:var(--text-muted)">なし</span>';

  document.getElementById('modalContent').innerHTML = `
    <div class="detail-header">
      <div class="detail-category">${item.is_baseball ? '⚾ 野球応援楽譜' : '🎵 楽譜'} #${esc(String(item.scorenumber||''))}</div>
      <div class="detail-title">${esc(item.jatitle)}</div>
      ${item.entitle ? `<div style="font-size:14px;color:var(--text-muted);margin-top:4px">${esc(item.entitle)}</div>` : ''}
      ${item.jahititle ? `<div style="font-size:12px;color:var(--text-muted)">${esc(item.jahititle)}</div>` : ''}
    </div>
    <div class="detail-grid">
      <div class="detail-item">
        <span class="detail-label">作曲者</span>
        <span class="detail-value">${esc(item.composer || '-')}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">アーティスト</span>
        <span class="detail-value">${esc(item.artist || '-')}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">50音索引</span>
        <span class="detail-value mono">${esc(item.hiragana || '-')}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">アルファベット索引</span>
        <span class="detail-value mono">${esc(item.alphabet || '-')}</span>
      </div>
      ${item.asyear ? `
      <div class="detail-item">
        <span class="detail-label">課題曲年</span>
        <span class="detail-value mono">${esc(String(item.asyear))}</span>
      </div>` : ''}
      <div class="detail-item full">
        <span class="detail-label">楽器編成</span>
        <span class="detail-value">${esc(item.instrumentation || '-')}</span>
      </div>
      <div class="detail-item full">
        <span class="detail-label">タグ</span>
        <div class="tag-list">${tagsHtml}</div>
      </div>
    </div>
    <div class="detail-item">
      <span class="detail-label">備考・メモ</span>
      ${noteHtml}
    </div>
  `;

  openModal();
}

// ============================================================
// モーダル操作
// ============================================================
function openModal() {
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

// ============================================================
// 管理者認証
// ============================================================
document.getElementById('adminBtn').addEventListener('click', () => {
  if (isAdmin) {
    openAdminPanel();
  } else {
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
// 管理者パネル
// ============================================================
function openAdminPanel() {
  const isInstrumentPage = currentPage === 'instruments' || currentPage === 'repair';
  const type = isInstrumentPage ? 'instrument' : 'score';
  const data = isInstrumentPage
    ? allInstruments
    : allScores.filter(s => currentPage === 'baseball' ? s.is_baseball : !s.is_baseball);
  const titleLabel = isInstrumentPage ? '楽器' : '楽譜';

  const rows = data.map(item => `
    <tr>
      <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">
        ${esc(String(isInstrumentPage ? (item.instnumber||'') : (item.scorenumber||'')))}
      </td>
      <td>${esc(isInstrumentPage ? item.name : item.jatitle)}</td>
      <td>
        <div class="action-btns">
          <button class="edit-btn" onclick="openEditForm('${type}', ${item.id})">編集</button>
          <button class="delete-btn" onclick="deleteItem('${type}', ${item.id})">削除</button>
        </div>
      </td>
    </tr>
  `).join('');

  document.getElementById('adminContent').innerHTML = `
    <div class="admin-header">
      <h2 class="admin-title">${titleLabel}管理</h2>
      <button class="add-btn" onclick="openAddForm('${type}')">＋ 追加</button>
    </div>
    <div style="overflow-x:auto">
      <table class="admin-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>${isInstrumentPage ? '楽器名' : '曲名'}</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:20px">データなし</td></tr>'}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('adminPanelOverlay').classList.add('open');
}

function closeAdminPanel() {
  document.getElementById('adminPanelOverlay').classList.remove('open');
}

// ============================================================
// フォーム
// ============================================================
function openAddForm(type) { renderForm(type, null); }

function openEditForm(type, id) {
  const item = type === 'instrument'
    ? allInstruments.find(i => i.id === id)
    : allScores.find(s => s.id === id);
  renderForm(type, item);
}

function renderForm(type, item) {
  document.getElementById('formContent').innerHTML = type === 'instrument'
    ? instrumentForm(item)
    : scoreForm(item);
  document.getElementById('formOverlay').classList.add('open');
}

// ============================================================
// 楽器フォーム
// ============================================================
function instrumentForm(item) {
  const v = (field) => item ? esc(String(item[field] ?? '')) : '';
  return `
    <h2 class="form-title">${item ? '楽器を編集' : '楽器を追加'}</h2>
    <input type="hidden" id="formId" value="${item ? item.id : ''}">

    <div class="form-row">
      <div class="form-group">
        <label class="form-label required">楽器番号</label>
        <input type="number" class="form-input" id="f_instnumber" value="${v('instnumber')}" placeholder="例：1">
      </div>
      <div class="form-group">
        <label class="form-label">楽器コード</label>
        <input type="text" class="form-input" id="f_instcode" value="${v('instcode')}" placeholder="例：CL-001">
      </div>
    </div>

    <div class="form-group">
      <label class="form-label required">楽器名</label>
      <input type="text" class="form-input" id="f_name" value="${v('name')}" placeholder="例：Bbクラリネット">
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">メーカー</label>
        <input type="text" class="form-input" id="f_maker" value="${v('maker')}" placeholder="例：Yamaha">
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
        <input type="text" class="form-input" id="f_equipcode" value="${v('equipcode')}" placeholder="例：EQ-001">
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">QRコード</label>
        <input type="text" class="form-input" id="f_qr" value="${v('qr')}" placeholder="例：QR-001">
      </div>
      <div class="form-group">
        <label class="form-label">担当者・所有者</label>
        <input type="text" class="form-input" id="f_owner" value="${v('owner')}" placeholder="例：山田 花子">
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">楽器画像</label>
      <div class="image-upload-area">
        <div id="imagePreviewWrap">
          ${item?.image_url
            ? `<img src="${esc(item.image_url)}" class="image-preview" id="imagePreviewImg" onerror="this.style.display='none'">`
            : `<div class="image-preview-placeholder" id="imagePreviewPlaceholder">画像未設定</div>`
          }
        </div>
        <div class="image-upload-btns">
          <label class="upload-file-btn">
            📁 ファイルを選択してアップロード
            <input type="file" id="f_image_file" accept="image/*" style="display:none" onchange="handleImageSelect(event)">
          </label>
        </div>
        <div class="form-group" style="margin-top:8px;margin-bottom:0">
          <input type="text" class="form-input" id="f_image_url" value="${v('image_url')}"
            placeholder="またはURLを直接入力" oninput="previewImageUrl(this.value)">
        </div>
        <div id="uploadStatus" class="upload-status"></div>
      </div>
      <p class="form-file-hint">📌 ファイルを選択するとSupabase Storageに自動アップロードされます</p>
    </div>

    <div class="form-group">
      <label class="form-label">備考・メモ</label>
      <textarea class="form-textarea" id="f_notes" placeholder="自由記述...">${v('notes')}</textarea>
    </div>

    <div class="form-actions">
      <button class="cancel-btn" onclick="closeForm()">キャンセル</button>
      <button class="submit-btn" id="submitBtn" onclick="saveInstrument()">保存</button>
    </div>
  `;
}

// ============================================================
// 楽譜フォーム
// ============================================================
function scoreForm(item) {
  const v = (field) => item ? esc(String(item[field] ?? '')) : '';
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
        <input type="text" class="form-input" id="f_alphabet" value="${v('alphabet')}" placeholder="例：T">
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">楽器編成</label>
        <input type="text" class="form-input" id="f_instrumentation" value="${v('instrumentation')}" placeholder="例：吹奏楽フルバンド">
      </div>
      <div class="form-group">
        <label class="form-label">課題曲年</label>
        <input type="number" class="form-input" id="f_asyear" value="${v('asyear')}" placeholder="例：2023">
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">タグ（カンマ区切り）</label>
      <input type="text" class="form-input" id="f_tags" value="${v('tags')}" placeholder="例：ポップス,定番,コンクール">
    </div>

    <div class="form-group">
      <label class="form-label">野球応援楽譜</label>
      <select class="form-select" id="f_is_baseball">
        <option value="false" ${!item?.is_baseball ? 'selected' : ''}>いいえ</option>
        <option value="true" ${item?.is_baseball ? 'selected' : ''}>はい</option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">備考・メモ</label>
      <textarea class="form-textarea" id="f_notes" placeholder="演奏上の注意など...">${v('notes')}</textarea>
    </div>

    <div class="form-actions">
      <button class="cancel-btn" onclick="closeForm()">キャンセル</button>
      <button class="submit-btn" id="submitBtn" onclick="saveScore()">保存</button>
    </div>
  `;
}

function closeForm() {
  document.getElementById('formOverlay').classList.remove('open');
}

// ============================================================
// 画像アップロード（Supabase Storage）
// ============================================================
async function handleImageSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  // ローカルプレビュー
  const reader = new FileReader();
  reader.onload = (e) => {
    const wrap = document.getElementById('imagePreviewWrap');
    wrap.innerHTML = `<img src="${e.target.result}" class="image-preview" id="imagePreviewImg">`;
  };
  reader.readAsDataURL(file);

  // デモモードはアップロードしない
  if (!db || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    setUploadStatus('⚠️ デモモード：Supabase未設定のためアップロードされません', 'warn');
    return;
  }

  setUploadStatus('⏳ アップロード中...', 'loading');

  const ext = file.name.split('.').pop().toLowerCase();
  const fileName = `instrument_${Date.now()}.${ext}`;

  const { error } = await db.storage
    .from(STORAGE_IMAGE_BUCKET)
    .upload(fileName, file, { upsert: true });

  if (error) {
    setUploadStatus('❌ アップロード失敗: ' + error.message, 'error');
    return;
  }

  const { data: urlData } = db.storage
    .from(STORAGE_IMAGE_BUCKET)
    .getPublicUrl(fileName);

  document.getElementById('f_image_url').value = urlData.publicUrl;
  setUploadStatus('✅ アップロード完了！URLを自動設定しました', 'success');
}

function previewImageUrl(url) {
  if (!url) return;
  const wrap = document.getElementById('imagePreviewWrap');
  if (!wrap) return;
  wrap.innerHTML = `<img src="${esc(url)}" class="image-preview" onerror="this.style.display='none'">`;
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
  const instnumber = parseInt(document.getElementById('f_instnumber').value);
  const name = document.getElementById('f_name').value.trim();

  if (!instnumber) { alert('楽器番号は必須です'); return; }
  if (!name) { alert('楽器名は必須です'); return; }

  const qrVal = document.getElementById('f_qr').value.trim();
  const data = {
    instnumber,
    qr: qrVal || `QR-${String(instnumber).padStart(3, '0')}`,
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
    scorenumber,
    jatitle,
    entitle,
    jahititle,
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
    if (error) {
      alert('保存に失敗しました:\n' + error.message);
      console.error(error);
      return;
    }
    await loadData();
  }

  closeForm();
  renderPage();
  if (document.getElementById('adminPanelOverlay').classList.contains('open')) openAdminPanel();
}

// ============================================================
// 削除処理
// ============================================================
async function deleteItem(type, id) {
  if (!confirm('本当に削除しますか？')) return;

  if (!db || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    if (type === 'instrument') allInstruments = allInstruments.filter(i => i.id !== id);
    else allScores = allScores.filter(s => s.id !== id);
  } else {
    const table = type === 'instrument' ? 'instruments' : 'scores';
    const { error } = await db.from(table).delete().eq('id', id);
    if (error) { alert('削除に失敗しました: ' + error.message); return; }
    await loadData();
  }

  renderPage();
  openAdminPanel();
}

// ============================================================
// 検索
// ============================================================
function setupSearch() {
  document.getElementById('searchInput').addEventListener('input', () => renderPage());
}

// ============================================================
// ユーティリティ
// ============================================================
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
