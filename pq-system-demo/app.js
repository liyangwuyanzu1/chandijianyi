/* app.js — 植保植检信息管理系统 demo 交互逻辑 */
(function () {
  'use strict';

  /* ---------- 基础辅助 ---------- */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined && html !== null && html !== '') e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function specificCropName(value) {
    var names = {
      '小麦': '小麦种子（济麦22）',
      '大豆': '大豆种子（中黄13）',
      '玉米': '玉米种子（郑单958）'
    };
    return names[value] || value;
  }
  var toastTimer = null;
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  function $(sel, root) { return (root || document).querySelector(sel); }

  /* ---------- 头部日期 ---------- */
  function renderDate() {
    var d = new Date();
    var weeks = ['日', '一', '二', '三', '四', '五', '六'];
    function pad(n) { return n < 10 ? '0' + n : n; }
    $('#dateText').textContent = d.getFullYear() + '年' + pad(d.getMonth() + 1) + '月' + pad(d.getDate()) + '日 星期' + weeks[d.getDay()];
  }

  /* ---------- 顶部模块导航 ---------- */
  function renderModules() {
    var box = $('#moduleNavi');
    MOCK.modules.forEach(function (m, i) {
      var mod = el('div', 'module' + (i === 0 ? ' active' : ''), esc(m));
      mod.addEventListener('click', function () {
        box.querySelectorAll('.module').forEach(function (x) { x.classList.remove('active'); });
        mod.classList.add('active');
      });
      box.appendChild(mod);
    });
  }

  /* ---------- 侧边菜单 ---------- */
  function findMenuTitle(id) {
    var t = '';
    MOCK.menu.forEach(function (m) {
      if (m.type === 'group' && m.subs) m.subs.forEach(function (s) {
        if (s.id === id) t = s.title;
        (s.subs || []).forEach(function (child) { if (child.id === id) t = child.title; });
      });
    });
    return t;
  }

  function renderMenu() {
    var ul = $('#sideMenu');
    MOCK.menu.forEach(function (m) {
      if (m.type === 'group') {
        var li = el('li', 'group ' + (m.interactive ? 'interactive' : 'static') + (m.id === 'cdjy' ? ' open' : ''));
        var menuArrow = 'menu-triangle';
        var title = el('div', 'submenu-title',
          '<i class="iconfont ' + esc(m.icon || '') + '"></i><span>' + esc(m.title) + '</span><i class="' + menuArrow + ' arrow"></i>');
        title.addEventListener('click', function () {
          li.classList.toggle('open');
          var ar = $('.arrow', title);
          if (ar) ar.classList.toggle('open');
        });
        li.appendChild(title);
        var subList = el('ul', 'sub-list');
        (m.subs || []).forEach(function (s) {
          if (s.subs && s.subs.length) {
            var nested = el('li', 'nested-group');
            var nestedArrow = 'menu-triangle';
            var nestedTitle = el('div', 'nested-title', '<span>' + esc(s.title) + '</span><i class="' + nestedArrow + ' arrow"></i>');
            nestedTitle.addEventListener('click', function (event) {
              event.stopPropagation();
              nested.classList.toggle('open');
              $('.arrow', nestedTitle).classList.toggle('open');
            });
            nested.appendChild(nestedTitle);
            var nestedList = el('ul', 'nested-list');
            s.subs.forEach(function (child) {
              var nestedItem = el('li', 'sub-item nested-item', esc(child.title));
              nestedItem.setAttribute('data-page', child.id);
              nestedItem.addEventListener('click', function () { openPage(child.id); });
              nestedList.appendChild(nestedItem);
            });
            nested.appendChild(nestedList);
            subList.appendChild(nested);
            return;
          }
          var si = el('li', 'sub-item', esc(s.title));
          si.setAttribute('data-page', s.id);
          if (m.interactive) {
            si.addEventListener('click', function () { openPage(s.id); });
          } else {
            si.classList.add('static-item');
            si.addEventListener('click', function (e) { e.stopPropagation(); });
          }
          subList.appendChild(si);
        });
        li.appendChild(subList);
        ul.appendChild(li);
      } else {
        var item = el('li', 'menu-item static-item',
          '<i class="iconfont ' + esc(m.icon || '') + '"></i><span>' + esc(m.title) + '</span>');
        item.addEventListener('click', function (e) { e.stopPropagation(); });
        ul.appendChild(item);
      }
    });
  }

  /* ---------- 缓存页签管理 ---------- */
  var pages = {};      // id -> { title, tabEl, contentEl }
  var activeId = null;

  function setActiveMenu(id) {
    document.querySelectorAll('.sub-item').forEach(function (x) {
      x.classList.toggle('active', x.getAttribute('data-page') === id);
    });
  }

  function openPage(id) {
    if (!MOCK.pages[id]) return;
    var data = MOCK.pages[id];
    var title = findMenuTitle(id);
    var cacheBox = $('#cachePages');
    var container = $('#tabContainer');

    if (!pages[id]) {
      var tab = el('div', 'page-tab', '<span>' + esc(title) + '</span><i class="tab-close">×</i>');
      tab.addEventListener('click', function (e) {
        if (e.target.classList.contains('tab-close')) {
          closePage(id);
          return;
        }
        activate(id);
      });
      cacheBox.appendChild(tab);
      var content = el('div', 'page-content');
      container.appendChild(content);
      pages[id] = { title: title, tabEl: tab, contentEl: content };
    }
    activate(id);

    function activate(pid) {
      Object.keys(pages).forEach(function (k) {
        pages[k].tabEl.classList.remove('active');
        pages[k].contentEl.style.display = 'none';
      });
      pages[pid].tabEl.classList.add('active');
      pages[pid].contentEl.style.display = 'block';
      activeId = pid;
      setActiveMenu(pid);
      renderBreadcrumb(MOCK.pages[pid].breadcrumb);
      if (!pages[pid].rendered) {
        pages[pid].contentEl.appendChild(renderPage(pid, MOCK.pages[pid]));
        pages[pid].rendered = true;
      }
    }
  }

  function closePage(id) {
    if (!pages[id]) return;
    pages[id].tabEl.remove();
    pages[id].contentEl.remove();
    delete pages[id];
    if (activeId === id) {
      var rest = Object.keys(pages);
      if (rest.length) openPage(rest[rest.length - 1]);
      else {
        activeId = null;
        $('#tabContainer').innerHTML = '';
        renderBreadcrumb([]);
      }
    }
  }

  function renderBreadcrumb(list) {
    var b = $('#breadcrumb');
    b.innerHTML = '';
    (list || []).forEach(function (t, i) {
      if (i > 0) b.appendChild(el('span', 'sep', '/'));
      b.appendChild(el('span', 'crumb-item' + (i === list.length - 1 ? ' last' : ''), esc(t)));
    });
  }

  /* ---------- 页面分发 ---------- */
  function renderPage(id, data) {
    if (id === 'zhcx') return renderZhcx(data);
    if (id === 'cjsq') return renderCjsq(data);
    if (data.uav) return renderUavEmbeddedPage(id, data);
    return renderListPage(id, data);
  }

  /* ---------- 无人机巡田：嵌入原 UAV 系统模块 ---------- */
  var UAV_MODULE_ROUTES = {
    'uav-device': 'device-management',
    'uav-field': 'field-management',
    'uav-plan': 'flight-plan',
    'uav-monitor': 'real-time-monitoring',
    'uav-record': 'flight-records',
    'uav-data': 'data-management'
  };

  window.UAV_FLIGHT_CONTEXT = window.UAV_FLIGHT_CONTEXT || null;

  function renderUavEmbeddedPage(id, data) {
    var page = el('div', 'uav-embedded-page');
    var frame = document.createElement('iframe');
    frame.className = 'uav-embedded-frame';
    frame.title = '无人机巡田 - ' + data.module;
    frame.setAttribute('allow', 'fullscreen');
    var context = id === 'uav-record' && window.UAV_FLIGHT_CONTEXT ? window.UAV_FLIGHT_CONTEXT : null;
    frame.src = 'uav/index.html?embed=1&module=' + encodeURIComponent(UAV_MODULE_ROUTES[id]) +
      (context && context.fieldName ? '&field=' + encodeURIComponent(context.fieldName) : '');
    page.appendChild(frame);
    return page;
  }

  /* ---------- 无人机巡田（承接 UAV 系统六个核心模块） ---------- */
  function renderUavPage(data) {
    var page = el('div', 'uav-page');
    var heading = el('div', 'uav-heading');
    heading.innerHTML = '<div><h2>' + esc(data.module) + '</h2><p>无人机巡田 · 产地检疫业务数据</p></div>';
    var create = el('button', 'btn-primary', data.module === '飞行计划' ? '新建飞行计划' : data.module === '地点管理' ? '新增检疫地点' : '导出列表');
    create.type = 'button';
    create.addEventListener('click', function () { toast('演示环境：' + create.textContent + '操作已记录'); });
    heading.appendChild(create);
    page.appendChild(heading);

    var metrics = el('div', 'uav-metrics');
    data.metrics.forEach(function (metric, index) {
      metrics.insertAdjacentHTML('beforeend', '<div class="uav-metric"><span class="uav-metric-mark mark-' + index + '"></span><div><small>' + esc(metric[0]) + '</small><strong>' + esc(metric[1]) + '<em>' + esc(metric[2]) + '</em></strong></div></div>');
    });
    page.appendChild(metrics);

    var search = el('div', 'uav-search');
    data.filters.forEach(function (label) {
      var item = el('label', 'uav-search-item');
      item.appendChild(el('span', '', esc(label) + '：'));
      var input = document.createElement('input');
      input.type = 'text'; input.placeholder = '请输入';
      item.appendChild(input);
      search.appendChild(item);
    });
    var query = el('button', 'btn-primary', '查询');
    query.type = 'button';
    query.addEventListener('click', function () { toast('查询完成，共 ' + data.rows.length + ' 条'); });
    search.appendChild(query);
    page.appendChild(search);

    if (data.map || data.monitor) page.appendChild(renderUavMapPanel(data));
    page.appendChild(renderUavTable(data));
    return page;
  }

  function renderUavMapPanel(data) {
    var panel = el('section', 'uav-map-panel');
    var map = el('div', 'uav-map');
    map.innerHTML = '<div class="uav-map-grid"></div><div class="uav-route"><i></i><i></i><i></i><i></i><i></i></div><div class="uav-map-label">' + (data.monitor ? '实时飞行轨迹 · 中国水稻研究所嘉兴水稻品种示范田' : '检疫地块空间分布 · 嘉兴市') + '</div><div class="uav-drone">✦</div>';
    panel.appendChild(map);
    var side = el('div', 'uav-map-side');
    side.innerHTML = data.monitor
      ? '<h3>飞行遥测</h3><dl><dt>飞行高度</dt><dd>85 m</dd><dt>当前速度</dt><dd>7.2 m/s</dd><dt>剩余电量</dt><dd>82%</dd><dt>采集进度</dt><dd>68%</dd></dl><div class="uav-progress"><span style="width:68%"></span></div><p class="uav-alert">● 低电量预警 1 条</p>'
      : '<h3>地块图层</h3><dl><dt>已登记地块</dt><dd>126 块</dd><dt>待巡查地块</dt><dd>16 块</dd><dt>风险预警地块</dt><dd>3 块</dd><dt>累计检疫面积</dt><dd>8,920 亩</dd></dl><p class="uav-map-tip">点击地块可查看历次飞行、识别成果及检疫结论。</p>';
    panel.appendChild(side);
    return panel;
  }

  function renderUavTable(data) {
    var section = el('section', 'uav-table-section');
    var title = el('div', 'uav-section-title', data.module + '列表');
    section.appendChild(title);
    var table = el('table', 'el-table uav-table');
    var head = document.createElement('thead');
    var tr = document.createElement('tr');
    data.headers.forEach(function (header) { tr.appendChild(el('th', '', esc(header))); });
    tr.appendChild(el('th', '', '操作'));
    head.appendChild(tr);
    table.appendChild(head);
    var body = document.createElement('tbody');
    data.rows.forEach(function (row) {
      var rowEl = document.createElement('tr');
      row.forEach(function (cell, index) {
        var cellClass = index === row.length - 1 ? 'cell uav-status' : 'cell';
        rowEl.appendChild(el('td', cellClass, esc(cell)));
      });
      var actions = el('td', 'cell');
      var detail = el('button', 'op-btn', '查看详情');
      detail.type = 'button';
      detail.addEventListener('click', function () { showUavDetail(data, row); });
      actions.appendChild(detail);
      rowEl.appendChild(actions);
      body.appendChild(rowEl);
    });
    table.appendChild(body);
    section.appendChild(table);
    section.appendChild(buildPagination(data.rows.length, 1, function () { toast('演示环境：分页未开放'); }));
    return section;
  }

  function showUavDetail(data, row) {
    var mask = el('div', 'uav-detail-mask');
    var dialog = el('div', 'uav-detail');
    dialog.innerHTML = '<div class="uav-detail-head"><strong>' + esc(data.module) + '详情</strong><button type="button">×</button></div>';
    var grid = el('div', 'uav-detail-grid');
    data.headers.forEach(function (header, index) {
      grid.appendChild(el('div', '', '<span>' + esc(header) + '：</span><b>' + esc(row[index]) + '</b>'));
    });
    dialog.appendChild(grid);
    var foot = el('div', 'uav-detail-foot');
    var close = el('button', 'btn-primary', '关闭');
    close.type = 'button';
    close.addEventListener('click', function () { mask.remove(); });
    foot.appendChild(close);
    dialog.appendChild(foot);
    $('.uav-detail-head button', dialog).addEventListener('click', function () { mask.remove(); });
    mask.appendChild(dialog);
    document.body.appendChild(mask);
  }

  /* ---------- 列表页（查询 + 表格 + 分页） ---------- */
  var pageStates = {}; // id -> { filtered, pageNo }

  function renderListPage(id, data) {
    var wrap = el('div', 'list-page');
    var state = pageStates[id] = { allRows: data.rows.slice(), filtered: data.rows.slice(), pageNo: 1 };

    /* 查询区 */
    var area = el('div', 'query-area' + (id === 'cjcx' ? ' cjcx-area' : ''));
    var form = el('div', 'query-form' + (id === 'cjcx' ? ' cjcx-form' : ''));
    data.query.forEach(function (q) { form.appendChild(buildQueryItem(q)); });
    area.appendChild(form);

    /* 产检查询扩展条件（radio / checkbox 行） */
    if (data.scopeRadios || data.filterRadios || data.statusChecks) {
      var ext = el('div', 'ext-filters');
      if (data.scopeRadios) {
        var rr = el('div', 'radio-row');
        data.scopeRadios.forEach(function (o, i) {
          rr.insertAdjacentHTML('beforeend', '<label><input type="radio" name="scope_' + id + '"' + (i === 0 ? ' checked' : '') + '>' + esc(o) + '</label>');
        });
        ext.appendChild(rr);
      }
      if (data.filterRadios) {
        var fr = el('div', 'radio-row');
        data.filterRadios.forEach(function (o, i) {
          fr.insertAdjacentHTML('beforeend', '<label><input type="radio" name="orgf_' + id + '"' + (i === 0 ? ' checked' : '') + '>' + esc(o) + '</label>');
        });
        ext.appendChild(fr);
      }
      if (data.statusChecks) {
        var cr = el('div', 'check-row');
        data.statusChecks.forEach(function (o) {
          cr.insertAdjacentHTML('beforeend', '<label><input type="checkbox" value="' + esc(o) + '">' + esc(o) + '</label>');
        });
        ext.appendChild(cr);
      }
      if (id === 'cjcx') form.appendChild(ext);
      else area.appendChild(ext);
    }

    /* 操作按钮（右侧竖排） */
    var btns = el('div', 'query-btns');
    data.buttons.forEach(function (bt) {
      var b = el('button', 'btn-primary', esc(bt));
      b.type = 'button';
      b.addEventListener('click', function () {
        if (bt === '查询') { doFilter(); }
        else toast('演示环境：' + bt + '操作未开放');
      });
      btns.appendChild(b);
    });
    area.appendChild(btns);
    wrap.appendChild(area);

    /* 表格 */
    var tw = el('div', 'table-wrap');
    var table = el('table', 'el-table');
    var thead = document.createElement('thead');
    var htr = document.createElement('tr');
    data.headers.forEach(function (h) { htr.appendChild(el('th', '', esc(h))); });
    if (data.opers || data.opersPerRow) htr.appendChild(el('th', '', '操作'));
    thead.appendChild(htr);
    table.appendChild(thead);
    var tbody = el('tbody');
    table.appendChild(tbody);
    tw.appendChild(table);
    wrap.appendChild(tw);

    /* 分页 */
    var pgBox = el('div', '');
    wrap.appendChild(pgBox);

    function buildOperBtns(text, row) {
      var isFieldSurvey = id === 'tjdc';
      var td = el('td', 'cell' + (isFieldSurvey ? ' field-survey-operation-cell' : ''));
      var actions = isFieldSurvey ? el('div', 'field-survey-operation-actions') : td;
      text.split('|').forEach(function (op) {
        var b = el('button', 'op-btn', esc(op));
        b.type = 'button';
        b.addEventListener('click', function () { openOperation(op, row); });
        actions.appendChild(b);
      });
      if (isFieldSurvey) td.appendChild(actions);
      return td;
    }

    function openOperation(op, row) {
      if (op === '办理' && id === 'tjdc') {
        showFieldActionDialog(function (action) { showSecondaryPage(action, row); });
        return;
      }
      showSecondaryPage(op, row);
    }

    function showSecondaryPage(op, row) {
      var secondary = renderOperationPage(id, data, row, op, function () {
        secondary.remove();
        wrap.style.display = '';
      });
      wrap.style.display = 'none';
      wrap.parentNode.appendChild(secondary);
    }

    function renderRows() {
      tbody.innerHTML = '';
      var pageSize = 10;
      var start = (state.pageNo - 1) * pageSize;
      var view = state.filtered.slice(start, start + pageSize);
      if (!view.length) {
        var tre = document.createElement('tr');
        var tde = el('td', 'table-empty', '暂无数据');
        tde.colSpan = data.headers.length + 1;
        tre.appendChild(tde);
        tbody.appendChild(tre);
      } else {
        view.forEach(function (r, ri) {
          var tr = document.createElement('tr');
          r.forEach(function (cell, index) {
            var displayCell = data.headers[index] && (data.headers[index].indexOf('植物名称') >= 0 || data.headers[index] === '作物')
              ? specificCropName(cell) : cell;
            tr.appendChild(el('td', 'cell', esc(displayCell)));
          });
          if (data.opersPerRow) tr.appendChild(buildOperBtns(data.opersPerRow[start + ri] || '查看详情', r));
          else if (data.opers) tr.appendChild(buildOperBtns(data.opers, r));
          tbody.appendChild(tr);
        });
      }
      pgBox.innerHTML = '';
      pgBox.appendChild(buildPagination(state.filtered.length, state.pageNo, function (p) {
        state.pageNo = p;
        renderRows();
      }));
    }

    function doFilter() {
      var conds = [];
      wrap.querySelectorAll('[data-qkey]').forEach(function (inp) {
        var k = inp.getAttribute('data-qkey').split('_')[0];
        if (inp.value.trim()) conds.push({ key: k, val: inp.value.trim() });
      });
      var checked = [];
      wrap.querySelectorAll('.check-row input:checked').forEach(function (c) { checked.push(c.value); });
      state.filtered = state.allRows.filter(function (r) {
        for (var i = 0; i < conds.length; i++) {
          var col = data.filterKeys[conds[i].key];
          if (col === undefined) continue;
          if (String(r[col]).indexOf(conds[i].val) < 0) return false;
        }
        if (checked.length) {
          var st = r[r.length - 1];
          if (checked.indexOf(st) < 0) return false;
        }
        return true;
      });
      state.pageNo = 1;
      renderRows();
      toast('查询完成，共 ' + state.filtered.length + ' 条');
    }

    renderRows();
    return wrap;
  }

  /* ---------- 分页（Element UI 复刻） ---------- */
  function buildPagination(total, current, onGo) {
    var pg = el('div', 'pagination');
    var pageSize = 10;
    var pageCount = Math.max(1, Math.ceil(total / pageSize));

    var info = el('div', 'total-info', '共 <span class="num">' + total + '</span> 条');
    pg.appendChild(info);

    function btn(txt, page, cls) {
      var b = el('button', 'pg-btn' + (cls ? ' ' + cls : ''), txt);
      b.type = 'button';
      if (!(cls && (cls.indexOf('disabled') >= 0 || cls.indexOf('active') >= 0))) {
        b.addEventListener('click', function () { onGo(page); });
      }
      pg.appendChild(b);
      return b;
    }
    function numBtn(n) { btn(String(n), n, n === current ? 'active' : ''); }

    btn('<', current - 1, current <= 1 ? 'disabled' : '');
    if (pageCount <= 7) {
      for (var i = 1; i <= pageCount; i++) numBtn(i);
    } else {
      numBtn(1);
      if (current > 3) pg.appendChild(el('span', 'ellipsis', '...'));
      var s = Math.max(2, current - 1), e2 = Math.min(pageCount - 1, current + 1);
      for (var j = s; j <= e2; j++) numBtn(j);
      if (current < pageCount - 2) pg.appendChild(el('span', 'ellipsis', '...'));
      numBtn(pageCount);
    }
    btn('>', current + 1, current >= pageCount ? 'disabled' : '');

    var sizeSel = document.createElement('select');
    sizeSel.className = 'size-select';
    [10, 20, 50].forEach(function (n) { sizeSel.appendChild(new Option(n + '条/页', n)); });
    pg.appendChild(sizeSel);

    pg.appendChild(el('span', 'jump-label', '前往'));
    var jump = document.createElement('input');
    jump.type = 'text';
    jump.className = 'jump-input';
    jump.value = current;
    jump.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var v = parseInt(jump.value, 10);
        if (v >= 1 && v <= pageCount) onGo(v);
      }
    });
    pg.appendChild(jump);
    pg.appendChild(el('span', 'jump-label', '页'));
    return pg;
  }

  /* ---------- 列表操作：二级业务页面 ---------- */
  function showFieldActionDialog(onSelect) {
    var mask = el('div', 'action-modal-mask');
    var dialog = el('div', 'action-modal');
    dialog.innerHTML = '<div class="action-modal-head"><span>系统提示</span><button type="button" class="modal-close">×</button></div>' +
      '<div class="action-modal-body"><div class="modal-warning">!</div><div><strong>请注意！</strong><p>请选择田间调查操作：</p></div></div>' +
      '<div class="action-modal-actions"><button type="button" class="btn-light">继续田间调查</button><button type="button" class="btn-primary">做疫情总体结论</button></div>';
    function close() { mask.remove(); }
    $('.modal-close', dialog).addEventListener('click', close);
    $('.btn-light', dialog).addEventListener('click', function () { close(); onSelect('继续田间调查'); });
    $('.btn-primary', dialog).addEventListener('click', function () { close(); onSelect('做疫情总体结论'); });
    mask.appendChild(dialog);
    document.body.appendChild(mask);
  }

  function renderOperationPage(id, data, row, operation, onBack) {
    if (id === 'tjdc' && (operation === '继续田间调查' || operation === '做疫情总体结论')) {
      return renderFieldSurveyPage(data, row, operation, onBack);
    }
    var view = el('div', 'operation-page');
    var header = el('div', 'operation-topbar');
    var back = el('button', 'btn-back', '‹ 返回');
    back.type = 'button';
    back.addEventListener('click', onBack);
    header.appendChild(back);
    header.appendChild(el('div', 'operation-title', operationPageTitle(id, operation)));
    view.appendChild(header);

    if (operation === '查看流程') {
      view.appendChild(renderFlowPage(data, row));
      return view;
    }
    if (operation === '查看' || operation === '查看详情') {
      view.appendChild(renderDetailPage(data, row));
      return view;
    }
    if (operation === '作废证书' || operation === '写备注') {
      view.appendChild(renderSupplementPage(data, row, operation, onBack));
      return view;
    }
    view.appendChild(renderHandlingPage(id, data, row, operation, onBack));
    return view;
  }

  function renderFieldSurveyPage(data, row, operation, onBack) {
    var page = el('div', 'field-survey-page' + (operation === '做疫情总体结论' ? ' conclusion-mode' : ''));
    var toolbar = el('div', 'field-survey-toolbar');
    var confirm = el('button', 'btn-primary', '确认');
    confirm.type = 'button';
    confirm.addEventListener('click', function () { toast('田间调查记录已确认'); onBack(); });
    var back = el('button', 'btn-light', '返回列表');
    back.type = 'button';
    back.addEventListener('click', onBack);
    toolbar.appendChild(confirm);
    toolbar.appendChild(back);
    page.appendChild(toolbar);

    var status = el('div', 'survey-status');
    status.innerHTML = '<span>审批状态：<strong>待田间调查</strong></span>' +
      '<span>检疫单证号：<strong>' + esc(row[1]) + '</strong></span>' +
      '<span>申报单位：<strong>' + esc(row[2]) + '</strong></span>';
    page.appendChild(status);
    page.appendChild(el('div', 'survey-title', '产地检疫田间调查记录表'));

    var form = el('div', 'survey-form');
    form.appendChild(surveySection('基本信息', function (grid) {
      grid.appendChild(surveyInput('受检单位：', row[2]));
      grid.appendChild(surveyInput('联系人：', '金禾'));
      grid.appendChild(surveyInput('联系电话：', '13001234567'));
      grid.appendChild(surveyInput('调查日期：', '2026-08-25', 'date'));
      grid.appendChild(surveyAddress());
      grid.appendChild(surveyInput('经度：', '', 'text', '350'));
      grid.appendChild(surveyInput('纬度：', '', 'text', '350'));
      grid.appendChild(surveyInput('海拔：', '', 'text', '500'));
      grid.appendChild(surveyInput('植物名称：', specificCropName(row[3])));
      grid.appendChild(surveySelect('产出用途：', ['种子', '苗木繁殖材料', '其他（非种用）']));
      grid.appendChild(surveyDateRange());
      grid.appendChild(surveyInput('总种植面积：', '1'));
      grid.appendChild(surveyInput('总预计产量：', '1'));
      grid.appendChild(surveyInput('总核定产量：', '0'));
      grid.appendChild(surveyInput('植物生育期：', '', 'text', '', '请输入植物生育期'));
    }));

    form.appendChild(surveyPlantTable());
    form.appendChild(surveyMethods());
    form.appendChild(surveyPests());
    form.appendChild(surveyRemark());
    form.appendChild(surveyPhotos());
    form.appendChild(renderDronePatrolConclusion(row));
    form.appendChild(surveySection('检疫机构信息', function (grid) {
      grid.appendChild(surveyInput('检疫机构：', '河北省植保植检总站'));
      grid.appendChild(surveyInput('记录员：', '河北省系统管理员'));
      grid.appendChild(surveyInput('检疫机构负责人：', '安沫平', 'text', '', '', 'full'));
      grid.appendChild(surveyInput('当事人(签名)：', '', 'text', '', '输入'));
      grid.appendChild(surveyInput('检疫员(签名)：', '', 'text', '', '输入，第一个'));
      grid.appendChild(surveyInput('联系电话：', '0311-86685555'));
      grid.appendChild(surveyInput('录入日期：', '2026-08-25', 'date'));
    }));

    form.appendChild(surveyConclusion());
    page.appendChild(form);
    return page;
  }

  function surveySection(title, fill) {
    var section = el('section', 'survey-section');
    section.appendChild(el('div', 'survey-section-title', esc(title)));
    var grid = el('div', 'survey-grid');
    fill(grid);
    section.appendChild(grid);
    return section;
  }

  function surveyInput(label, value, type, width, placeholder, size) {
    var item = el('label', 'survey-field' + (size === 'full' ? ' full' : ''));
    item.appendChild(el('span', '', esc(label)));
    var input = document.createElement('input');
    input.type = type === 'date' ? 'text' : 'text';
    input.value = value || '';
    input.placeholder = placeholder || '请输入';
    if (width) input.style.maxWidth = width + 'px';
    item.appendChild(input);
    return item;
  }

  function surveySelect(label, options, size) {
    var item = el('label', 'survey-field' + (size === 'full' ? ' full' : ''));
    item.appendChild(el('span', '', esc(label)));
    var select = document.createElement('select');
    options.forEach(function (option) { select.appendChild(new Option(option, option)); });
    item.appendChild(select);
    return item;
  }

  function surveyTextarea(label, placeholder, size) {
    var item = el('label', 'survey-field survey-textarea' + (size === 'full' ? ' full' : ''));
    item.appendChild(el('span', '', esc(label)));
    var textarea = document.createElement('textarea');
    textarea.placeholder = placeholder;
    item.appendChild(textarea);
    return item;
  }

  function surveyAddress() {
    var item = el('div', 'survey-field survey-address full');
    item.appendChild(el('span', '', '调查地点：'));
    var location = (MOCK.locations && MOCK.locations[0]) || { province: '浙江省', city: '嘉兴市', district: '南湖区', town: '七星街道', name: '' };
    [location.province, location.city, location.district, location.town].forEach(function (value) {
      var select = document.createElement('select');
      select.appendChild(new Option(value, value));
      item.appendChild(select);
    });
    var input = document.createElement('input');
    input.value = location.name;
    input.placeholder = '请输入详细地址';
    item.appendChild(input);
    return item;
  }

  function surveyDateRange() {
    var item = el('div', 'survey-field survey-date-range full');
    item.appendChild(el('span', '', '种植期限：'));
    ['2026-05-10', '2026-10-10'].forEach(function (value, index) {
      var input = document.createElement('input');
      input.value = value;
      item.appendChild(input);
      if (index === 0) item.appendChild(el('em', '', '至'));
    });
    return item;
  }

  function surveyPlantTable() {
    var section = el('section', 'survey-section survey-plant-table');
    var table = el('table', 'survey-table');
    table.innerHTML = '<thead><tr><th>品种名称</th><th>种植面积</th><th>预计产量</th><th>核定产量</th><th>单位产量<br>(千克/亩)</th><th>关联证书</th></tr></thead>' +
      '<tbody><tr><td>中黄13</td><td>1 亩</td><td>1 千克</td><td><input type="text" placeholder="请输入"></td><td><input type="text" placeholder="请输入"></td><td>无关联证书</td></tr></tbody>';
    section.appendChild(table);
    return section;
  }

  function surveyMethods() {
    var section = el('section', 'survey-section survey-methods');
    section.appendChild(el('div', 'survey-section-title', '调查方法(至少一项)'));
    var body = el('div', 'method-options');
    ['5点取样', '对角线', '9点取样', '平行线', '棋盘式', 'Z字型', '随机抽样'].forEach(function (method, index) {
      body.insertAdjacentHTML('beforeend', '<label><input type="checkbox"' + (index === 0 ? ' checked' : '') + '>' + esc(method) + '</label>');
    });
    body.insertAdjacentHTML('beforeend', '<label>其他：<input type="text" placeholder="请输入"></label>');
    section.appendChild(body);
    return section;
  }

  function surveyPests() {
    var section = el('section', 'survey-section survey-pests');
    section.appendChild(el('div', 'survey-section-title', '应检有害生物'));
    var field = el('label', 'survey-field survey-textarea full');
    field.appendChild(el('span', '', '应检有害生物：'));
    var textarea = document.createElement('textarea');
    textarea.placeholder = '点击右侧按钮可选择应检有害生物；系统中未维护的有害生物可手动录入';
    field.appendChild(textarea);
    section.appendChild(field);
    var button = el('button', 'btn-light survey-add-pest', '添加有害生物');
    button.type = 'button';
    button.addEventListener('click', function () { toast('已打开有害生物选择'); });
    section.appendChild(button);
    return section;
  }

  function surveyRemark() {
    var section = el('section', 'survey-section');
    section.appendChild(el('div', 'survey-section-title', '备注'));
    section.appendChild(surveyTextarea('备注：', '请输入备注，500字以内', 'full'));
    return section;
  }

  function surveyPhotos() {
    var section = el('section', 'survey-section');
    section.appendChild(el('div', 'survey-section-title', '上传现场照片'));
    var upload = el('div', 'survey-upload');
    upload.innerHTML = '<span>现场照片：</span><div class="survey-photo-list">' +
      '<figure class="drone-photo drone-photo-one" role="img" aria-label="无人机巡田影像一"><figcaption>无人机巡田影像 01</figcaption></figure>' +
      '<figure class="drone-photo drone-photo-two" role="img" aria-label="无人机巡田影像二"><figcaption>无人机巡田影像 02</figcaption></figure>' +
      '<button type="button" class="survey-upload-box" title="新增现场照片">+</button></div>' +
      '<small>已同步2张巡田影像；大小小于8MB，支持上传图片和pdf文件</small>';
    $('.survey-upload-box', upload).addEventListener('click', function () { toast('演示环境：上传未开放'); });
    section.appendChild(upload);
    return section;
  }

  function surveyConclusion() {
    var section = el('section', 'survey-conclusion');
    var choice = el('label', 'survey-conclusion-choice');
    choice.appendChild(el('span', '', '本次调查结论：'));
    var select = document.createElement('select');
    ['请选择调查结论', '现场确诊未发现应检有害生物', '现场确诊发现应检有害生物', '现场不能确诊，需要采样进行实验室检验'].forEach(function (option) {
      select.appendChild(new Option(option, option));
    });
    choice.appendChild(select);
    section.appendChild(choice);

    var discovery = el('label', 'survey-discovery');
    discovery.appendChild(el('span', '', '输入发现应检有害生物：'));
    var textarea = document.createElement('textarea');
    textarea.rows = 2;
    discovery.appendChild(textarea);
    section.appendChild(discovery);
    select.addEventListener('change', function () {
      discovery.classList.toggle('show', select.value === '现场确诊发现应检有害生物');
    });
    return section;
  }

  function renderDronePatrolConclusion(row) {
    var section = surveySection('无人机巡田结论', function (grid) {
      grid.appendChild(surveyReadonly('作物名称：', specificCropName(row[3])));
      grid.appendChild(surveyReadonly('作物生育期：', '抽穗期'));
      grid.appendChild(surveyReadonly('种植面积：', '126.8 亩'));
      grid.appendChild(surveyReadonly('群体郁闭程度：', '0.86'));
      grid.appendChild(surveyReadonly('平均株高：', '78.4 厘米'));
      grid.appendChild(surveyReadonly('产量：', '684.2 千克/亩'));
    });
    section.classList.add('drone-conclusion-section');
    $('.survey-section-title', section).insertAdjacentHTML('beforeend', '<em>巡田数据已同步</em>');
    var patrolConclusion = el('div', 'drone-patrol-result');
    patrolConclusion.innerHTML = '<div class="drone-result-label">巡田识别结果</div>' +
      '<div class="drone-result-status">疑似发现检疫有害生物或病虫害（发现危害状）</div>' +
      '<div class="drone-result-detail"><strong>影像依据：</strong>局部叶片出现褐色斑块、叶色失绿，冠层长势不均，部分植株表现出矮化、偏斜等异常形态；当前仅判定为疑似危害状，不作病虫害种类确诊。</div>' +
      '<div class="drone-result-detail"><strong>处置建议：</strong>已标记疑似异常区域，建议现场复核并采集典型植株和叶片样品，送实验室进一步检验。</div>';
    section.appendChild(patrolConclusion);
    var action = el('div', 'drone-conclusion-actions');
    var recordButton = el('button', 'btn-light', '查看飞行记录');
    recordButton.type = 'button';
    recordButton.addEventListener('click', function () {
      window.UAV_FLIGHT_CONTEXT = { fieldName: (MOCK.locations && MOCK.locations[0] ? MOCK.locations[0].name : '中国水稻研究所嘉兴水稻品种示范田'), surveyDocumentNo: row[1] };
      if (pages['uav-record']) closePage('uav-record');
      openPage('uav-record');
    });
    action.appendChild(recordButton);
    section.appendChild(action);
    return section;
  }

  function surveyReadonly(label, value) {
    var item = el('label', 'survey-field survey-readonly');
    item.appendChild(el('span', '', esc(label)));
    var input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.disabled = true;
    item.appendChild(input);
    return item;
  }

  function operationPageTitle(id, operation) {
    var titles = {
      cjsl: '产地检疫申请受理',
      tjdc: operation === '做疫情总体结论' ? '田间调查总体结论' : '田间调查记录',
      sysjy: '实验室检验办理',
      qfzs: '产地检疫合格证签发',
      cjcx: '产地检疫业务办理'
    };
    if (operation === '查看流程') return '产地检疫办理流程';
    if (operation === '查看' || operation === '查看详情') return '产地检疫业务详情';
    if (operation === '作废证书') return '产地检疫证书作废';
    if (operation === '写备注') return '产检业务备注';
    return titles[id] || '产地检疫业务办理';
  }

  function casePairs(data, row) {
    var pairs = [];
    data.headers.forEach(function (header, index) {
      if (header !== '序号' && row[index] !== undefined) pairs.push({ label: header, value: row[index] || '—' });
    });
    return pairs;
  }

  function renderSummary(data, row) {
    var card = el('section', 'case-section case-summary');
    card.appendChild(el('div', 'case-section-title', '业务基本信息'));
    var grid = el('div', 'case-grid');
    casePairs(data, row).forEach(function (pair) {
      grid.appendChild(el('div', 'case-item', '<span>' + esc(pair.label) + '：</span><strong>' + esc(pair.value) + '</strong>'));
    });
    card.appendChild(grid);
    return card;
  }

  function renderDetailPage(data, row) {
    var box = el('div', 'operation-content');
    box.appendChild(renderSummary(data, row));
    var detail = el('section', 'case-section');
    detail.appendChild(el('div', 'case-section-title', '申报及办理信息'));
    var grid = el('div', 'case-grid');
    [
      ['申报联系人', '张晓明'], ['联系电话', '0311-86012345'],
      ['种植地点', '河北省石家庄市正定县'], ['种植面积', '120 亩'],
      ['受理日期', row[6] || '2026-08-08'], ['经办人员', '系统管理员']
    ].forEach(function (pair) {
      grid.appendChild(el('div', 'case-item', '<span>' + esc(pair[0]) + '：</span><strong>' + esc(pair[1]) + '</strong>'));
    });
    detail.appendChild(grid);
    box.appendChild(detail);
    return box;
  }

  function renderFlowPage(data, row) {
    var box = el('div', 'operation-content');
    box.appendChild(renderSummary(data, row));
    var flow = el('section', 'case-section');
    flow.appendChild(el('div', 'case-section-title', '办理流程'));
    var line = el('div', 'flow-timeline');
    var currentStatus = row[row.length - 1] || '待田间调查';
    [
      ['提交申请', row[6] || '2026-08-07', '申报单位已提交产地检疫申请'],
      ['申请受理', '2026-08-08', '受理机构完成材料核验'],
      ['田间调查', '处理中', currentStatus === '待田间调查' ? '等待开展田间调查' : '已完成田间调查'],
      ['签发证书', currentStatus === '已发证' ? '已完成' : '待办理', currentStatus === '已发证' ? '已签发产地检疫合格证' : '待签发证书']
    ].forEach(function (step, index) {
      var node = el('div', 'flow-step' + (index < 3 || currentStatus === '已发证' ? ' done' : ''));
      node.innerHTML = '<span class="flow-dot"></span><div><strong>' + esc(step[0]) + '</strong><em>' + esc(step[1]) + '</em><p>' + esc(step[2]) + '</p></div>';
      line.appendChild(node);
    });
    flow.appendChild(line);
    box.appendChild(flow);
    return box;
  }

  function renderHandlingPage(id, data, row, operation, onBack) {
    var box = el('div', 'operation-content');
    box.appendChild(renderSummary(data, row));
    var section = el('section', 'case-section handling-section');
    var actionName = operation === '继续田调' ? '田间调查结果' : operation;
    section.appendChild(el('div', 'case-section-title', actionName + '信息'));
    var form = el('div', 'handling-form');
    var definitions = handlingFields(id, operation);
    definitions.forEach(function (field) {
      var item = el('label', 'handling-field');
      item.appendChild(el('span', '', esc(field.label) + '：'));
      if (field.type === 'select') {
        var select = document.createElement('select');
        field.options.forEach(function (option) { select.appendChild(new Option(option, option)); });
        item.appendChild(select);
      } else if (field.type === 'textarea') {
        var textarea = document.createElement('textarea');
        textarea.placeholder = field.placeholder || '请输入';
        item.classList.add('full');
        item.appendChild(textarea);
      } else {
        var input = document.createElement('input');
        input.type = 'text';
        input.placeholder = field.placeholder || '';
        input.value = field.value || '';
        item.appendChild(input);
      }
      form.appendChild(item);
    });
    section.appendChild(form);
    var actions = el('div', 'operation-actions');
    var save = el('button', 'btn-light', '保存草稿');
    save.type = 'button';
    save.addEventListener('click', function () { toast('已保存草稿'); });
    var submit = el('button', 'btn-primary', operation === '做疫情总体结论' ? '确认结论' : '提交办理');
    submit.type = 'button';
    submit.addEventListener('click', function () { toast('办理结果已提交'); onBack(); });
    actions.appendChild(save);
    actions.appendChild(submit);
    section.appendChild(actions);
    box.appendChild(section);
    return box;
  }

  function handlingFields(id, operation) {
    if (operation === '做疫情总体结论') {
      return [
        { label: '总体结论', type: 'select', options: ['田间调查合格', '田间调查不合格'] },
        { label: '调查日期', value: '2026-08-25' },
        { label: '结论说明', type: 'textarea', placeholder: '请填写田间调查总体结论及依据' }
      ];
    }
    var common = [
      { label: '经办人员', value: '系统管理员' },
      { label: '办理日期', value: '2026-08-25' }
    ];
    var fields = {
      cjsl: [{ label: '受理意见', type: 'select', options: ['予以受理', '不予受理'] }, { label: '受理说明', type: 'textarea', placeholder: '请填写受理意见' }],
      tjdc: [{ label: '调查结论', type: 'select', options: ['合格', '不合格', '需补充调查'] }, { label: '调查记录', type: 'textarea', placeholder: '请填写田间调查情况' }],
      sysjy: [{ label: '检验结论', type: 'select', options: ['合格', '不合格'] }, { label: '检验报告编号', placeholder: '请输入检验报告编号' }, { label: '检验说明', type: 'textarea', placeholder: '请填写检验结果说明' }],
      qfzs: [{ label: '证书编号', placeholder: '系统自动生成' }, { label: '签发结论', type: 'select', options: ['签发产地检疫合格证', '不予签发'] }, { label: '签发说明', type: 'textarea', placeholder: '请填写签发意见' }],
      cjcx: [{ label: '办理环节', type: 'select', options: ['产检受理', '田间调查', '签发证书'] }, { label: '办理意见', type: 'textarea', placeholder: '请填写办理意见' }]
    };
    return (fields[id] || fields.cjcx).concat(common);
  }

  function renderSupplementPage(data, row, operation, onBack) {
    var box = el('div', 'operation-content');
    box.appendChild(renderSummary(data, row));
    var section = el('section', 'case-section handling-section');
    section.appendChild(el('div', 'case-section-title', operation === '作废证书' ? '作废信息' : '备注信息'));
    var field = el('label', 'handling-field full');
    field.appendChild(el('span', '', operation === '作废证书' ? '作废原因：' : '备注内容：'));
    var textarea = document.createElement('textarea');
    textarea.placeholder = operation === '作废证书' ? '请填写证书作废原因' : '请填写业务备注';
    field.appendChild(textarea);
    section.appendChild(field);
    var actions = el('div', 'operation-actions');
    var confirm = el('button', 'btn-primary', '确认提交');
    confirm.type = 'button';
    confirm.addEventListener('click', function () { toast('操作已提交'); onBack(); });
    actions.appendChild(confirm);
    section.appendChild(actions);
    box.appendChild(section);
    return box;
  }

  /* ---------- 日期输入 ---------- */
  function dateInput(key, ph) {
    var wrap = el('div', 'date-wrap');
    var inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'date-input';
    if (ph) inp.placeholder = ph;
    inp.setAttribute('data-qkey', key);
    inp.readOnly = true;
    inp.addEventListener('click', function () {
      // 简化：点击填充当前日期
      var d = new Date();
      function pad(n) { return n < 10 ? '0' + n : n; }
      inp.value = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    });
    wrap.appendChild(inp);
    wrap.appendChild(el('i', 'iconfont npp-shijian cal-icon'));
    return wrap;
  }

  /* ---------- 查询控件构建 ---------- */
  function buildQueryItem(q) {
    var item = el('div', 'form-item');
    item.appendChild(el('span', 'label', esc(q.label)));
    if (q.operator && q.operator.length) {
      var op = document.createElement('select');
      op.className = 'operator-select';
      op.setAttribute('data-qkey', q.key + '_operator');
      q.operator.forEach(function (o) { op.appendChild(new Option(o, o)); });
      if (q.operatorValue) op.value = q.operatorValue;
      item.appendChild(op);
    }
    if (q.type === 'daterange') {
      item.appendChild(dateInput(q.key + '_start'));
      item.appendChild(el('span', 'date-sep', '至'));
      item.appendChild(dateInput(q.key + '_end'));
    } else if (q.type === 'range') {
      var i1 = document.createElement('input');
      i1.type = 'text'; i1.className = 'range-input';
      i1.setAttribute('data-qkey', q.key + '_min');
      item.appendChild(i1);
      item.appendChild(el('span', 'date-sep', '至'));
      var i2 = document.createElement('input');
      i2.type = 'text'; i2.className = 'range-input';
      i2.setAttribute('data-qkey', q.key + '_max');
      item.appendChild(i2);
    } else if (q.type === 'compound') {
      var primary = document.createElement('input');
      primary.type = 'text';
      primary.placeholder = q.ph || '';
      primary.setAttribute('data-qkey', q.key);
      item.appendChild(primary);
      item.appendChild(customSelect(q.secondary.key, q.secondary.options, q.secondary.value));
    } else if (q.type === 'select') {
      var sel = document.createElement('select');
      sel.setAttribute('data-qkey', q.key);
      sel.appendChild(new Option(q.ph || '请选择', ''));
      q.options.forEach(function (o) { sel.appendChild(new Option(o, o)); });
      if (q.value) sel.value = q.value;
      item.appendChild(sel);
    } else if (q.type === 'address') {
      var addressOptions = [MOCK.provinces, MOCK.hebeiCities, ['正定县', '藁城区', '辛集市', '长安区'], ['乡镇']];
      for (var ai = 0; ai < (q.levels || 3); ai++) {
        var addr = document.createElement('select');
        addr.className = 'address-select';
        addr.setAttribute('data-qkey', q.key + '_' + ai);
        addr.appendChild(new Option(['请选择省', '请选择市', '请选择区', '请选择乡'][ai] || '请选择', ''));
        (addressOptions[ai] || []).forEach(function (o) { addr.appendChild(new Option(o, o)); });
        item.appendChild(addr);
      }
    } else if (q.type === 'numberunit') {
      var numberInput = document.createElement('input');
      numberInput.type = 'text'; numberInput.placeholder = q.ph || '';
      numberInput.setAttribute('data-qkey', q.key);
      item.appendChild(numberInput);
      var unit = document.createElement('select');
      unit.className = 'unit-select'; unit.setAttribute('data-qkey', q.key + '_unit');
      unit.appendChild(new Option('', ''));
      (q.options || []).forEach(function (o) { unit.appendChild(new Option(o, o)); });
      item.appendChild(unit);
    } else if (q.type === 'orgtree') {
      item.appendChild(orgSelect(q.key));
    } else {
      var inp = document.createElement('input');
      inp.type = 'text';
      inp.setAttribute('data-qkey', q.key);
      if (q.ph) inp.placeholder = q.ph;
      item.appendChild(inp);
    }
    return item;
  }

  function customSelect(key, options, value) {
    var box = el('div', 'custom-select');
    var input = document.createElement('input');
    input.type = 'text';
    input.readOnly = true;
    input.className = 'custom-select-input';
    input.setAttribute('data-qkey', key);
    input.value = value || '';
    box.appendChild(input);
    box.appendChild(el('i', 'custom-select-arrow', '⌄'));
    var drop = el('div', 'custom-select-dropdown');
    (options || []).forEach(function (option) {
      var item = el('div', 'custom-select-option' + (option === value ? ' selected' : ''), esc(option));
      item.addEventListener('click', function () {
        input.value = option;
        drop.querySelectorAll('.custom-select-option').forEach(function (optionItem) { optionItem.classList.remove('selected'); });
        item.classList.add('selected');
        box.classList.remove('open');
      });
      drop.appendChild(item);
    });
    box.appendChild(drop);
    box.addEventListener('click', function (event) {
      if (event.target.closest('.custom-select-dropdown')) return;
      box.classList.toggle('open');
    });
    document.addEventListener('click', function (event) {
      if (!box.contains(event.target)) box.classList.remove('open');
    });
    return box;
  }

  /* 机构选择（下拉树简化版） */
  function orgSelect(key) {
    var orgs = [];
    MOCK.pages.cjcx.query.forEach(function (q) { if (q.key === 'org') orgs = q.options; });

    var box = el('div', 'org-select');
    var inp = document.createElement('input');
    inp.type = 'text';
    inp.readOnly = true;
    inp.setAttribute('data-qkey', key);
    inp.placeholder = '请选择';
    box.appendChild(inp);
    box.appendChild(el('i', 'org-arrow', '▼'));

    var drop = el('div', 'org-dropdown');
    var tools = el('div', 'org-tools');
    var level = document.createElement('input');
    level.type = 'text'; level.readOnly = true; level.placeholder = '站点级别';
    level.className = 'org-level-input';
    tools.appendChild(level);
    var search = document.createElement('input');
    search.type = 'text'; search.placeholder = '按名称搜索';
    search.className = 'org-search-input';
    tools.appendChild(search);
    drop.appendChild(tools);
    var list = el('div', 'org-list');
    orgs.forEach(function (o) {
      var opt = el('div', 'org-opt', esc(o));
      opt.addEventListener('click', function () {
        inp.value = o;
        box.classList.remove('open');
      });
      list.appendChild(opt);
    });
    search.addEventListener('input', function () {
      var query = search.value.trim();
      list.querySelectorAll('.org-opt').forEach(function (opt) {
        opt.style.display = !query || opt.textContent.indexOf(query) >= 0 ? '' : 'none';
      });
    });
    drop.appendChild(list);
    box.appendChild(drop);

    box.addEventListener('click', function (e) {
      if (e.target.closest('.org-dropdown')) return;
      box.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (!box.contains(e.target)) box.classList.remove('open');
    });
    return box;
  }

  /* ---------- 综合查询：卡片导航 + 子页面 ---------- */
  function renderZhcx(data) {
    var wrap = el('div', 'zhcx-page');

    var cardsBox = el('div', 'zhcx-cards');
    data.cards.forEach(function (card) {
      var c = el('div', 'nav-card');
      c.innerHTML = '<i class="iconfont ' + esc(card.icon) + ' myicon"></i><div class="card-text">' + esc(card.title) + '</div>';
      c.addEventListener('click', function () { showSub(card.id); });
      cardsBox.appendChild(c);
    });
    wrap.appendChild(cardsBox);

    var subBox = el('div', 'zhcx-sub');
    subBox.style.display = 'none';
    wrap.appendChild(subBox);

    function showSub(id) {
      var sub = data.subs[id];
      if (!sub) return;
      renderZhcxSub(subBox, sub, function () {
        subBox.style.display = 'none';
        cardsBox.style.display = 'flex';
      });
      cardsBox.style.display = 'none';
      subBox.style.display = 'block';
    }
    return wrap;
  }

  function renderZhcxSub(box, sub, onBack) {
    box.innerHTML = '';

    /* 返回 */
    var topbar = el('div', 'sub-topbar');
    var back = el('button', 'btn-back', '返回');
    back.type = 'button';
    back.addEventListener('click', onBack);
    topbar.appendChild(back);
    box.appendChild(topbar);

    /* 查询区 */
    var area = el('div', 'query-area');
    var form = el('div', 'query-form');
    sub.query.forEach(function (q) { form.appendChild(buildQueryItem(q)); });
    if (sub.scopeRadios || sub.statusChecks) {
      var ext = el('div', 'ext-filters');
      if (sub.scopeRadios) {
        var scopeRow = el('div', 'radio-row');
        sub.scopeRadios.forEach(function (option, index) {
          scopeRow.insertAdjacentHTML('beforeend', '<label><input type="radio" name="sub_scope"' + (index === (sub.scopeDefault || 0) ? ' checked' : '') + '>' + esc(option) + '</label>');
        });
        ext.appendChild(scopeRow);
      }
      if (sub.statusChecks) {
        var statusRow = el('div', 'check-row');
        sub.statusChecks.forEach(function (option) {
          statusRow.insertAdjacentHTML('beforeend', '<label><input type="checkbox" value="' + esc(option) + '">' + esc(option) + '</label>');
        });
        ext.appendChild(statusRow);
      }
      form.appendChild(ext);
    }
    if (sub.outputChecks) {
      var outputBox = el('div', 'output-checks');
      outputBox.appendChild(el('div', 'output-title', '请选择输出字段'));
      sub.outputChecks.forEach(function (option, index) {
        outputBox.insertAdjacentHTML('beforeend', '<label><input type="checkbox"' + (index < 6 ? ' checked' : '') + '>' + esc(option) + '</label>');
      });
      form.appendChild(outputBox);
    }
    area.appendChild(form);
    var btns = el('div', 'query-btns');
    sub.buttons.forEach(function (b) {
      var btn = el('button', 'btn-primary', esc(b));
      btn.type = 'button';
      btn.addEventListener('click', function () {
        if (b === '统计' || b === '查询' || b === '搜索') {
          toast(sub.emptyTable ? '未查询到符合条件的数据' : '查询完成');
        } else {
          toast('演示环境：' + b + '操作未开放');
        }
      });
      btns.appendChild(btn);
    });
    area.appendChild(btns);
    box.appendChild(area);

    /* 表格 */
    var tw = el('div', 'table-wrap');
    var table = el('table', 'el-table' + (sub.groupHead ? ' group-table' : ''));
    var thead = document.createElement('thead');
    if (sub.groupHead) {
      var tr1 = document.createElement('tr');
      var tr2 = document.createElement('tr');
      sub.groupHead.forEach(function (h) {
        var th = el('th', '', esc(h.label));
        if (h.rowspan === 2) {
          th.rowSpan = 2;
          tr1.appendChild(th);
        } else {
          th.colSpan = h.colspan || 1;
          tr1.appendChild(th);
          (h.subs || []).forEach(function (s) { tr2.appendChild(el('th', '', esc(s))); });
        }
      });
      thead.appendChild(tr1);
      thead.appendChild(tr2);
    } else if (sub.headers) {
      var htr = document.createElement('tr');
      sub.headers.forEach(function (h) { htr.appendChild(el('th', '', esc(h))); });
      if (sub.opers) htr.appendChild(el('th', '', '操作'));
      thead.appendChild(htr);
    }
    table.appendChild(thead);
    var tbody = el('tbody');
    table.appendChild(tbody);
    tw.appendChild(table);
    box.appendChild(tw);

    var colCount = sub.groupHead ? 12 : (sub.headers ? sub.headers.length + (sub.opers ? 1 : 0) : 1);
    if (sub.emptyTable || !sub.rows) {
      var tre = document.createElement('tr');
      var tde = el('td', 'table-empty', '暂无数据');
      tde.colSpan = colCount;
      tre.appendChild(tde);
      tbody.appendChild(tre);
    } else {
      sub.rows.forEach(function (r) {
        var tr = document.createElement('tr');
        r.forEach(function (cell) { tr.appendChild(el('td', 'cell', esc(cell))); });
        if (sub.opers) {
          var td = el('td', 'cell');
          sub.opers.split('|').forEach(function (op) {
            var b = el('button', 'op-btn', esc(op));
            b.type = 'button';
            b.addEventListener('click', function () { toast('演示环境：' + op + '操作未开放'); });
            td.appendChild(b);
          });
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      });
    }

    /* 分页 */
    if (sub.total !== undefined && !sub.emptyTable) box.appendChild(buildPagination(sub.total, 1, function () { toast('演示环境：分页未开放'); }));
  }

  /* ---------- 产检申请（按真实系统坐标 1:1 复刻） ----------
     结构：提交按钮(左上) → 红底提示条 → 居中大标题 → 5个groupspace
     栅格：1200 宽，双列 600，label 120px 右对齐，行距 18px */
  function renderCjsq(data) {
    var wrap = el('div', 'apply-wrap');

    /* 顶部：提交申请按钮（左上，130×40） */
    var topbar = el('div', 'apply-topbar');
    var submit = el('button', 'btn-primary', '提交申请');
    submit.type = 'button';
    submit.addEventListener('click', function () { toast('演示环境：提交申请未开放'); });
    topbar.appendChild(submit);
    wrap.appendChild(topbar);

    /* 提示条（1000×60 居中 #FBEDED，右侧两个98×42描边按钮） */
    var notice = el('div', 'apply-notice');
    notice.innerHTML = '<span>重要提示：办理南繁业务请先进行南繁单位备案！备案链接：</span>' +
      '<button type="button" class="notice-link-btn">南繁单位备案</button>' +
      '<button type="button" class="notice-link-btn">南繁填报指南</button>';
    wrap.appendChild(notice);

    var card = el('div', 'apply-card');
    card.appendChild(el('div', 'card-title', '农业植物产地检疫申请书'));

    /* 组1 申报单位信息 */
    card.appendChild(applySection('申报单位信息', function (grid) {
      grid.appendChild(formCol(fieldInput('申报单位：', '请选择申报单位', true)));
      grid.appendChild(formCol(fieldInput('邮政编码：', '请输入邮政编码')));
      grid.appendChild(formCol(fieldInput('联系人：', '请输入联系人')));
      grid.appendChild(formCol(fieldInput('联系电话：', '请输入联系电话')));
      grid.appendChild(formCol(fieldInput('传真：', '请输入传真')));
      grid.appendChild(formCol(fieldInput('地址：', '请输入地址')));
      grid.appendChild(formCol(fieldDate('申报日期：', '选择申报日期')));
      grid.appendChild(formCol(emptyItem()));
    }));

    /* 组2 申报材料 */
    card.appendChild(applySection('申报材料', function (grid) {
      grid.appendChild(formCol(uploadField(), 'full'));
    }));

    /* 组3 植物信息 */
    card.appendChild(applySection('植物信息', function (grid) {
      grid.appendChild(formCol(fieldInput('植物名称：', '请选择植物名称', true)));
      grid.appendChild(formCol(fieldSelect('产出用途：', ['请选择', '种子', '苗木繁殖材料', '其他（非种用）'])));
      grid.appendChild(detailField());
      grid.appendChild(formCol(fieldRegion('种植地点：'), 'full'));
      grid.appendChild(formCol(fieldSelect('审核机构：', ['请选择', '河北省植保植检总站', '石家庄市植保植检站', '正定县植保植检站'])));
      grid.appendChild(formCol(fieldDateRange('种植期限：')));
      grid.appendChild(formCol(fieldInput('总种植面积：', '请输入总种植面积')));
      grid.appendChild(formCol(fieldInput('总预计产量：', '请输入总预计产量')));
      grid.appendChild(formCol(fieldUnitYield('单位产量：')));
      grid.appendChild(formCol(emptyItem()));
    }));

    /* 组4 受理机构信息 */
    card.appendChild(applySection('受理机构信息', function (grid) {
      grid.appendChild(formCol(fieldInput('受理机构：', '河北省植保植检总站', false, true)));
      grid.appendChild(formCol(fieldInput('检疫员：', '', false, true)));
      grid.appendChild(formCol(fieldInput('联系电话：', '', false, true)));
      grid.appendChild(formCol(fieldDate('受理日期：', '', true)));
    }));

    /* 组5 批件发送方式 */
    card.appendChild(applySection('批件发送方式', function (grid) {
      grid.appendChild(formCol(fieldRadio('发送方式：', ['普通邮寄', '特快专递邮寄', '来人领取'], 'sendType'), 'full'));
      grid.appendChild(formCol(fieldTextarea('邮寄地址：', '请输入邮寄地址')));
    }));

    wrap.appendChild(card);
    return wrap;
  }

  /* 产检申请辅助：栅格列（el-col-12 = 600px） */
  function formCol(item, size) {
    var col = el('div', 'form-col' + (size === 'full' ? ' full' : ''));
    col.appendChild(item);
    return col;
  }

  function emptyItem() {
    return formItemShell('').item;
  }

  function applySection(title, fill) {
    var sec = el('div', 'section');
    sec.appendChild(el('div', 'sec-title', esc(title)));
    var grid = el('div', 'form-grid');
    fill(grid);
    sec.appendChild(grid);
    return sec;
  }

  /* 表单项结构：label(120px 右对齐) + item-content(margin-left 132) */
  function formItemShell(labelText) {
    var item = el('div', 'form-item');
    item.appendChild(el('span', 'label', esc(labelText || '')));
    var content = el('div', 'item-content');
    item.appendChild(content);
    return { item: item, content: content };
  }

  function fieldInput(label, ph, withSearch, disabled, width) {
    var s = formItemShell(label);
    var inp = document.createElement('input');
    inp.type = 'text';
    if (ph) inp.placeholder = ph;
    if (width) inp.style.width = width + 'px';
    if (disabled) inp.disabled = true;
    if (withSearch) {
      /* 真实系统 complexSelection：只读 + 右侧下拉箭头（搜索/添加在弹层内） */
      inp.className = 'sel-input';
      inp.readOnly = true;
      inp.addEventListener('click', function () { toast('演示环境：选择未开放'); });
    }
    s.content.appendChild(inp);
    return s.item;
  }

  function fieldSelect(label, options) {
    var s = formItemShell(label);
    var sel = document.createElement('select');
    options.forEach(function (o) { sel.appendChild(new Option(o, o === '请选择' ? '' : o)); });
    if (!sel.value) sel.classList.add('ph-gray');
    sel.addEventListener('change', function () {
      sel.classList.toggle('ph-gray', !sel.value);
    });
    s.content.appendChild(sel);
    return s.item;
  }

  function fieldDate(label, ph, disabled) {
    var s = formItemShell(label);
    s.content.appendChild(dateInput('', ph));
    if (disabled) s.content.querySelector('input').disabled = true;
    return s.item;
  }

  /* 种植期限：起止两个 140px 日期框，间距 40px */
  function fieldDateRange(label) {
    var s = formItemShell(label);
    var d1 = dateInput('', '开始日期');
    d1.style.width = '140px';
    var d2 = dateInput('', '结束日期');
    d2.style.width = '140px';
    d2.style.marginLeft = '40px';
    s.content.appendChild(d1);
    s.content.appendChild(d2);
    return s.item;
  }

  /* 种植地点：4 个 180px 下拉 + 详细地址输入框（5px 间距） */
  function fieldRegion(label) {
    var s = formItemShell(label);
    var groups = [
      ['请选择省', MOCK.provinces],
      ['请选择市', MOCK.hebeiCities],
      ['请选择县', ['正定县', '栾城区', '藁城区']],
      ['请选择乡', ['正定镇', '新城铺镇', '南楼乡']]
    ];
    groups.forEach(function (g, i) {
      var sel = document.createElement('select');
      sel.style.width = '180px';
      if (i > 0) sel.style.marginLeft = '5px';
      sel.appendChild(new Option(g[0], ''));
      g[1].forEach(function (p) { sel.appendChild(new Option(p, p)); });
      sel.classList.add('ph-gray');
      sel.addEventListener('change', function () { sel.classList.toggle('ph-gray', !sel.value); });
      s.content.appendChild(sel);
    });
    var addr = document.createElement('input');
    addr.type = 'text';
    addr.placeholder = '请输入详细地址';
    addr.style.width = '180px';
    addr.style.marginLeft = '5px';
    s.content.appendChild(addr);
    s.item.style.marginBottom = '22px'; /* 真实系统该项高37，节距55 */
    return s.item;
  }

  function fieldRadio(label, options, name) {
    var s = formItemShell(label);
    var rl = el('div', 'radio-line');
    options.forEach(function (o, i) {
      var lb = el('label', '');
      lb.innerHTML = '<input type="radio" name="' + esc(name || 'rd') + '"' + (i === 0 ? ' checked' : '') + '><span class="rd-dot"></span><span>' + esc(o) + '</span>';
      rl.appendChild(lb);
    });
    s.content.appendChild(rl);
    return s.item;
  }

  function fieldTextarea(label, ph) {
    var s = formItemShell(label);
    var ta = document.createElement('textarea');
    ta.placeholder = ph || '';
    s.content.appendChild(ta);
    return s.item;
  }

  /* 单位产量：两个相邻 100px 输入框（数值 + 单位） */
  function fieldUnitYield(label) {
    var s = formItemShell(label);
    var i1 = document.createElement('input');
    i1.type = 'text'; i1.placeholder = '请输入单位产量'; i1.style.width = '100px';
    var i2 = document.createElement('input');
    i2.type = 'text'; i2.placeholder = '单位'; i2.style.width = '100px';
    s.content.appendChild(i1);
    s.content.appendChild(i2);
    return s.item;
  }

  /* 上传附件：el-upload picture-card（148×148 虚线卡 + 左侧40占位 + 下方提示） */
  function uploadField() {
    var s = formItemShell('上传附件：');
    s.item.className += ' upload-item';
    var flex = el('div', 'upload-flex');
    flex.appendChild(el('div', 'upload-spacer'));
    var col = el('div', '');
    var up = el('div', 'upload-box', '<span class="plus">+</span>');
    up.addEventListener('click', function () { toast('演示环境：上传未开放'); });
    col.appendChild(up);
    col.appendChild(el('div', 'upload-tip', ' 大小小于8MB，支持上传图片和pdf文件 '));
    flex.appendChild(col);
    s.content.appendChild(flex);
    return s.item;
  }

  /* 植物明细：列头（居中，种植面积/预计产量带单位下拉）+ 单行输入行
     列宽 250/300/200/200/100/100/50，整行起 x=281 */
  function detailField() {
    var s = formItemShell('');
    s.item.className += ' detail-item';
    var box = el('div', 'detail-box');

    var head = el('div', 'detail-head');
    [
      { t: '品种名称', w: 250 }, { t: '种苗来源', w: 300 },
      { t: '种植面积', w: 200, units: ['亩', '平方米'] },
      { t: '预计产量', w: 200, units: ['千克', '株', '支', '头', '芽', '穗'] },
      { t: '育种项目', w: 100 }, { t: '是否转基因', w: 100 }, { t: '操作', w: 50 }
    ].forEach(function (c) {
      var cell = el('div', 'dh-cell', esc(c.t));
      cell.style.width = c.w + 'px';
      if (c.units) {
        var us = document.createElement('select');
        c.units.forEach(function (u) { us.appendChild(new Option(u, u)); });
        cell.appendChild(us);
      }
      head.appendChild(cell);
    });
    box.appendChild(head);

    var rowsBox = el('div', '');
    box.appendChild(rowsBox);

    function gray(sel) {
      if (!sel.value) sel.classList.add('ph-gray');
      sel.addEventListener('change', function () { sel.classList.toggle('ph-gray', !sel.value); });
    }
    function addRow(isFirst) {
      var row = el('div', 'detail-row');
      var widths = [250, 300, 200, 200, 100, 100, 50];
      /* 品种名称：文本输入 */
      var c1 = el('div', 'detail-cell');
      var i1 = document.createElement('input');
      i1.type = 'text'; i1.placeholder = '';
      c1.appendChild(i1); row.appendChild(c1);
      /* 种苗来源：下拉（占位灰） */
      var c2 = el('div', 'detail-cell');
      var s2 = document.createElement('select');
      s2.appendChild(new Option('请选择', ''));
      ['自繁', '购入', '其它'].forEach(function (u) { s2.appendChild(new Option(u, u)); });
      gray(s2);
      c2.appendChild(s2); row.appendChild(c2);
      /* 种植面积 / 预计产量：数值输入 */
      var c3 = el('div', 'detail-cell');
      var i3 = document.createElement('input');
      i3.type = 'text';
      c3.appendChild(i3); row.appendChild(c3);
      var c4 = el('div', 'detail-cell');
      var i4 = document.createElement('input');
      i4.type = 'text';
      c4.appendChild(i4); row.appendChild(c4);
      /* 育种项目 / 是否转基因：下拉（占位灰） */
      var c5 = el('div', 'detail-cell');
      var s5 = document.createElement('select');
      s5.appendChild(new Option('请选择', ''));
      ['加代', '制种', '繁殖', '鉴定', '其它'].forEach(function (u) { s5.appendChild(new Option(u, u)); });
      gray(s5);
      c5.appendChild(s5); row.appendChild(c5);
      var c6 = el('div', 'detail-cell');
      var s6 = document.createElement('select');
      s6.appendChild(new Option('请选择', ''));
      ['否', '是'].forEach(function (u) { s6.appendChild(new Option(u, u)); });
      gray(s6);
      c6.appendChild(s6); row.appendChild(c6);
      /* 操作：首行"添加"（红底按钮），新增行"删除" */
      var c7 = el('div', 'detail-cell');
      var opBtn = el('button', 'op-btn', isFirst ? '添加' : '删除');
      opBtn.type = 'button';
      if (isFirst) opBtn.addEventListener('click', function () { addRow(false); });
      else opBtn.addEventListener('click', function () { row.remove(); });
      c7.appendChild(opBtn); row.appendChild(c7);
      widths.forEach(function (w, i) { row.children[i].style.width = w + 'px'; });
      rowsBox.appendChild(row);
    }
    addRow(true);

    s.content.appendChild(box);
    return s.item;
  }

  /* ---------- 启动 ---------- */
  renderDate();
  renderModules();
  renderMenu();
  openPage('tjdc'); // 默认打开田间调查（与真实系统登录后一致）
})();
