(() => {
  // =====================================================================
  //  CONFIGURAÇÃO — cole aqui a URL do CSV publicado da sua planilha.
  //  (No guia: Google Sheets → Arquivo → Compartilhar → Publicar na web →
  //   aba "Trabalhos" → CSV → Publicar → copie o link e cole abaixo.)
  //  Enquanto estiver vazio, o site usa os dados de exemplo em
  //  data/trabalhos.json.
  const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTmBQmDGsWFbpGSdO9kIexVN_vNdN-dWvtIc1KHhSAdJq33hFBch1DcqYjpEzN7DXLxH7m6R-HPkDKN/pub?gid=204310317&single=true&output=csv";
  // =====================================================================

  const PAISES = [
    'Argentina', 'Bolívia', 'Brasil', 'Chile', 'Colômbia', 'Costa Rica',
    'Cuba', 'El Salvador', 'Equador', 'Estados Unidos', 'Guatemala',
    'Haiti', 'Honduras', 'Jamaica', 'México', 'Nicarágua', 'Panamá',
    'Paraguai', 'Peru', 'Porto Rico', 'República Dominicana',
    'Trinidad e Tobago', 'Uruguai', 'Venezuela'
  ];
  const SECULOS = ['XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
  const PERIODOS = ['América colonial', 'América independente', 'América contemporânea'];

  const state = { all: [], query: '', pais: '', seculo: '', periodo: '', tipo: '' };

  const q = (sel) => document.querySelector(sel);
  const tbody = q('#works-tbody');
  const meta = q('#repo-meta-count');
  const search = q('#search');
  const selPais = q('#filter-pais');
  const selSeculo = q('#filter-seculo');
  const selPeriodo = q('#filter-periodo');
  const selTipo = q('#filter-tipo');
  const clearBtn = q('#clear-filters');

  const populateSelect = (select, values, allLabel) => {
    select.innerHTML = `<option value="">${allLabel}</option>` +
      values.map((v) => `<option value="${v}">${v}</option>`).join('');
  };

  populateSelect(selPais, PAISES, 'Todos os países');
  populateSelect(selSeculo, SECULOS, 'Todos os séculos');
  populateSelect(selPeriodo, PERIODOS, 'Todos os períodos');

  const normalize = (str) =>
    (str || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const matchesFilters = (w) => {
    if (state.pais && w.pais !== state.pais) return false;
    if (state.seculo && w.seculo !== state.seculo) return false;
    if (state.periodo && w.periodo !== state.periodo) return false;
    if (state.tipo && w.tipo !== state.tipo) return false;
    if (state.query) {
      const haystack = normalize(
        [w.titulo, w.autor, w.ano, w.pais, w.tipo, w.periodo, w.seculo].join(' ')
      );
      if (!haystack.includes(normalize(state.query))) return false;
    }
    return true;
  };

  const render = () => {
    const filtered = state.all
      .filter(matchesFilters)
      .sort((a, b) => (b.ano || 0) - (a.ano || 0));

    meta.textContent = `${filtered.length} ${filtered.length === 1 ? 'trabalho' : 'trabalhos'}`;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="4"><div class="no-results">
          Nenhum trabalho encontrado com esses filtros.
        </div></td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map((w) => {
      const tags = [w.pais, `Séc. ${w.seculo}`, w.periodo]
        .filter(Boolean)
        .map((t) => `<span class="tag">${t}</span>`).join('');
      const link = w.arquivo
        ? `<a class="work-download" href="${w.arquivo}" target="_blank" rel="noopener">Baixar PDF ↓</a>`
        : `<span class="tag">Indisponível</span>`;
      return `
        <tr>
          <td class="work-title">
            ${w.titulo}
            <small>${w.tipo || ''}</small>
            <div class="tags">${tags}</div>
          </td>
          <td>${w.autor || '—'}</td>
          <td>${w.ano || '—'}</td>
          <td>${link}</td>
        </tr>`;
    }).join('');
  };

  const bindEvents = () => {
    search.addEventListener('input', (e) => { state.query = e.target.value; render(); });
    selPais.addEventListener('change', (e) => { state.pais = e.target.value; render(); });
    selSeculo.addEventListener('change', (e) => { state.seculo = e.target.value; render(); });
    selPeriodo.addEventListener('change', (e) => { state.periodo = e.target.value; render(); });
    selTipo.addEventListener('change', (e) => { state.tipo = e.target.value; render(); });
    clearBtn.addEventListener('click', () => {
      state.query = state.pais = state.seculo = state.periodo = state.tipo = '';
      search.value = '';
      selPais.value = selSeculo.value = selPeriodo.value = selTipo.value = '';
      render();
    });
  };

  const populateTipos = () => {
    const tipos = [...new Set(state.all.map((w) => w.tipo).filter(Boolean))].sort();
    populateSelect(selTipo, tipos, 'Todos os tipos');
  };

  // ---- Lê CSV (lida com vírgulas dentro de aspas, quebras de linha etc.) ----
  const parseCSV = (text) => {
    text = text.replace(/^\uFEFF/, '');
    const rows = []; let row = [], field = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
        else field += c;
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ',') { row.push(field); field = ''; }
        else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
        else if (c === '\r') { /* ignora */ }
        else field += c;
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    const headers = (rows.shift() || []).map((h) => h.trim());
    return rows
      .filter((r) => r.some((x) => x && x.trim()))
      .map((r) => { const o = {}; headers.forEach((h, i) => o[h] = r[i] !== undefined ? r[i] : ''); return o; });
  };

  // ---- Converte as linhas da planilha nos campos que o site usa ----
  const rowsToWorks = (rows) => {
    const pick = (obj, kw) => {
      for (const k in obj) {
        if (normalize(k).includes(kw)) return (obj[k] || '').toString();
      }
      return '';
    };
    return rows.map((o) => {
      const anoRaw = pick(o, 'ano').replace(/\D/g, '');
      return {
        titulo: pick(o, 'titulo').trim(),
        autor: pick(o, 'autor').trim(),
        ano: anoRaw ? Number(anoRaw) : '',
        pais: pick(o, 'pais').trim(),
        seculo: pick(o, 'seculo').trim(),
        periodo: pick(o, 'periodo').trim(),
        tipo: pick(o, 'tipo').trim(),
        arquivo: (pick(o, 'link') || pick(o, 'pdf')).trim()
      };
    }).filter((w) => w.titulo);
  };

  const boot = (data) => {
    state.all = Array.isArray(data) ? data : [];
    populateTipos();
    bindEvents();
    render();
  };

  const showError = () => {
    tbody.innerHTML = `
      <tr><td colspan="4"><div class="no-results">
        Não foi possível carregar o repositório agora.<br />
        <small>Tente recarregar a página em instantes.</small>
      </div></td></tr>`;
  };

  const loadFromJSON = () => {
    fetch('data/trabalhos.json')
      .then((r) => { if (!r.ok) throw new Error('json'); return r.json(); })
      .then(boot)
      .catch(showError);
  };

  // Se a URL da planilha estiver preenchida, lê de lá; senão, usa o JSON local.
  if (SHEET_CSV_URL && /^https?:\/\//.test(SHEET_CSV_URL)) {
    fetch(SHEET_CSV_URL)
      .then((r) => { if (!r.ok) throw new Error('csv'); return r.text(); })
      .then((t) => boot(rowsToWorks(parseCSV(t))))
      .catch(loadFromJSON); // se a planilha falhar, cai no JSON local
  } else {
    loadFromJSON();
  }
})();
