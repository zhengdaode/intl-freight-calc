// ifc-core.js — 国际运费计算器：全局状态、双模式检测、工具函数
var IFC_VERSION = '1.0.0';

// 嵌入模式检测：团购系统设置 window.IFC_EMBEDDED = true
var IFC_EMBEDDED = !!window.IFC_EMBEDDED;

// 全局状态（var 确保跨 script 标签可访问）
var ifcBatches = [];
var ifcItems = [];
var ifcCurrentBatchId = null;

// 嵌入模式复用团购系统函数，独立模式提供最小实现
// 注：groupData 是 let 声明的，不在 window 上，需通过 typeof 检查
function ifcShowToast(msg, type) {
    if (IFC_EMBEDDED && typeof showToast === 'function') { showToast(msg, type); return; }
    var bg = ({ success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' })[type] || '#3b82f6';
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:16px;right:16px;background:' + bg + ';color:#fff;padding:10px 20px;border-radius:8px;z-index:9999;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.2);animation:fadeIn 0.2s';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function() { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(function() { el.remove(); }, 300); }, 2500);
}

function ifcGenerateId() {
    if (IFC_EMBEDDED && typeof generateSafeId === 'function') return generateSafeId();
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 7);
}

function ifcEscapeHtml(s) {
    if (IFC_EMBEDDED && typeof escapeHtml === 'function') return escapeHtml(s);
    var d = document.createElement('div'); d.textContent = s; return d.innerHTML;
}

// 团购系统的 groupData 是 let 声明的，不是 window 属性，需 typeof 检查
function ifcGetGroupData() {
    return typeof groupData !== 'undefined' ? groupData : [];
}

// 嵌入模式：从团购系统读取 groupData；独立模式：空数组
function ifcGetGroupProducts() {
    var gd = ifcGetGroupData();
    if (!IFC_EMBEDDED || !gd.length) return [];
    var seen = {};
    var result = [];
    gd.forEach(function(item) {
        var key = item.category + '|' + item.character;
        if (seen[key]) return;
        seen[key] = true;
        result.push({
            productName: item.category + ' - ' + item.character,
            unitPrice: item.price || 0,
            quantity: item.count || 0,
            sourceId: item.id
        });
    });
    return result;
}

// 初始化入口
function ifcInit() {
    ifcLoadBatches();
    ifcRender();
}

// 主渲染函数：刷新面板 + 表格 + 批次选择器
function ifcRender() {
    ifcRenderBatchSelector();
    ifcRenderPanel();
    ifcRenderTable();
}
