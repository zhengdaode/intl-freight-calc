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
    var products = ifcGetGroupProducts();
    if (products.length === 0) { ifcShowToast('团购系统暂无商品数据', 'warning'); return; }
    var existingNames = new Set(ifcItems.map(function(i) { return i.productName; }));
    var newProducts = products.filter(function(p) { return !existingNames.has(p.productName); });
    if (newProducts.length === 0) { ifcShowToast('所有商品已导入', 'info'); return; }
    ifcAddItems(newProducts); ifcRender();
    ifcShowToast('已从团购系统导入 ' + newProducts.length + ' 种商品', 'success');
}
