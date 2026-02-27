/**
 * Token Auto Copier - Background Service Worker
 *
 * @author Zjmainstay
 * @link https://github.com/Zjmainstay
 *
 * 功能：
 * 1. 监听网络请求，捕获Authorization请求头
 * 2. 响应图标点击事件，刷新页面并复制Token
 * 3. 更新图标状态和Badge
 * 4. 显示通知
 */

// ========== 全局变量 ==========
// 当前正在处理的标签页ID（点击插件后等待捕获Token）
let pendingTabId = null;
let isProcessing = false;      // 是否正在处理复制操作

// ========== 日志工具 ==========
function log(message, ...args) {
  console.log(`[TokenCopier] ${message}`, ...args);
}

function logError(message, error) {
  if (error && error.message) {
    console.error(`[TokenCopier] ${message}: ${error.message}`, error);
  } else if (typeof error === 'object') {
    console.error(`[TokenCopier] ${message}:`, JSON.stringify(error, null, 2));
  } else {
    console.error(`[TokenCopier] ${message}`, error);
  }
}

// ========== Token管理 ==========

/**
 * 从Authorization头中提取Token
 * @param {string} authHeader - Authorization请求头的值
 * @returns {string|null} - 提取的Token值，如果格式不对返回null
 */
function extractToken(authHeader) {
  if (!authHeader) return null;

  // 支持 "Bearer XXX" 和 "bearer XXX" 格式
  const bearerPrefix = 'bearer ';
  const lowerHeader = authHeader.toLowerCase();

  if (lowerHeader.startsWith(bearerPrefix)) {
    const token = authHeader.substring(bearerPrefix.length).trim();
    return token || null;
  }

  return null;
}

/**
 * 保存捕获的Token
 * @param {string} token - Token值
 */
function saveToken(token, tabId) {
  if (!token) return;

  // 只处理当前等待的标签页
  if (tabId !== pendingTabId) {
    return;
  }

  log(`当前标签页Token已捕获（${token.length}字符）`);

  // 立即复制Token
  copyTokenToTab(tabId, token);

  // 清理状态
  pendingTabId = null;
}

/**
 * 复制Token到指定标签页
 */
function copyTokenToTab(tabId, token) {
  log('准备复制Token到标签页:', tabId);
  chrome.tabs.sendMessage(
    tabId,
    { action: 'copyToken', token: token },
    (response) => {
      if (chrome.runtime.lastError) {
        const errorMsg = chrome.runtime.lastError.message || '未知错误';
        logError('发送消息失败', errorMsg);
        showNotification(
          '复制失败 ❌',
          '无法与页面通信，请刷新页面后重试',
          'error'
        );
        showErrorState();
      }
    }
  );
}

// ========== 图标和Badge管理 ==========

/**
 * 更新插件图标状态
 * @param {boolean} hasToken - 是否已捕获Token
 */
function updateIcon(hasToken) {
  try {
    // 更新Badge文本
    chrome.action.setBadgeText({ text: hasToken ? '✓' : '' });

    // 更新Badge背景颜色
    if (hasToken) {
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' }); // 绿色
    }

    // 更新Tooltip
    const title = hasToken
      ? '点击复制Token (已检测到)'
      : '点击刷新并复制Token';
    chrome.action.setTitle({ title });

    log(`图标状态已更新：${hasToken ? '已捕获' : '未捕获'}`);
  } catch (error) {
    logError('更新图标失败', error);
  }
}

/**
 * 显示处理中状态
 */
function showProcessingState() {
  try {
    chrome.action.setBadgeText({ text: '...' });
    chrome.action.setBadgeBackgroundColor({ color: '#2196F3' }); // 蓝色
    chrome.action.setTitle({ title: '正在处理...' });
    log('显示处理中状态');
  } catch (error) {
    logError('显示处理中状态失败', error);
  }
}

/**
 * 显示成功状态（短暂闪烁）
 */
function showSuccessState() {
  try {
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    log('显示成功状态');

    // 3秒后清除Badge，恢复到干净状态
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
      chrome.action.setTitle({ title: '点击刷新并复制Token' });
      log('成功标记已清除');
    }, 3000);
  } catch (error) {
    logError('显示成功状态失败', error);
  }
}

/**
 * 显示错误状态
 */
function showErrorState() {
  try {
    chrome.action.setBadgeText({ text: '✗' });
    chrome.action.setBadgeBackgroundColor({ color: '#F44336' }); // 红色
    chrome.action.setTitle({ title: '复制失败' });

    // 5秒后恢复默认状态
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
      chrome.action.setTitle({ title: '点击刷新并复制Token' });
    }, 5000);

    log('显示错误状态');
  } catch (error) {
    logError('显示错误状态失败', error);
  }
}

// ========== 通知管理 ==========

/**
 * 显示通知
 * @param {string} title - 通知标题
 * @param {string} message - 通知内容
 * @param {string} type - 通知类型 (success/warning/error)
 */
function showNotification(title, message, type = 'success') {
  try {
    const iconUrl = 'icons/icon48.png';

    chrome.notifications.create({
      type: 'basic',
      iconUrl: iconUrl,
      title: title,
      message: message,
      priority: type === 'error' ? 2 : 1
    }, (notificationId) => {
      log(`通知已显示：${title}`);

      // 根据类型设置自动关闭时间
      const timeout = type === 'success' ? 3000 : 5000;
      setTimeout(() => {
        chrome.notifications.clear(notificationId);
      }, timeout);
    });
  } catch (error) {
    logError('显示通知失败', error);
  }
}

// ========== 网络请求监听 ==========

/**
 * 监听网络请求，提取Authorization头
 */
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    try {
      // 提取请求头和标签页ID
      const headers = details.requestHeaders || [];
      const tabId = details.tabId;

      // 忽略后台请求（tabId = -1）
      if (tabId === -1) {
        return {};
      }

      for (const header of headers) {
        if (header.name.toLowerCase() === 'authorization') {
          const token = extractToken(header.value);
          if (token) {
            saveToken(token, tabId);
            break;
          }
        }
      }
    } catch (error) {
      logError('监听请求失败', error);
    }

    // 不阻塞请求
    return {};
  },
  { urls: ['<all_urls>'] },
  ['requestHeaders']
);

log('网络请求监听已启动');

// ========== 图标点击事件处理 ==========

/**
 * 处理图标点击事件
 */
chrome.action.onClicked.addListener(async (tab) => {
  log('用户点击了插件图标, 标签页ID:', tab.id);

  // 防止重复点击
  if (isProcessing) {
    log('正在处理中，忽略点击');
    return;
  }

  isProcessing = true;
  showProcessingState();

  try {
    // 设置当前等待的标签页
    pendingTabId = tab.id;
    log('设置等待标签页:', pendingTabId);

    // 刷新当前标签页（触发请求，捕获Token）
    log('开始刷新页面');
    await chrome.tabs.reload(tab.id);

    // 等待Token捕获（最多5秒）
    const timeout = 5000;
    const startTime = Date.now();

    while (pendingTabId === tab.id && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 检查是否超时
    if (pendingTabId === tab.id) {
      log('未捕获到Token（超时）');
      showNotification(
        '未找到Token ⚠️',
        '请确认页面已登录或包含API请求',
        'warning'
      );
      showErrorState();
      pendingTabId = null;
    }
    // 如果pendingTabId已被清除，说明Token已捕获并复制（在saveToken中处理）

  } catch (error) {
    logError('处理失败', error);
    showNotification('操作失败 ❌', error.message, 'error');
    showErrorState();
    pendingTabId = null;
  } finally {
    isProcessing = false;
  }
});

/**
 * 等待页面加载完成
 * @param {number} tabId - 标签页ID
 * @returns {Promise<void>}
 */
function waitForPageLoad(tabId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error('页面加载超时'));
    }, 10000); // 10秒超时

    function listener(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        log('页面加载完成');
        resolve();
      }
    }

    chrome.tabs.onUpdated.addListener(listener);
  });
}

// ========== Content Script消息处理 ==========

/**
 * 监听来自Content Script的消息
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  log('收到消息：', request);

  if (request.action === 'copySuccess') {
    // 复制成功
    const tokenLength = request.tokenLength || 0;

    showNotification(
      'Token已复制 ✅',
      `复制了 ${tokenLength} 字符的Token`,
      'success'
    );
    showSuccessState();
    isProcessing = false;

    log('Token复制成功');
  } else if (request.action === 'copyFailed') {
    // 复制失败
    showNotification(
      '复制失败 ❌',
      request.error || '无法访问剪贴板',
      'error'
    );
    showErrorState();
    isProcessing = false;

    logError('Token复制失败', request.error);
  } else if (request.action === 'noToken') {
    // 未找到Token
    showNotification(
      '未找到Token ⚠️',
      '请确认页面已登录',
      'warning'
    );
    showErrorState();
    isProcessing = false;

    log('未找到Token');
  }

  return true; // 保持消息通道开启
});

// ========== 初始化 ==========
log('Token Auto Copier 已启动');
updateIcon(false);
