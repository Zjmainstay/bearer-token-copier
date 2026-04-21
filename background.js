/**
 * Token Auto Copier - Background Service Worker
 *
 * @author Zjmainstay
 * @link https://github.com/Zjmainstay
 *
 * 功能：
 * 1. 监听网络请求，捕获Authorization请求头（bearer 模式）
 * 2. 响应图标点击事件，刷新页面并复制 Token / Cookie
 * 3. 更新图标状态和Badge
 * 4. 显示通知
 */

// ========== 全局变量 ==========
let pendingTabId = null;
let isProcessing = false;

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

// ========== 配置读取 ==========

async function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['copyMode', 'cookieName'], (result) => {
      resolve({
        mode: result.copyMode || 'bearer',
        cookieName: result.cookieName || '',
      });
    });
  });
}

// ========== Token管理（bearer 模式）==========

function extractToken(authHeader) {
  if (!authHeader) return null;
  const bearerPrefix = 'bearer ';
  if (authHeader.toLowerCase().startsWith(bearerPrefix)) {
    return authHeader.substring(bearerPrefix.length).trim() || null;
  }
  return null;
}

function saveToken(token, tabId) {
  if (!token || tabId !== pendingTabId) return;
  log(`Bearer Token 已捕获（${token.length}字符）`);
  copyValueToTab(tabId, token);
  pendingTabId = null;
}

// ========== Cookie 模式 ==========

async function getCookieValue(tab, cookieName) {
  if (!cookieName) return null;
  try {
    const cookie = await chrome.cookies.get({ url: tab.url, name: cookieName });
    return cookie ? cookie.value : null;
  } catch (e) {
    logError('读取 Cookie 失败', e);
    return null;
  }
}

// ========== 复制到标签页 ==========

function copyValueToTab(tabId, value) {
  log('准备复制到标签页:', tabId);
  chrome.tabs.sendMessage(
    tabId,
    { action: 'copyToken', token: value },
    (response) => {
      if (chrome.runtime.lastError) {
        logError('发送消息失败', chrome.runtime.lastError.message);
        showNotification('复制失败 ❌', '无法与页面通信，请刷新页面后重试', 'error');
        showErrorState();
      }
    }
  );
}

// ========== 图标和Badge管理 ==========

function updateIcon(hasToken) {
  try {
    chrome.action.setBadgeText({ text: hasToken ? '✓' : '' });
    if (hasToken) chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    chrome.action.setTitle({ title: hasToken ? '点击复制 (已检测到)' : 'Bearer Token Copier' });
    log(`图标状态已更新：${hasToken ? '已捕获' : '未捕获'}`);
  } catch (error) {
    logError('更新图标失败', error);
  }
}

function showProcessingState() {
  try {
    chrome.action.setBadgeText({ text: '...' });
    chrome.action.setBadgeBackgroundColor({ color: '#2196F3' });
    chrome.action.setTitle({ title: '正在处理...' });
  } catch (error) {
    logError('显示处理中状态失败', error);
  }
}

function showSuccessState() {
  try {
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
      chrome.action.setTitle({ title: 'Bearer Token Copier' });
    }, 3000);
  } catch (error) {
    logError('显示成功状态失败', error);
  }
}

function showErrorState() {
  try {
    chrome.action.setBadgeText({ text: '✗' });
    chrome.action.setBadgeBackgroundColor({ color: '#F44336' });
    chrome.action.setTitle({ title: '复制失败' });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
      chrome.action.setTitle({ title: 'Bearer Token Copier' });
    }, 5000);
  } catch (error) {
    logError('显示错误状态失败', error);
  }
}

// ========== 通知管理 ==========

function showNotification(title, message, type = 'success') {
  try {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title,
      message,
      priority: type === 'error' ? 2 : 1
    }, (notificationId) => {
      setTimeout(() => chrome.notifications.clear(notificationId),
        type === 'success' ? 3000 : 5000);
    });
  } catch (error) {
    logError('显示通知失败', error);
  }
}

// ========== 网络请求监听（bearer 模式）==========

chrome.webRequest.onBeforeSendHeaders.addListener(
  async (details) => {
    try {
      const tabId = details.tabId;
      if (tabId === -1 || tabId !== pendingTabId) return {};

      const config = await getConfig();
      if (config.mode !== 'bearer') return {};

      const headers = details.requestHeaders || [];
      for (const header of headers) {
        if (header.name.toLowerCase() === 'authorization') {
          const token = extractToken(header.value);
          if (token) { saveToken(token, tabId); break; }
        }
      }
    } catch (error) {
      logError('监听请求失败', error);
    }
    return {};
  },
  { urls: ['<all_urls>'] },
  ['requestHeaders']
);

log('网络请求监听已启动');

// ========== 核心执行逻辑 ==========

async function executeCopy(tab) {
  if (isProcessing) {
    log('正在处理中，忽略请求');
    return;
  }

  isProcessing = true;
  showProcessingState();

  try {
    const config = await getConfig();
    log('当前配置:', config);

    if (config.mode === 'cookie') {
      // Cookie 模式：刷新页面后读取 cookie（等待页面加载完成）
      if (!config.cookieName) {
        showNotification('未配置 Cookie ⚠️', '请先在配置页填写 Cookie 名称', 'warning');
        showErrorState();
        return;
      }

      pendingTabId = tab.id;
      await chrome.tabs.reload(tab.id);
      await waitForPageLoad(tab.id);

      // 获取刷新后的 cookie
      const cookieValue = await getCookieValue(tab, config.cookieName);
      pendingTabId = null;

      if (!cookieValue) {
        showNotification(
          `未找到 Cookie ⚠️`,
          `找不到名为 "${config.cookieName}" 的 Cookie`,
          'warning'
        );
        showErrorState();
        return;
      }

      copyValueToTab(tab.id, cookieValue);

    } else {
      // Bearer 模式：刷新页面后等待网络请求监听器捕获 Token
      pendingTabId = tab.id;
      await chrome.tabs.reload(tab.id);

      const timeout = 5000;
      const startTime = Date.now();
      while (pendingTabId === tab.id && Date.now() - startTime < timeout) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (pendingTabId === tab.id) {
        log('未捕获到 Token（超时）');
        showNotification('未找到 Token ⚠️', '请确认页面已登录或包含 API 请求', 'warning');
        showErrorState();
        pendingTabId = null;
      }
    }
  } catch (error) {
    logError('处理失败', error);
    showNotification('操作失败 ❌', error.message, 'error');
    showErrorState();
    pendingTabId = null;
  } finally {
    isProcessing = false;
  }
}

function waitForPageLoad(tabId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error('页面加载超时'));
    }, 10000);

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

// ========== 消息监听（来自 popup 和 content script）==========

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  log('收到消息：', request);

  if (request.action === 'triggerCopy') {
    // Popup 触发复制
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) executeCopy(tabs[0]);
    });
    sendResponse({ ok: true });

  } else if (request.action === 'copySuccess') {
    const tokenLength = request.tokenLength || 0;
    showNotification('已复制 ✅', `复制了 ${tokenLength} 字符`, 'success');
    showSuccessState();
    isProcessing = false;

  } else if (request.action === 'copyFailed') {
    showNotification('复制失败 ❌', request.error || '无法访问剪贴板', 'error');
    showErrorState();
    isProcessing = false;

  } else if (request.action === 'noToken') {
    showNotification('未找到内容 ⚠️', '请确认页面已登录', 'warning');
    showErrorState();
    isProcessing = false;
  }

  return true;
});

// ========== 图标单击：直接触发复制 ==========

chrome.action.onClicked.addListener((tab) => {
  log('用户单击图标，标签页ID:', tab.id);
  executeCopy(tab);
});

// ========== 初始化 ==========
log('Token Auto Copier 已启动');
updateIcon(false);

