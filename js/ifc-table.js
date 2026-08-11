// ifc-table.js — 可编辑表格：单重和加权费用可编辑，其余自动计算

function ifcRenderTable() {
    var container = document.getElementById('ifcTableContainer');
    if (!container) return;
    var batch = ifcGetCurrentBatch();

    if (!batch) {
        container.innerHTML = '<div class="text-center py-12 text-gray-400"><p class="text-lg mb-2">📦</p><p>请先创建一个批次</p></div>';
        return;
    }

    if (ifcItems.length === 0) {
        container.innerHTML = '<div class="text-center py-12 text-gray-400"><p class="text-lg mb-2">📋</p><p>还没有商品数据</p>' +
            '<div class="mt-4 flex justify-center gap-2">' +
            (IFC_EMBEDDED ? '<button onclick="ifcImportFromGroupBuy()" class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">从团购系统导入</button>' : '') +
            '<button onclick="ifcShowManualAdd()" class="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">手动录入</button>' +
            '<button onclick="ifcShowImportDialog()" class="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600">Excel/CSV 导入</button>' +
            '</div></div>';
        return;
    }

    var html = '<div class="overflow-x-auto"><table class="w-full text-sm border-collapse" id="ifcDataTable"><thead><tr class="bg-gray-100 text-gray-700">' +
        '<th class="p-2 border text-left">商品名称</th>' +
        '<th class="p-2 border text-right w-20">单价</th>' +
        '<th class="p-2 border text-right w-16">数量</th>' +
        '<th class="p-2 border text-right w-24">单重(g)</th>' +
        '<th class="p-2 border text-right w-24">总重(g)</th>' +
        '<th class="p-2 border text-right w-28">平均费用</th>' +
        '<th class="p-2 border text-right w-28">加权费用</th>' +
        '<th class="p-2 border text-right w-28">加权总费</th>' +
        '<th class="p-2 border text-center w-12">操作</th>' +
    '</tr></thead><tbody>';

    ifcItems.forEach(function(item) {
        var avgColor = item.weightedIntlFee !== item.avgIntlFee ? 'text-orange-500' : 'text-gray-500';
        html += '<tr class="border-b hover:bg-blue-50 transition-colors">' +
            '<td class="p-2 border">' + ifcEscapeHtml(item.productName) + '</td>' +
            '<td class="p-2 border text-right text-gray-600">¥' + item.unitPrice.toFixed(2) + '</td>' +
            '<td class="p-2 border text-right">' + item.quantity + '</td>' +
            '<td class="p-2 border text-right"><input type="number" step="0.1" min="0" value="' + item.unitWeight + '" ' +
                'onchange="ifcUpdateItem(\'' + item.id + '\',\'unitWeight\',this.value);ifcRender();" ' +
                'class="w-full text-right border border-gray-300 rounded px-1 py-0.5 focus:border-blue-400 focus:outline-none text-xs"></td>' +
            '<td class="p-2 border text-right text-gray-600">' + item.totalWeight.toFixed(1) + '</td>' +
            '<td class="p-2 border text-right ' + avgColor + '">¥' + item.avgIntlFee.toFixed(3) + '</td>' +
            '<td class="p-2 border text-right"><input type="number" step="0.01" min="0" value="' + item.weightedIntlFee.toFixed(2) + '" ' +
                'onchange="ifcUpdateItem(\'' + item.id + '\',\'weightedIntlFee\',this.value);ifcRender();" ' +
                'class="w-full text-right border border-blue-300 rounded px-1 py-0.5 focus:border-blue-500 focus:outline-none text-xs bg-blue-50 font-medium"></td>' +
            '<td class="p-2 border text-right font-bold text-blue-700">¥' + item.weightedTotalFee.toFixed(2) + '</td>' +
            '<td class="p-2 border text-center"><button onclick="ifcDeleteItem(\'' + item.id + '\');ifcRender();" class="text-red-400 hover:text-red-600 text-xs">✕</button></td>' +
        '</tr>';
    });

    html += '</tbody></table></div>';

    html += '<div class="mt-3 flex gap-2">' +
        (IFC_EMBEDDED ? '<button onclick="ifcImportFromGroupBuy()" class="px-3 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">+ 从团购导入</button>' : '') +
        '<button onclick="ifcShowManualAdd()" class="px-3 py-1.5 bg-green-500 text-white rounded text-xs hover:bg-green-600">+ 手动录入</button>' +
        '<button onclick="ifcExportCSV()" class="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300">导出 CSV</button>' +
        '<button onclick="ifcExportCopy()" class="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300">复制表格</button>' +
        '<button onclick="ifcExportDataBackup()" class="px-3 py-1.5 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">数据备份</button>' +
        '<span class="ml-auto text-xs text-gray-400 self-center">共 ' + ifcItems.length + ' 种商品</span>' +
    '</div>';

    container.innerHTML = html;
}

function ifcShowManualAdd() {
    if (!ifcCurrentBatchId) { ifcShowToast('请先创建批次', 'warning'); return; }
    var name = prompt('商品名称：', '');
    if (!name || !name.trim()) return;
    var price = prompt('单价（元）：', '0');
    if (price === null || isNaN(parseFloat(price))) { ifcShowToast('请输入有效单价', 'warning'); return; }
    var qty = prompt('数量：', '1');
    if (qty === null || isNaN(parseInt(qty)) || parseInt(qty) <= 0) { ifcShowToast('请输入有效数量', 'warning'); return; }
    var weight = prompt('单重（g/个）：', '0');
    if (weight === null || isNaN(parseFloat(weight))) { ifcShowToast('请输入有效单重', 'warning'); return; }
    ifcAddItems([{ productName: name.trim(), unitPrice: parseFloat(price), quantity: parseInt(qty), unitWeight: parseFloat(weight) }]);
    ifcRender(); ifcShowToast('已添加「' + name.trim() + '」', 'success');
}

function ifcImportFromGroupBuy() {
    if (!IFC_EMBEDDED) return;
    if (!ifcCurrentBatchId) { ifcShowToast('请先创建批次', 'warning'); return; }
    var gd = ifcGetGroupData();
    if (!gd.length) { ifcShowToast('团购系统暂无商品数据', 'warning'); return; }

    // 提取所有团次
    var batchNames = [];
    var seen = {};
    gd.forEach(function(item) {
        if (!item.batch || seen[item.batch]) return;
        seen[item.batch] = true;
        batchNames.push(item.batch);
    });

    // 只有 1 个团次：跳过选择，直接导入
    if (batchNames.length <= 1) {
        var targetBatch = batchNames[0] || '';
        var products = ifcGetGroupProductsFiltered(gd, targetBatch ? [targetBatch] : []);
        ifcDoImportProducts(products);
        return;
    }

    // 多团次：弹窗选择
    ifcShowBatchSelectModal(batchNames, gd);
}

// 按选中团次筛选商品（按 category+character 去重，数量累加）
function ifcGetGroupProductsFiltered(gd, selectedBatches) {
    var batchSet = new Set(selectedBatches);
    var seenKey = {};
    var result = [];
    gd.forEach(function(item) {
        if (!batchSet.has(item.batch)) return;
        var key = item.category + '|' + item.character;
        if (seenKey[key]) {
            // 同商品累加数量（不同 CN 可能购买同一商品）
            seenKey[key].quantity += item.count || 0;
            return;
        }
        var entry = {
            productName: item.category + ' - ' + item.character,
            unitPrice: item.price || 0,
            quantity: item.count || 0,
            sourceId: item.id
        };
        seenKey[key] = entry;
        result.push(entry);
    });
    return result;
}

// 执行导入（去重 + 添加）
function ifcDoImportProducts(products) {
    if (products.length === 0) { ifcShowToast('所选团次无商品数据', 'warning'); return; }
    var existingNames = new Set(ifcItems.map(function(i) { return i.productName; }));
    var newProducts = products.filter(function(p) { return !existingNames.has(p.productName); });
    if (newProducts.length === 0) { ifcShowToast('所有商品已导入', 'info'); return; }
    ifcAddItems(newProducts); ifcRender();
    ifcShowToast('已导入 ' + newProducts.length + ' 种商品', 'success');
}

// 团次选择弹窗
function ifcShowBatchSelectModal(batchNames, gd) {
    // 统计每个团次的商品种数
    var batchInfo = {};
    gd.forEach(function(item) {
        if (!batchInfo[item.batch]) batchInfo[item.batch] = { count: 0, seenKeys: {} };
        var key = item.category + '|' + item.character;
        if (!batchInfo[item.batch].seenKeys[key]) {
            batchInfo[item.batch].seenKeys[key] = true;
            batchInfo[item.batch].count++;
        }
    });

    var rows = batchNames.map(function(name) {
        var info = batchInfo[name] || { count: 0 };
        return '<label class="flex items-center gap-3 py-2 px-2 hover:bg-gray-50 rounded cursor-pointer">' +
            '<input type="checkbox" class="ifc-batch-check" value="' + ifcEscapeHtml(name) + '" checked>' +
            '<span class="flex-1 text-sm">' + ifcEscapeHtml(name) + '</span>' +
            '<span class="text-xs text-gray-400">' + info.count + ' 种商品</span></label>';
    }).join('');

    var html = '<div id="ifcBatchSelectModal" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">' +
        '<div class="bg-white rounded-lg p-5 w-full max-w-sm shadow-xl">' +
        '<h3 class="text-lg font-bold mb-2 text-gray-800">📦 选择导入团次</h3>' +
        '<p class="text-xs text-gray-400 mb-3">勾选需要导入商品数据的团次（同商品去重）</p>' +
        '<div class="flex gap-2 mb-3"><button onclick="ifcBatchSelectAll(true)" class="text-xs text-blue-500 hover:underline">全选</button>' +
        '<button onclick="ifcBatchSelectAll(false)" class="text-xs text-blue-500 hover:underline">取消全选</button></div>' +
        '<div class="max-h-60 overflow-y-auto border rounded-lg p-2 mb-4">' + rows + '</div>' +
        '<div class="flex justify-end gap-3">' +
        '<button onclick="ifcCloseBatchSelectModal()" class="px-4 py-1.5 border rounded text-gray-600 text-sm hover:bg-gray-50">取消</button>' +
        '<button onclick="ifcConfirmBatchSelect()" class="px-4 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 shadow">确认导入</button>' +
        '</div></div></div>';

    // 移除旧弹窗（如有）
    ifcCloseBatchSelectModal();
    var overlay = document.createElement('div');
    overlay.innerHTML = html;
    document.body.appendChild(overlay.firstElementChild);
}

function ifcBatchSelectAll(checked) {
    var cbs = document.querySelectorAll('.ifc-batch-check');
    cbs.forEach(function(cb) { cb.checked = checked; });
}

function ifcCloseBatchSelectModal() {
    var modal = document.getElementById('ifcBatchSelectModal');
    if (modal) modal.remove();
}

function ifcConfirmBatchSelect() {
    var cbs = document.querySelectorAll('.ifc-batch-check:checked');
    var selected = Array.from(cbs).map(function(cb) { return cb.value; });
    ifcCloseBatchSelectModal();
    if (selected.length === 0) { ifcShowToast('请至少选择一个团次', 'warning'); return; }
    var gd = ifcGetGroupData();
    var products = ifcGetGroupProductsFiltered(gd, selected);
    ifcDoImportProducts(products);
}
