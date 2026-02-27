/**
 * Token Auto Copier - Content Script
 *
 * @author Zjmainstay
 * @link https://github.com/Zjmainstay
 *
 * 功能：
 * 1. 接收来自Background的消息
 * 2. 执行复制Token到剪贴板的操作
 * 3. 向Background反馈复制结果
 */

// ========== 日志工具 ==========
function log(message, ...args) {
  console.log(`[TokenCopier Content] ${message}`, ...args);
}

function logError(message, error) {
  if (error && error.message) {
    console.error(`[TokenCopier Content] ${message}: ${error.message}`);
  } else if (typeof error === 'object' && error !== null) {
    console.error(`[TokenCopier Content] ${message}:`, error.name || error.toString());
  } else {
    console.error(`[TokenCopier Content] ${message}`, error);
  }
}

// ========== 剪贴板操作 ==========

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} - 是否成功
 */
async function copyToClipboard(text) {
  if (!text) {
    logError('复制文本为空');
    return false;
  }

  try {
    // 优先使用现代Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      log(`使用Clipboard API复制成功（${text.length}字符）`);
      return true;
    }

    // 降级方案：使用execCommand
    log('Clipboard API不可用，使用降级方案');
    return copyUsingExecCommand(text);
  } catch (error) {
    // Clipboard API失败（通常是权限或焦点问题），使用降级方案
    log(`Clipboard API失败（${error.name}），使用降级方案`);

    // 尝试降级方案
    try {
      return copyUsingExecCommand(text);
    } catch (fallbackError) {
      logError('降级方案也失败', fallbackError);
      return false;
    }
  }
}

/**
 * 使用execCommand复制（降级方案）
 * @param {string} text - 要复制的文本
 * @returns {boolean} - 是否成功
 */
function copyUsingExecCommand(text) {
  try {
    // 创建临时textarea元素
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    textarea.setAttribute('readonly', '');

    document.body.appendChild(textarea);

    // 选中文本
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    // 执行复制命令
    const success = document.execCommand('copy');

    // 清理
    document.body.removeChild(textarea);

    if (success) {
      log(`使用execCommand复制成功（${text.length}字符）`);
      return true;
    } else {
      logError('execCommand返回false');
      return false;
    }
  } catch (error) {
    logError('execCommand执行失败', error);
    return false;
  }
}

// ========== 消息监听 ==========

/**
 * 监听来自Background的消息
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  log('收到消息：', request);

  if (request.action === 'copyToken') {
    const token = request.token;

    if (!token) {
      log('Token为空');
      chrome.runtime.sendMessage({ action: 'noToken' });
      sendResponse({ success: false, error: 'Token为空' });
      return true;
    }

    // 确保document已聚焦
    try {
      window.focus();
      document.body?.focus();
    } catch (e) {
      log('聚焦失败，但继续尝试复制:', e);
    }

    // 等待一小段时间确保聚焦完成
    setTimeout(() => {
      // 异步复制
      copyToClipboard(token)
        .then((success) => {
          if (success) {
            log('Token复制成功');
            chrome.runtime.sendMessage({
              action: 'copySuccess',
              tokenLength: token.length
            });
            sendResponse({ success: true });
          } else {
            logError('Token复制失败');
            chrome.runtime.sendMessage({
              action: 'copyFailed',
              error: '复制操作失败'
            });
            sendResponse({ success: false, error: '复制失败' });
          }
        })
        .catch((error) => {
          logError('复制过程异常', error);
          chrome.runtime.sendMessage({
            action: 'copyFailed',
            error: error.message || '未知错误'
          });
          sendResponse({ success: false, error: error.message });
        });
    }, 100);

    return true; // 保持消息通道开启（异步响应）
  }

  return false;
});

// ========== 初始化 ==========
log('Token Auto Copier Content Script 已加载');
