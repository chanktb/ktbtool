// popup.js

document.addEventListener('DOMContentLoaded', () => {
  const saveAsToggle = document.getElementById('saveAsToggle');

  // Thay đổi giá trị mặc định ở đây từ true thành false
  chrome.storage.sync.get({ saveAs: false }, (options) => {
    saveAsToggle.checked = options.saveAs;
  });

  // Khi người dùng thay đổi checkbox, lưu cài đặt mới
  saveAsToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ saveAs: saveAsToggle.checked });
  });
});