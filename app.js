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
  { id: 1, name: 'Bb クラリネット', type: 'クラリネット', maker: 'Buffet Crampon', model: 'R13', purchase_date: '2020-04-01', price: 180000, status: '使用中', owner: '田中 花子', notes: 'リードは3番を使用。ケースに予備リード5枚あり。' },
  { id: 2, name: 'テナーサックス', type: 'サクソフォン', maker: 'Yamaha', model: 'YTS-82Z', purchase_date: '2019-09-15', price: 350000, status: '使用中', owner: '鈴木 一郎', notes: '定期メンテナンス済み（2023年10月）' },
  { id: 3, name: 'トランペット', type: 'トランペット', maker: 'Bach', model: 'Stradivarius 37', purchase_date: '2021-03-20', price: 260000, status: '修理中', owner: '佐藤 次郎', notes: 'バルブ不調のため修理依頼中。完了予定：来月' },
  { id: 4, name: 'フルート', type: 'フルート', maker: 'Muramatsu', model: 'GX', purchase_date: '2018-08-10', price: 420000, status: '保管中', owner: '山田 三郎', notes: 'クリーニングポーズ交換済み' },
  { id: 5, name: 'バリトンサックス', type: 'サクソフォン', maker: 'Selmer', model: 'Serie III', purchase_date: '2022-01-05', price: 680000, status: '使用中', owner: '伊藤 美咲', notes: '' },
];

const DEMO_SCORES = [
  { id: 1, title: '宝島', composer: '和泉宏隆', instrumentation: '吹奏楽フルバンド', tags: 'ポップス,定番', genre: 'ポップス', is_baseball: false, notes: '定期演奏会のメイン曲。テンポ♩=138で演奏。' },
  { id: 2, title: 'アルヴァマー序曲', composer: 'James Barnes', instrumentation: '吹奏楽フルバンド', tags: 'コンクール,Classic', genre: 'クラシック', is_baseball: false, notes: 'コンクールA部門用。' },
  { id: 3, title: 'ルパン三世のテーマ', composer: '大野雄二', instrumentation: '吹奏楽', tags: 'ポップス,アニメ', genre: 'ポップス', is_baseball: false, notes: '' },
  { id: 4, title: 'VICTORY（応援歌）', composer: '編曲：山田太郎', instrumentation: '吹奏楽', tags: '野球,応援', genre: '応援', is_baseball: true, notes: '攻撃時・2塁打以上で演奏' },
  { id: 5, title: 'チャンスサンバ', composer: '不明', instrumentation: '吹奏楽', tags: '野球,応援,チャンス', genre: '応援', is_baseball: true, notes: 'ランナーが出たときに演奏' },
  { id: 6, title: '栄冠は君に輝く', composer: '古関裕而', instrumentation: '吹奏楽', tags: '野球,応援,定番', genre: '応援', is_baseball: true, notes: '試合開始前と終了後に演奏' },
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
    // デモデータを使用
    allInstruments = DEMO_INSTRUMENTS;
    allScores = DEMO_SCORES;
    return;
  }

  const [{ data: instruments }, { data: scores }] = await Promise.all([
    db.from('instruments').select('*').order('name'),
    db.from('scores').select('*').order('title'),
  ]);

  allInstruments = instruments || [];
  allScores = scores || [];
}

// ============================================================
// ページ切り替え
// ============================================================
function switchPage(page) {
  currentPage = page;

  // ナビボタンの更新
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });

  // 検索クリア
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
        (i.type||'').toLowerCase().includes(query) ||
        (i.maker||'').toLowerCase().includes(query) ||
        (i.owner||'').toLowerCase().includes(query)
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

  const statusBadge = (status) => {
    const map = {
      '使用中': 'badge-active',
      '修理中': 'badge-repair',
      '保管中': 'badge-storage',
    };
    return `<span class="badge ${map[status] || 'badge-storage'}">${status || '-'}</span>`;
  };

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>楽器名</th>
          <th class="hide-mobile">種類</th>
          <th class="hide-mobile">担当者</th>
          <th>状態</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(i => `
          <tr onclick="openInstrumentDetail(${i.id})">
            <td>
              <div style="font-weight:500">${esc(i.name)}</div>
              <div style="font-size:12px;color:var(--text-muted)">${esc(i.maker || '')} ${esc(i.model || '')}</div>
            </td>
            <td class="muted hide-mobile">${esc(i.type || '-')}</td>
            <td class="muted hide-mobile">${esc(i.owner || '-')}</td>
            <td>${statusBadge(i.status)}</td>
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
        (s.title||'').toLowerCase().includes(query) ||
        (s.composer||'').toLowerCase().includes(query) ||
        (s.genre||'').toLowerCase().includes(query) ||
        (s.tags||'').toLowerCase().includes(query)
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
          <th>曲名</th>
          <th class="hide-mobile">作曲者</th>
          <th class="hide-mobile">ジャンル</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(s => `
          <tr onclick="openScoreDetail(${s.id})">
            <td>
              <div style="font-weight:500">${esc(s.title)}</div>
              <div style="font-size:12px;color:var(--text-muted)">${esc(s.instrumentation || '')}</div>
            </td>
            <td class="muted hide-mobile">${esc(s.composer || '-')}</td>
            <td class="hide-mobile">
              ${s.genre ? `<span class="badge badge-genre">${esc(s.genre)}</span>` : '-'}
            </td>
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
    ? `<img src="${esc(item.image_url)}" alt="${esc(item.name)}" class="detail-image">`
    : '';

  const noteHtml = item.notes
    ? `<div class="detail-note">${esc(item.notes)}</div>`
    : '<span style="color:var(--text-muted)">なし</span>';

  document.getElementById('modalContent').innerHTML = `
    <div class="detail-header">
      <div class="detail-category">楽器</div>
      <div class="detail-title">${esc(item.name)}</div>
    </div>
    ${imageHtml}
    <div class="detail-grid">
      <div class="detail-item">
        <span class="detail-label">種類</span>
        <span class="detail-value">${esc(item.type || '-')}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">状態</span>
        <span class="detail-value">
          <span class="badge ${statusClass(item.status)}">${esc(item.status || '-')}</span>
        </span>
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
      <div class="detail-item">
        <span class="detail-label">購入価格</span>
        <span class="detail-value mono">${formatPrice(item.price)}</span>
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

  const audioHtml = item.audio_url
    ? `<audio class="audio-player" controls src="${esc(item.audio_url)}"></audio>`
    : '<span style="color:var(--text-muted);font-size:13px">未登録</span>';

  const tagsHtml = item.tags
    ? item.tags.split(',').map(t => `<span class="badge badge-genre">${esc(t.trim())}</span>`).join('')
    : '<span style="color:var(--text-muted)">なし</span>';

  const noteHtml = item.notes
    ? `<div class="detail-note">${esc(item.notes)}</div>`
    : '<span style="color:var(--text-muted)">なし</span>';

  document.getElementById('modalContent').innerHTML = `
    <div class="detail-header">
      <div class="detail-category">${item.is_baseball ? '⚾ 野球応援楽譜' : '🎵 楽譜'}</div>
      <div class="detail-title">${esc(item.title)}</div>
    </div>
    <div class="detail-grid">
      <div class="detail-item">
        <span class="detail-label">作曲者</span>
        <span class="detail-value">${esc(item.composer || '-')}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">ジャンル</span>
        <span class="detail-value">
          ${item.genre ? `<span class="badge badge-genre">${esc(item.genre)}</span>` : '-'}
        </span>
      </div>
      <div class="detail-item full">
        <span class="detail-label">楽器編成</span>
        <span class="detail-value">${esc(item.instrumentation || '-')}</span>
      </div>
      <div class="detail-item full">
        <span class="detail-label">タグ</span>
        <div class="tag-list">${tagsHtml}</div>
      </div>
      <div class="detail-item full">
        <span class="detail-label">音源</span>
        ${audioHtml}
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
  const data = isInstrumentPage ? allInstruments : allScores.filter(s => currentPage === 'baseball' ? s.is_baseball : !s.is_baseball);
  const titleLabel = isInstrumentPage ? '楽器' : '楽譜';

  const rows = data.map(item => `
    <tr>
      <td>${esc(isInstrumentPage ? item.name : item.title)}</td>
      <td>${esc(isInstrumentPage ? (item.status||'-') : (item.genre||'-'))}</td>
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
            <th>${isInstrumentPage ? '楽器名' : '曲名'}</th>
            <th>${isInstrumentPage ? '状態' : 'ジャンル'}</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:20px">データなし</td></tr>'}</tbody>
      </table>
    </div>
  `;

  document.getElementById('adminPanelOverlay').classList.add('open');
}

function closeAdminPanel() {
  document.getElementById('adminPanelOverlay').classList.remove('open');
}

// ============================================================
// フォーム（追加・編集）
// ============================================================
function openAddForm(type) {
  renderForm(type, null);
}

function openEditForm(type, id) {
  const item = type === 'instrument'
    ? allInstruments.find(i => i.id === id)
    : allScores.find(s => s.id === id);
  renderForm(type, item);
}

function renderForm(type, item) {
  const isEdit = !!item;
  const label = type === 'instrument' ? '楽器' : '楽譜';
  document.getElementById('formContent').innerHTML = type === 'instrument'
    ? instrumentForm(item)
    : scoreForm(item);

  document.getElementById('formOverlay').classList.add('open');
}

function instrumentForm(item) {
  const v = (field) => item ? esc(item[field] || '') : '';
  return `
    <h2 class="form-title">${item ? '楽器を編集' : '楽器を追加'}</h2>
    <input type="hidden" id="formId" value="${item ? item.id : ''}">
    <div class="form-group">
      <label class="form-label required">楽器名</label>
      <input type="text" class="form-input" id="f_name" value="${v('name')}" placeholder="例：Bbクラリネット">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">種類</label>
        <input type="text" class="form-input" id="f_type" value="${v('type')}" placeholder="例：クラリネット">
      </div>
      <div class="form-group">
        <label class="form-label">状態</label>
        <select class="form-select" id="f_status">
          <option value="使用中" ${(item?.status==='使用中')?'selected':''}>使用中</option>
          <option value="保管中" ${(item?.status==='保管中')?'selected':''}>保管中</option>
          <option value="修理中" ${(item?.status==='修理中')?'selected':''}>修理中</option>
        </select>
      </div>
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
        <label class="form-label">購入価格（円）</label>
        <input type="number" class="form-input" id="f_price" value="${item?.price || ''}" placeholder="例：150000">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">担当者・所有者</label>
      <input type="text" class="form-input" id="f_owner" value="${v('owner')}" placeholder="例：山田 花子">
    </div>
    <div class="form-group">
      <label class="form-label">楽器画像URL</label>
      <input type="text" class="form-input" id="f_image_url" value="${v('image_url')}" placeholder="Supabase Storageの画像URL">
      <p class="form-file-hint">Supabase Storageにアップロード後、URLを貼り付けてください</p>
    </div>
    <div class="form-group">
      <label class="form-label">備考・メモ</label>
      <textarea class="form-textarea" id="f_notes" placeholder="自由記述...">${v('notes')}</textarea>
    </div>
    <div class="form-actions">
      <button class="cancel-btn" onclick="closeForm()">キャンセル</button>
      <button class="submit-btn" onclick="saveInstrument()">保存</button>
    </div>
  `;
}

function scoreForm(item) {
  const v = (field) => item ? esc(item[field] || '') : '';
  return `
    <h2 class="form-title">${item ? '楽譜を編集' : '楽譜を追加'}</h2>
    <input type="hidden" id="formId" value="${item ? item.id : ''}">
    <div class="form-group">
      <label class="form-label required">曲名</label>
      <input type="text" class="form-input" id="f_title" value="${v('title')}" placeholder="例：宝島">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">作曲者</label>
        <input type="text" class="form-input" id="f_composer" value="${v('composer')}" placeholder="例：和泉宏隆">
      </div>
      <div class="form-group">
        <label class="form-label">ジャンル</label>
        <input type="text" class="form-input" id="f_genre" value="${v('genre')}" placeholder="例：ポップス">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">楽器編成</label>
      <input type="text" class="form-input" id="f_instrumentation" value="${v('instrumentation')}" placeholder="例：吹奏楽フルバンド">
    </div>
    <div class="form-group">
      <label class="form-label">タグ（カンマ区切り）</label>
      <input type="text" class="form-input" id="f_tags" value="${v('tags')}" placeholder="例：ポップス,定番,コンクール">
    </div>
    <div class="form-group">
      <label class="form-label">音源URL</label>
      <input type="text" class="form-input" id="f_audio_url" value="${v('audio_url')}" placeholder="Supabase Storageの音源URL">
      <p class="form-file-hint">MP3・WAVなどをSupabase Storageにアップロード後、URLを貼り付けてください</p>
    </div>
    <div class="form-group">
      <label class="form-label">野球応援楽譜</label>
      <select class="form-select" id="f_is_baseball">
        <option value="false" ${!item?.is_baseball?'selected':''}>いいえ</option>
        <option value="true" ${item?.is_baseball?'selected':''}>はい</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">備考・メモ</label>
      <textarea class="form-textarea" id="f_notes" placeholder="演奏上の注意など...">${v('notes')}</textarea>
    </div>
    <div class="form-actions">
      <button class="cancel-btn" onclick="closeForm()">キャンセル</button>
      <button class="submit-btn" onclick="saveScore()">保存</button>
    </div>
  `;
}

function closeForm() {
  document.getElementById('formOverlay').classList.remove('open');
}

// ============================================================
// 保存処理
// ============================================================
async function saveInstrument() {
  const id = document.getElementById('formId').value;
  const data = {
    name: document.getElementById('f_name').value.trim(),
    type: document.getElementById('f_type').value.trim(),
    status: document.getElementById('f_status').value,
    maker: document.getElementById('f_maker').value.trim(),
    model: document.getElementById('f_model').value.trim(),
    purchase_date: document.getElementById('f_purchase_date').value || null,
    price: parseInt(document.getElementById('f_price').value) || null,
    owner: document.getElementById('f_owner').value.trim(),
    image_url: document.getElementById('f_image_url').value.trim() || null,
    notes: document.getElementById('f_notes').value.trim(),
  };

  if (!data.name) { alert('楽器名は必須です'); return; }

  if (!db || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    // デモ: ローカル更新
    if (id) {
      const idx = allInstruments.findIndex(i => i.id == id);
      if (idx !== -1) allInstruments[idx] = { ...allInstruments[idx], ...data };
    } else {
      data.id = Date.now();
      allInstruments.push(data);
    }
  } else {
    if (id) {
      await db.from('instruments').update(data).eq('id', id);
    } else {
      await db.from('instruments').insert(data);
      await loadData();
    }
  }

  closeForm();
  renderPage();
  if (document.getElementById('adminPanelOverlay').classList.contains('open')) openAdminPanel();
}

async function saveScore() {
  const id = document.getElementById('formId').value;
  const data = {
    title: document.getElementById('f_title').value.trim(),
    composer: document.getElementById('f_composer').value.trim(),
    genre: document.getElementById('f_genre').value.trim(),
    instrumentation: document.getElementById('f_instrumentation').value.trim(),
    tags: document.getElementById('f_tags').value.trim(),
    audio_url: document.getElementById('f_audio_url').value.trim() || null,
    is_baseball: document.getElementById('f_is_baseball').value === 'true',
    notes: document.getElementById('f_notes').value.trim(),
  };

  if (!data.title) { alert('曲名は必須です'); return; }

  if (!db || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    if (id) {
      const idx = allScores.findIndex(s => s.id == id);
      if (idx !== -1) allScores[idx] = { ...allScores[idx], ...data };
    } else {
      data.id = Date.now();
      allScores.push(data);
    }
  } else {
    if (id) {
      await db.from('scores').update(data).eq('id', id);
    } else {
      await db.from('scores').insert(data);
      await loadData();
    }
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
    if (type === 'instrument') {
      allInstruments = allInstruments.filter(i => i.id !== id);
    } else {
      allScores = allScores.filter(s => s.id !== id);
    }
  } else {
    const table = type === 'instrument' ? 'instruments' : 'scores';
    await db.from(table).delete().eq('id', id);
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
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
}

function formatPrice(price) {
  if (!price) return '-';
  return `¥${Number(price).toLocaleString()}`;
}

function statusClass(status) {
  const map = { '使用中': 'badge-active', '修理中': 'badge-repair', '保管中': 'badge-storage' };
  return map[status] || 'badge-storage';
}
