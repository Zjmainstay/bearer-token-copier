/**
 * Token Copier - Popup Script
 * 配置页逻辑：模式选择（Bearer Token / Cookie）、配置保存
 */

const DEFAULT_CONFIG = { mode: 'bearer', cookieName: '' };

// ========== 初始化 ==========

document.addEventListener('DOMContentLoaded', async () => {
  const config = await loadConfig();
  applyConfig(config);

  // 模式选项点击（整行可点击）
  document.getElementById('opt-bearer').addEventListener('click', () => selectMode('bearer'));
  document.getElementById('opt-cookie').addEventListener('click', () => selectMode('cookie'));

  // 按钮
  document.getElementById('btn-reset').addEventListener('click', resetConfig);
  document.getElementById('btn-save').addEventListener('click', saveConfig);
});

// ========== 配置读写 ==========

async function loadConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['copyMode', 'cookieName'], (result) => {
      resolve({
        mode: result.copyMode || DEFAULT_CONFIG.mode,
        cookieName: result.cookieName || DEFAULT_CONFIG.cookieName,
      });
    });
  });
}

function applyConfig(config) {
  const radio = document.querySelector(`input[name="mode"][value="${config.mode}"]`);
  if (radio) radio.checked = true;

  document.getElementById('cookie-name').value = config.cookieName;
  toggleCookieConfig(config.mode === 'cookie');
}

async function saveConfig() {
  const mode = document.querySelector('input[name="mode"]:checked')?.value || 'bearer';
  const cookieName = document.getElementById('cookie-name').value.trim();

  if (mode === 'cookie' && !cookieName) {
    showStatus('请填写 Cookie 名称', 'error');
    document.getElementById('cookie-name').focus();
    return;
  }

  chrome.storage.local.set({ copyMode: mode, cookieName }, () => {
    if (chrome.runtime.lastError) {
      showStatus('保存失败：' + chrome.runtime.lastError.message, 'error');
    } else {
      showStatus('配置已保存', 'success');
    }
  });
}

function resetConfig() {
  applyConfig(DEFAULT_CONFIG);
  chrome.storage.local.set({ copyMode: DEFAULT_CONFIG.mode, cookieName: DEFAULT_CONFIG.cookieName });
  showStatus('已重置为默认配置', 'success');
}

// ========== UI 交互 ==========

function selectMode(mode) {
  const radio = document.getElementById(`mode-${mode}`);
  if (radio) radio.checked = true;
  toggleCookieConfig(mode === 'cookie');
  hideStatus();
}

function toggleCookieConfig(show) {
  document.getElementById('cookie-config').classList.toggle('hidden', !show);
}

function showStatus(text, type) {
  const bar = document.getElementById('status');
  document.getElementById('status-icon').textContent = type === 'success' ? '✓' : '✕';
  document.getElementById('status-text').textContent = text;
  bar.className = `status-bar ${type}`;

  clearTimeout(bar._timer);
  bar._timer = setTimeout(() => hideStatus(), 3000);
}

function hideStatus() {
  document.getElementById('status').className = 'status-bar hidden';
}
