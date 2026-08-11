// ifc-calc.js — 计算引擎：实时面板 5 项指标

function ifcCalcPanelData() {
    var batch = ifcGetCurrentBatch();
    var tareTotal = batch ? batch.tareTotalWeight : 0;
    var target = batch ? batch.targetAmount : 0;
    var currentAmount = ifcItems.reduce(function(sum, item) { return sum + (item.weightedTotalFee || 0); }, 0);
    return {
        tareTotalWeight: tareTotal,
        targetAmount: target,
        currentAmount: currentAmount,
        diff: target - currentAmount,
        avgPrice: tareTotal > 0 ? (target / tareTotal) : 0
    };
}

function ifcGetAllItems() { return ifcItems; }
