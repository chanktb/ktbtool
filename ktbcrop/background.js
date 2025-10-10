// Lắng nghe phím tắt
chrome.commands.onCommand.addListener((command) => {
  if (command === "crop-image") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        // Gửi tin nhắn và xử lý lỗi nếu content script không tồn tại
        chrome.tabs.sendMessage(tabs[0].id, { action: "startCrop" }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn("Could not establish connection. Content script might not be injected:", chrome.runtime.lastError.message);
          }
        });
      }
    });
  }
});

// Nhận yêu cầu từ content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Xử lý yêu cầu chụp ảnh màn hình
  if (msg.action === "captureTab") {
    chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        console.error("Failed to capture tab:", chrome.runtime.lastError?.message);
        return;
      }
      // Trả dataUrl về content script để crop
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "processCrop",
        dataUrl,
        cropX: msg.cropX,
        cropY: msg.cropY,
        cropW: msg.cropW,
        cropH: msg.cropH,
        filename: msg.filename,
      });
    });
  }

  // Xử lý download
  if (msg.action === "download") {
    // Lấy cài đặt 'saveAs' từ storage, nếu chưa có thì mặc định là true (luôn hỏi)
    chrome.storage.sync.get({ saveAs: false }, (options) => {
      chrome.downloads.download({
        url: msg.url,
        filename: msg.filename + ".png" || "cropped-image.png",
        // Sử dụng giá trị đã lưu từ cài đặt của người dùng
        saveAs: options.saveAs 
      });
    });
  }
});