// ifc-export.js — 导出 CSV / 复制表格

function ifcExportCSV() {
    if (!ifcItems.length) { ifcShowToast('无数据可导出', 'warning'); return; }
    var d = ifcCalcPanelData();
    var csv = '﻿商品名称,单价,数量,单重(g),总重(g),平均国际费用,加权国际费用,加权国际总费用\n';
    ifcItems.forEach(function(item) {
        csv += ['"' + item.productName + '"', item.unitPrice.toFixed(2), item.quantity, item.unitWeight,
            item.totalWeight.toFixed(1), item.avgIntlFee.toFixed(3), item.weightedIntlFee.toFixed(2), item.weightedTotalFee.toFixed(2)].join(',') + '\n';
    });
    csv += '\n统计\n去皮总重(g),' + d.tareTotalWeight + '\n目标金额,' + d.targetAmount + '\n已分配,' + d.currentAmount.toFixed(2) + '\n差额,' + d.diff.toFixed(2) + '\n';
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = '国际运费_' + new Date().toISOString().slice(0, 10) + '.csv'; a.click();
    URL.revokeObjectURL(a.href); ifcShowToast('CSV 已下载', 'success');
}

function ifcExportCopy() {
    if (!ifcItems.length) { ifcShowToast('无数据可复制', 'warning'); return; }
    var d = ifcCalcPanelData();
    var text = '商品名称\t单价\t数量\t单重(g)\t总重(g)\t平均费用\t加权费用\t加权总费\n';
    ifcItems.forEach(function(item) {
        text += [item.productName, item.unitPrice.toFixed(2), item.quantity, item.unitWeight,
            item.totalWeight.toFixed(1), item.avgIntlFee.toFixed(3), item.weightedIntlFee.toFixed(2), item.weightedTotalFee.toFixed(2)].join('\t') + '\n';
    });
    text += '\n去皮总重: ' + d.tareTotalWeight + 'g  目标: ¥' + d.targetAmount + '  已分配: ¥' + d.currentAmount.toFixed(2) + '  差额: ¥' + d.diff.toFixed(2);
    var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta); ifcShowToast('表格已复制到剪贴板', 'success');
}

function ifcExportDataBackup() {
    if (!ifcItems.length) { ifcShowToast('无数据可备份', 'warning'); return; }
    var backup = {
        version: '1.1.0',
        exportedAt: new Date().toISOString(),
        batchId: ifcCurrentBatchId || '',
        batchName: ifcCurrentBatchId ? (typeof ifcGetBatchName === 'function' ? ifcGetBatchName(ifcCurrentBatchId) : '') : '',
        items: ifcItems.map(function(item) {
            return {
                productName: item.productName,
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                unitWeight: item.unitWeight,
                totalWeight: item.totalWeight,
                avgIntlFee: item.avgIntlFee,
                weightedIntlFee: item.weightedIntlFee,
                weightedTotalFee: item.weightedTotalFee,
                sourceId: item.sourceId || ''
            };
        })
    };
    var json = JSON.stringify(backup, null, 2);
    var blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '运费备份_' + (backup.batchName || backup.batchId || '当前批次') + '_' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    ifcShowToast('数据备份已下载（' + backup.items.length + ' 条商品）', 'success');
}
