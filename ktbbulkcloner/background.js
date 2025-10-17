// Thêm code này vào background.js
chrome.action.onClicked.addListener((tab) => {
    // Lấy URL của file popup.html trong extension
    const tabUrl = chrome.runtime.getURL("popup.html");

    // Kiểm tra xem tab này đã mở chưa
    chrome.tabs.query({ url: tabUrl }, (tabs) => {
        if (tabs.length > 0) {
            // Nếu đã mở, active tab đó lên
            chrome.tabs.update(tabs[0].id, { active: true });
        } else {
            // Nếu chưa mở, tạo tab mới
            chrome.tabs.create({ url: tabUrl });
        }
    });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "captureTab") {
        chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: "png" }, (dataUrl) => {
            if (chrome.runtime.lastError || !dataUrl) {
                console.error("Không thể chụp màn hình:", chrome.runtime.lastError?.message);
                return;
            }
            chrome.tabs.sendMessage(sender.tab.id, {
                action: "processCrop",
                dataUrl,
                cropData: msg.cropData,
                filename: msg.filename,
                selectedMockup: msg.selectedMockup
            });
        });
        return true;
    }

    if (msg.action === "downloadImage") {
        chrome.downloads.download({
            url: msg.dataUrl,
            filename: msg.filename,
        });
    }
});