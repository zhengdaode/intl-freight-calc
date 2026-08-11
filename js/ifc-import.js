// ifc-import.js — Excel/CSV/JSON 导入

function ifcShowImportDialog() {
    if (!ifcCurrentBatchId) { ifcShowToast('请先创建批次', 'warning'); return; }
    var html = '<div id="ifcImportModal" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onclick="if(event.target===this)this.remove()">' +
        '<div class="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4">' +
            '<h3 class="text-lg font-bold mb-4">导入商品数据</h3><div class="space-y-3">' +
            '<label class="block p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 text-center">' +
                '<span class="text-blue-500 font-bold">📄 上传 Excel (.xlsx)</span>' +
                '<input type="file" accept=".xlsx" onchange="ifcImportExcel(this)" class="hidden"></label>' +
            '<label class="block p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 text-center">' +
                '<span class="text-green-500 font-bold">📊 上传 CSV</span>' +
                '<input type="file" accept=".csv" onchange="ifcImportCSV(this)" class="hidden"></label>' +
            '<div class="text-center text-gray-400 text-xs">— 或 —</div>' +
            '<button onclick="ifcImportJSONPrompt();document.getElementById(\'ifcImportModal\').remove();" class="w-full p-3 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-bold">📋 粘贴 JSON</button>' +
            '</div><div class="mt-4 p-3 bg-yellow-50 rounded-lg text-xs text-yellow-700">' +
                '<strong>列名要求：</strong>商品名称, 单价, 数量, 单重(g) — 表头可模糊匹配</div>' +
            '<button onclick="document.getElementById(\'ifcImportModal\').remove()" class="mt-4 w-full py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300">关闭</button>' +
        '</div></div>';
    var div = document.createElement('div'); div.innerHTML = html; document.body.appendChild(div.firstElementChild);
}

function ifcImportExcel(input) {
    var file = input.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var wb = XLSX.read(e.target.result, { type: 'array' });
            var rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
            if (rows.length < 2) { ifcShowToast('文件为空', 'warning'); return; }
            var items = ifcParseRows(rows);
            if (!items.length) { ifcShowToast('未解析到数据，请检查列名', 'warning'); return; }
            ifcAddItems(items); ifcRender(); ifcShowToast('已导入 ' + items.length + ' 条', 'success');
        } catch (err) { ifcShowToast('Excel 解析失败: ' + err.message, 'error'); }
    };
    reader.readAsArrayBuffer(file); var m = document.getElementById('ifcImportModal'); if (m) m.remove();
}

function ifcImportCSV(input) {
    var file = input.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        var rows = e.target.result.split(/\r?\n/).filter(function(l) { return l.trim(); })
            .map(function(l) { return l.split(',').map(function(c) { return c.replace(/^"|"$/g, '').trim(); }); });
        if (rows.length < 2) { ifcShowToast('文件为空', 'warning'); return; }
        var items = ifcParseRows(rows);
        if (!items.length) { ifcShowToast('未解析到数据，请检查列名', 'warning'); return; }
        ifcAddItems(items); ifcRender(); ifcShowToast('已导入 ' + items.length + ' 条', 'success');
    };
    reader.readAsText(file); var m = document.getElementById('ifcImportModal'); if (m) m.remove();
}

function ifcParseRows(rows) {
    var header = rows[0].map(function(h) { return String(h).replace(/^﻿/, '').trim(); });
    var ni = header.findIndex(function(h) { return /名称|商品|产品|品名|name/i.test(h); });
    var pi = header.findIndex(function(h) { return /单价|价格|price/i.test(h); });
    var qi = header.findIndex(function(h) { return /数量|个数|quantity|qty/i.test(h); });
    var wi = header.findIndex(function(h) { return /单重|重量|克重|weight/i.test(h); });
    if (ni < 0) return [];
    var items = [];
    for (var i = 1; i < rows.length; i++) {
        var r = rows[i]; var name = String(r[ni] || '').trim(); if (!name) continue;
        items.push({ productName: name, unitPrice: pi >= 0 ? (parseFloat(r[pi]) || 0) : 0, quantity: qi >= 0 ? (parseInt(r[qi]) || 1) : 1, unitWeight: wi >= 0 ? (parseFloat(r[wi]) || 0) : 0 });
    }
    return items;
}

function ifcImportJSONPrompt() {
    var text = prompt('粘贴 JSON 数组：\n[{"productName":"商品","unitPrice":25,"quantity":10,"unitWeight":5.5}]', '');
    if (!text || !text.trim()) return;
    try {
        var data = JSON.parse(text);
        if (!Array.isArray(data)) { ifcShowToast('JSON 必须是数组', 'warning'); return; }
        ifcAddItems(data); ifcRender(); ifcShowToast('已导入 ' + data.length + ' 条', 'success');
    } catch (e) { ifcShowToast('JSON 格式错误', 'error'); }
}
