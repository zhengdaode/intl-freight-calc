// ifc-schedule.js — 国际排发表：按买家 CN 汇总排发清单 + 打包费
// 依赖：ifc-core.js, ifc-data.js（ifcItems, ifcCurrentBatchId, IFC_EMBEDDED）

// localStorage: ifc_schedule_<batchId> → { "CN名": { packagingFee: number } }
function ifcLoadSchedule() {
    if (!ifcCurrentBatchId) return {};
    try { return JSON.parse(localStorage.getItem('ifc_schedule_' + ifcCurrentBatchId) || '{}'); } catch (e) { return {}; }
}

function ifcSaveSchedule(data) {
    if (!ifcCurrentBatchId) return;
    localStorage.setItem('ifc_schedule_' + ifcCurrentBatchId, JSON.stringify(data));
}

// 从 groupData 匹配 ifcItems，按 CN 汇总
function ifcBuildScheduleData() {
    if (!IFC_EMBEDDED || typeof groupData === 'undefined' || !groupData.length) return {};
    if (!ifcItems.length) return {};

    // productName → weightedIntlFee
    var feeMap = {};
    ifcItems.forEach(function(item) {
        feeMap[item.productName] = item.weightedIntlFee || 0;
    });

    // CN → { items: [], packagingFee }
    var cnMap = {};
    groupData.forEach(function(row) {
        if (!row.cn) return; // 跳过无 CN 的数据行
        var pn = row.category + ' - ' + row.character;
        if (!(pn in feeMap)) return; // 不在当前运费批次
        if (!cnMap[row.cn]) cnMap[row.cn] = { items: [], packagingFee: 0 };
        cnMap[row.cn].items.push({
            category: row.category,
            character: row.character,
            count: row.count || 0,
            weightedIntlFee: feeMap[pn]
        });
    });

    // 加载已保存的打包费
    var saved = ifcLoadSchedule();
    Object.keys(cnMap).forEach(function(cn) {
        if (saved[cn] && typeof saved[cn].packagingFee === 'number') {
            cnMap[cn].packagingFee = saved[cn].packagingFee;
        }
    });

    return cnMap;
}

function ifcRenderSchedule() {
    var container = document.getElementById('ifcScheduleContainer');
    if (!container) return;

    if (!ifcCurrentBatchId || !ifcItems.length) {
        container.innerHTML = '<div class="text-center py-12 text-gray-400"><p class="text-lg mb-2">📋</p><p>暂无数据，请先在运费计算中导入商品</p></div>';
        return;
    }

    var cnMap = ifcBuildScheduleData();
    var cnList = Object.keys(cnMap).sort();
    if (cnList.length === 0) {
        container.innerHTML = '<div class="text-center py-12 text-gray-400"><p class="text-lg mb-2">📋</p><p>未找到匹配的团购数据<br><small class="text-xs">排发表需要从团购系统导入的商品数据</small></p></div>';
        return;
    }

    var totalItems = 0;
    var totalFreight = 0;
    var totalPackaging = 0;

    var rows = '';
    cnList.forEach(function(cn) {
        var data = cnMap[cn];
        // 按 count 汇总同商品（同一 CN 可能同一商品多行）
        var itemMap = {};
        data.items.forEach(function(item) {
            var key = item.category + ' - ' + item.character;
            if (!itemMap[key]) itemMap[key] = { category: item.category, character: item.character, count: 0, fee: item.weightedIntlFee };
            itemMap[key].count += item.count;
        });

        var itemKeys = Object.keys(itemMap);
        var cnTotalCount = 0;
        var cnTotalFreight = 0;
        var itemDescs = [];

        itemKeys.forEach(function(key) {
            var it = itemMap[key];
            cnTotalCount += it.count;
            cnTotalFreight += it.count * it.fee;
            itemDescs.push(it.category + '-' + it.character + ' × ' + it.count);
        });

        totalItems += cnTotalCount;
        totalFreight += cnTotalFreight;
        totalPackaging += data.packagingFee;

        rows += '<tr class="border-b hover:bg-blue-50 transition-colors">' +
            '<td class="p-2 border font-bold text-blue-700">' + ifcEscapeHtml(cn) + '</td>' +
            '<td class="p-2 border text-xs text-gray-600">' + itemDescs.join('<br>') + '</td>' +
            '<td class="p-2 border text-center">' + cnTotalCount + '</td>' +
            '<td class="p-2 border text-right text-gray-700">¥' + cnTotalFreight.toFixed(2) + '</td>' +
            '<td class="p-2 border text-right"><input type="number" step="0.01" min="0" value="' + data.packagingFee.toFixed(2) + '" ' +
                'data-cn="' + ifcEscapeHtml(cn) + '" onchange="ifcUpdatePackagingFee(this)" ' +
                'class="w-20 text-right border border-gray-300 rounded px-1 py-0.5 focus:border-amber-400 focus:outline-none text-xs"></td>' +
            '<td class="p-2 border text-right font-bold text-gray-800">¥' + (cnTotalFreight + data.packagingFee).toFixed(2) + '</td>' +
        '</tr>';
    });

    var html = '<div class="overflow-x-auto"><table class="w-full text-sm border-collapse"><thead><tr class="bg-gray-100 text-gray-700">' +
        '<th class="p-2 border text-left w-24">买家 CN</th>' +
        '<th class="p-2 border text-left">排发内容</th>' +
        '<th class="p-2 border text-center w-16">总件数</th>' +
        '<th class="p-2 border text-right w-28">国际总金额</th>' +
        '<th class="p-2 border text-right w-24">打包费</th>' +
        '<th class="p-2 border text-right w-28">合计</th>' +
    '</tr></thead><tbody>' + rows +
    '<tr class="bg-amber-50 font-bold">' +
        '<td class="p-2 border text-gray-600">合计（' + cnList.length + ' 人）</td>' +
        '<td class="p-2 border"></td>' +
        '<td class="p-2 border text-center">' + totalItems + '</td>' +
        '<td class="p-2 border text-right text-gray-700">¥' + totalFreight.toFixed(2) + '</td>' +
        '<td class="p-2 border text-right text-amber-700">¥' + totalPackaging.toFixed(2) + '</td>' +
        '<td class="p-2 border text-right text-gray-800">¥' + (totalFreight + totalPackaging).toFixed(2) + '</td>' +
    '</tr></tbody></table></div>';

    html += '<div class="mt-3 flex gap-2">' +
        '<button onclick="ifcExportScheduleCSV()" class="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300">导出 CSV</button>' +
        '<button onclick="ifcExportScheduleCopy()" class="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300">复制表格</button>' +
        '<button onclick="ifcExportScheduleImage()" class="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200">导出图片</button>' +
        '<span class="ml-auto text-xs text-gray-400 self-center">共 ' + cnList.length + ' 人 / ' + totalItems + ' 件</span>' +
    '</div>';

    container.innerHTML = html;
}

function ifcUpdatePackagingFee(input) {
    var cn = input.dataset.cn;
    if (!cn) return;
    var fee = parseFloat(input.value) || 0;
    var saved = ifcLoadSchedule();
    if (!saved[cn]) saved[cn] = {};
    saved[cn].packagingFee = fee;
    ifcSaveSchedule(saved);
    ifcRenderSchedule();
}

function ifcExportScheduleCSV() {
    var cnMap = ifcBuildScheduleData();
    var cnList = Object.keys(cnMap).sort();
    var lines = ['CN,排发内容,总件数,国际总金额,打包费,合计'];

    cnList.forEach(function(cn) {
        var data = cnMap[cn];
        var itemMap = {};
        data.items.forEach(function(item) {
            var key = item.category + ' - ' + item.character;
            if (!itemMap[key]) itemMap[key] = { category: item.category, character: item.character, count: 0, fee: item.weightedIntlFee };
            itemMap[key].count += item.count;
        });
        var itemKeys = Object.keys(itemMap);
        var cnt = 0, freight = 0, itemDescs = [];
        itemKeys.forEach(function(key) {
            var it = itemMap[key];
            cnt += it.count;
            freight += it.count * it.fee;
            itemDescs.push(it.category + '-' + it.character + 'x' + it.count);
        });
        var total = freight + data.packagingFee;
        lines.push(cn + ',"' + itemDescs.join('; ') + '",' + cnt + ',' + freight.toFixed(2) + ',' + data.packagingFee.toFixed(2) + ',' + total.toFixed(2));
    });

    var blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = '排发表_' + new Date().toISOString().slice(0, 10) + '.csv'; a.click();
    URL.revokeObjectURL(url);
}

function ifcExportScheduleCopy() {
    var cnMap = ifcBuildScheduleData();
    var cnList = Object.keys(cnMap).sort();
    var lines = ['CN\t排发内容\t总件数\t国际总金额\t打包费\t合计'];

    cnList.forEach(function(cn) {
        var data = cnMap[cn];
        var itemMap = {};
        data.items.forEach(function(item) {
            var key = item.category + ' - ' + item.character;
            if (!itemMap[key]) itemMap[key] = { count: 0, fee: item.weightedIntlFee, desc: item.category + '-' + item.character };
            itemMap[key].count += item.count;
        });
        var itemKeys = Object.keys(itemMap);
        var cnt = 0, freight = 0, itemDescs = [];
        itemKeys.forEach(function(key) {
            var it = itemMap[key];
            cnt += it.count;
            freight += it.count * it.fee;
            itemDescs.push(it.desc + 'x' + it.count);
        });
        var total = freight + data.packagingFee;
        lines.push(cn + '\t' + itemDescs.join('; ') + '\t' + cnt + '\t' + freight.toFixed(2) + '\t' + data.packagingFee.toFixed(2) + '\t' + total.toFixed(2));
    });

    navigator.clipboard.writeText(lines.join('\n')).then(function() {
        ifcShowToast('已复制排发表（' + cnList.length + ' 人）', 'success');
    }).catch(function() {
        ifcShowToast('复制失败，请重试', 'error');
    });
}

function ifcExportScheduleImage() {
    var container = document.getElementById('ifcScheduleContainer');
    if (!container || !container.innerHTML) { ifcShowToast('无排发表数据', 'warning'); return; }
    if (typeof html2canvas === 'undefined') { ifcShowToast('html2canvas 未加载', 'error'); return; }

    html2canvas(container, { backgroundColor: '#ffffff', scale: 2 }).then(function(canvas) {
        var a = document.createElement('a');
        a.download = '国际排发表_' + new Date().toISOString().slice(0, 10) + '.png';
        a.href = canvas.toDataURL('image/png');
        a.click();
        ifcShowToast('排发表图片已下载', 'success');
    }).catch(function() {
        ifcShowToast('导出图片失败', 'error');
    });
}
