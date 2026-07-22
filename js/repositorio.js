(() => {
  // =====================================================================
  //  DADOS — o acervo é lido de data/trabalhos.json, versionado no repo.
  //  Para adicionar/editar trabalhos, edite esse arquivo (veja o schema
  //  documentado nele) e faça commit/PR no GitHub.
  // =====================================================================

  const SECULOS = ['XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
  const PERIODOS = ['América pré-hispânica', 'América colonial', 'América independente', 'América contemporânea'];

  const state = { all: [], query: '', pais: '', seculo: '', periodo: '', tipo: '', tematica: '' };

  const q = (sel) => document.querySelector(sel);
  const tbody = q('#works-tbody');
  const meta = q('#repo-meta-count');
  const search = q('#search');
  const selPais = q('#filter-pais');
  const selSeculo = q('#filter-seculo');
  const selPeriodo = q('#filter-periodo');
  const selTipo = q('#filter-tipo');
  const selTematica = q('#filter-tematica');
  const clearBtn = q('#clear-filters');

  const populateSelect = (select, values, allLabel) => {
    select.innerHTML = `<option value="">${allLabel}</option>` +
      values.map((v) => `<option value="${v}">${v}</option>`).join('');
  };

  populateSelect(selSeculo, SECULOS, 'Todos os séculos');
  populateSelect(selPeriodo, PERIODOS, 'Todos os períodos');

  const normalize = (str) =>
    (str || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const escapeHtml = (str) => (str ?? '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  // Restringe o link a http(s) ou caminho relativo; nunca javascript: ou data:.
  const isSafeUrl = (url) => {
    if (!url) return false;
    try {
      const u = new URL(url, window.location.href);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const matchesFilters = (w) => {
    if (state.pais && w.pais !== state.pais) return false;
    if (state.seculo && w.seculo !== state.seculo) return false;
    if (state.periodo && w.periodo !== state.periodo) return false;
    if (state.tipo && w.tipo !== state.tipo) return false;
    if (state.tematica && !w.tematica.includes(state.tematica)) return false;
    if (state.query) {
      const haystack = normalize(
        [w.titulo, w.autor, w.ano, w.pais, w.tipo, w.periodo, w.seculo, ...w.tematica].join(' ')
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
      const tags = [w.pais, w.seculo ? `Séc. ${w.seculo}` : '', w.periodo, ...w.tematica]
        .filter(Boolean)
        .map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('');
      const link = isSafeUrl(w.arquivo)
        ? `<a class="work-download" href="${escapeHtml(w.arquivo)}" target="_blank" rel="noopener">Baixar PDF ↓</a>`
        : `<span class="tag">Indisponível</span>`;
      return `
        <tr>
          <td class="work-title">
            ${escapeHtml(w.titulo)}
            <small>${escapeHtml(w.tipo || '')}</small>
            <div class="tags">${tags}</div>
          </td>
          <td>${escapeHtml(w.autor || '—')}</td>
          <td>${escapeHtml(w.ano || '—')}</td>
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
    selTematica.addEventListener('change', (e) => { state.tematica = e.target.value; render(); });
    clearBtn.addEventListener('click', () => {
      state.query = state.pais = state.seculo = state.periodo = state.tipo = state.tematica = '';
      search.value = '';
      selPais.value = selSeculo.value = selPeriodo.value = selTipo.value = selTematica.value = '';
      render();
    });
  };

  const populateTipos = () => {
    const tipos = [...new Set(state.all.map((w) => w.tipo).filter(Boolean))].sort();
    populateSelect(selTipo, tipos, 'Todos os tipos');
  };

  const populateTematicas = () => {
    const tematicas = [...new Set(state.all.flatMap((w) => w.tematica))].sort();
    populateSelect(selTematica, tematicas, 'Todas as temáticas');
  };

  const populatePaises = () => {
    const paises = [...new Set(state.all.map((w) => w.pais).filter(Boolean))].sort();
    populateSelect(selPais, paises, 'Todas as regiões');
  };

  // Aceita tanto o formato antigo (texto único) quanto o novo (lista), para não quebrar dados já existentes.
  const normalizeTematica = (w) => {
    if (Array.isArray(w.tematica)) { w.tematica = w.tematica.filter(Boolean); }
    else { w.tematica = w.tematica ? [w.tematica] : []; }
  };

  const boot = (data) => {
    state.all = Array.isArray(data) ? data : [];
    state.all.forEach(normalizeTematica);
    populatePaises();
    populateTipos();
    populateTematicas();
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

  fetch('data/trabalhos.json')
    .then((r) => { if (!r.ok) throw new Error('json'); return r.json(); })
    .then(boot)
    .catch(showError);
})();
