// ifc-panel.js — 实时计算面板：5 项指标 + 批次管理

function ifcRenderPanel() {
    var panel = document.getElementById('ifcPanel');
    if (!panel) return;
    var d = ifcCalcPanelData();
    var diffClass = Math.abs(d.diff) < 0.01 ? 'text-green-600' : (d.diff > 0 ? 'text-blue-600' : 'text-red-500');
    var diffSign = d.diff > 0.01 ? '（剩余）' : (d.diff < -0.01 ? '（超出）' : '✓ 已平');
    var batch = ifcGetCurrentBatch();

    panel.innerHTML =
        '<div class="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">' +
            panelCard('当前包裹总重<br><small class="text-gray-400">去皮</small>', (d.tareTotalWeight / 1000).toFixed(3) + ' kg', 'text-gray-700') +
            panelCard('目标金额', '¥' + d.targetAmount.toFixed(2), 'text-gray-700') +
            panelCard('目前已分配', '¥' + d.currentAmount.toFixed(2), d.currentAmount > 0 ? 'text-blue-600' : 'text-gray-400') +
            panelCard('差额' + diffSign, '¥' + Math.abs(d.diff).toFixed(2), diffClass) +
            panelCard('当前均价<br><small class="text-gray-400">每 g</small>', '¥' + d.avgPrice.toFixed(4), 'text-gray-600') +
        '</div>' +
        (batch ? '<div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">' +
            '<span>批次: <strong class="text-gray-700">' + ifcEscapeHtml(batch.batchName) + '</strong></span>' +
            '<span class="text-gray-300">|</span>' +
            '<span>目标: <strong class="text-gray-700">¥' + batch.targetAmount.toFixed(2) + '</strong></span>' +
            '<button onclick="ifcShowEditTarget()" class="text-blue-500 hover:underline ml-auto">修改目标金额</button>' +
        '</div>' : '');
}

function panelCard(label, value, cls) {
    return '<div class="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">' +
        '<div class="text-xs text-gray-500 mb-1 leading-tight">' + label + '</div>' +
        '<div class="text-lg font-bold ' + cls + '">' + value + '</div></div>';
}

function ifcRenderBatchSelector() {
    var sel = document.getElementById('ifcBatchSelect');
    if (!sel) return;
    sel.innerHTML = ifcBatches.map(function(b) {
        return '<option value="' + b.id + '"' + (b.id === ifcCurrentBatchId ? ' selected' : '') + '>' + ifcEscapeHtml(b.batchName) + '</option>';
    }).join('') || '<option value="">-- 无批次 --</option>';
}

function ifcShowEditTarget() {
    var batch = ifcGetCurrentBatch(); if (!batch) return;
    var v = prompt('新的目标金额（元）：', batch.targetAmount);
    if (v !== null && !isNaN(parseFloat(v)) && parseFloat(v) >= 0) {
        batch.targetAmount = parseFloat(v); ifcSaveBatches(); ifcRecalcAll(); ifcRender();
    } else if (v !== null) { ifcShowToast('请输入有效金额', 'warning'); }
}

function ifcShowNewBatchDialog() {
    var name = prompt('批次名称：', '国际运费批次 ' + (ifcBatches.length + 1));
    if (!name || !name.trim()) return;
    var amount = prompt('目标金额（运费+材料费，元）：', '0');
    if (amount === null || isNaN(parseFloat(amount)) || parseFloat(amount) < 0) { ifcShowToast('请输入有效金额', 'warning'); return; }
    var batch = ifcCreateBatch(name.trim(), parseFloat(amount));
    ifcSelectBatch(batch.id); ifcRender(); ifcShowToast('批次已创建', 'success');
}

function ifcSwitchBatch() {
    var sel = document.getElementById('ifcBatchSelect'); if (!sel || !sel.value) return;
    ifcSelectBatch(sel.value); ifcRender();
}
