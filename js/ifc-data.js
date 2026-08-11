// ifc-data.js — localStorage 持久化（key 前缀 ifc_）

function ifcLoadBatches() {
    try { ifcBatches = JSON.parse(localStorage.getItem('ifc_batches') || '[]'); } catch (e) { ifcBatches = []; }
}

function ifcSaveBatches() { localStorage.setItem('ifc_batches', JSON.stringify(ifcBatches)); }

function ifcLoadItems(batchId) {
    try { ifcItems = JSON.parse(localStorage.getItem('ifc_items_' + batchId) || '[]'); } catch (e) { ifcItems = []; }
}

function ifcSaveItems() {
    if (!ifcCurrentBatchId) return;
    localStorage.setItem('ifc_items_' + ifcCurrentBatchId, JSON.stringify(ifcItems));
}

function ifcGetCurrentBatch() { return ifcBatches.find(b => b.id === ifcCurrentBatchId) || null; }

function ifcCreateBatch(batchName, targetAmount) {
    var id = ifcGenerateId();
    var batch = { id: id, batchName: batchName, targetAmount: parseFloat(targetAmount) || 0, tareTotalWeight: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    ifcBatches.push(batch);
    ifcSaveBatches();
    return batch;
}

function ifcDeleteBatch(batchId) {
    ifcBatches = ifcBatches.filter(function(b) { return b.id !== batchId; });
    ifcSaveBatches();
    localStorage.removeItem('ifc_items_' + batchId);
    if (ifcCurrentBatchId === batchId) { ifcCurrentBatchId = null; ifcItems = []; }
}

function ifcSelectBatch(batchId) { ifcCurrentBatchId = batchId; ifcLoadItems(batchId); }

function ifcAddItems(items) {
    items.forEach(function(item) {
        ifcItems.push({
            id: ifcGenerateId(), batchId: ifcCurrentBatchId,
            productName: item.productName || '', unitPrice: parseFloat(item.unitPrice) || 0,
            quantity: parseInt(item.quantity) || 1, unitWeight: parseFloat(item.unitWeight) || 0,
            totalWeight: 0, avgIntlFee: 0, weightedIntlFee: 0, weightedTotalFee: 0,
            _weightedManual: false
        });
    });
    ifcRecalcAll(); ifcSaveItems();
}

function ifcDeleteItem(itemId) { ifcItems = ifcItems.filter(function(i) { return i.id !== itemId; }); ifcRecalcAll(); ifcSaveItems(); }

function ifcUpdateItem(itemId, field, value) {
    var item = ifcItems.find(function(i) { return i.id === itemId; });
    if (!item) return;
    if (field === 'unitWeight') {
        item.unitWeight = parseFloat(value) || 0;
        item.totalWeight = item.unitWeight * item.quantity;
    } else if (field === 'weightedIntlFee') {
        item.weightedIntlFee = parseFloat(value) || 0;
        item._weightedManual = true;
    }
    item.weightedTotalFee = item.weightedIntlFee * item.quantity;
    ifcRecalcAll(); ifcSaveItems();
}

function ifcRecalcAll() {
    var batch = ifcGetCurrentBatch(); if (!batch) return;
    var tareTotal = 0;
    ifcItems.forEach(function(item) { item.totalWeight = item.unitWeight * item.quantity; tareTotal += item.totalWeight; });
    batch.tareTotalWeight = tareTotal;
    if (tareTotal > 0 && batch.targetAmount > 0) {
        ifcItems.forEach(function(item) {
            item.avgIntlFee = (batch.targetAmount / tareTotal) * item.unitWeight;
            if (!item._weightedManual) { item.weightedIntlFee = item.avgIntlFee; }
            item.weightedTotalFee = item.weightedIntlFee * item.quantity;
        });
    }
    batch.updatedAt = new Date().toISOString(); ifcSaveBatches();
}
