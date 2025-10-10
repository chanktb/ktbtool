// background.js (Phiên bản cuối cùng - 1 phím tắt)

chrome.commands.onCommand.addListener(async (command) => {
    if (command === "activate-and-crop") {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            try {
                // Tiêm thư viện TRƯỚC, sau đó mới đến script chính
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['lib/piexif.js', 'content_scripts/selector.js']
                });
                await chrome.tabs.sendMessage(tab.id, { action: "start-selection" });
            } catch (err) { console.error(`Failed to execute script or send message: ${err}`); }
        }
    }
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