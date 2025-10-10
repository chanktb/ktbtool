// Lắng nghe tin nhắn từ background script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "startCrop") {
    startCropScreenshot();
  } else if (msg.action === "processCrop") {
    processCrop(msg);
  }
});

// Danh sách từ cần loại bỏ
const blacklist = [
  "Orament-Christmas-den","Ornament-X-Mas-2024","Ornament-poster-black",
  "Mug-and-Ornament","T-shirts-shirt","t-shirt-white","t-shirt-black",
  "Posters-black","Posters-white","black-poster","white-poster",
  "poster-portrait","Poster-Canvas","ladies-tee","t-shirt_classic",
  "shirt_classic","shirts-men-shirt","ornamnet-den","ornament-den",
  "classic-mens","hoodie-teeslocal","ornaments-black","White-Ornaments",
  "Black-Ornaments","white-long-sleeve","white-shirt","sweatshirt",
  "t-shirts","t-shirt","v-neck","tshirt","sweater","hoodie",
  "Official","ornament","poster","shirt","shirts","Original","Originals",
  "mug","unisex","long sleeve", "long sleve", "ladies"
];

function cleanFilename(filename) {
  let cleaned = filename;
  const sortedBlacklist = [...blacklist].sort((a, b) => b.length - a.length);

  sortedBlacklist.forEach(word => {
    const escapedWord = word.toLowerCase().replace(/[-_\s]+/g, "[\\s_-]*");
    const pattern = `\\b${escapedWord}\\b`;
    const regex = new RegExp(pattern, "gi");
    cleaned = cleaned.replace(regex, "");
  });

  cleaned = cleaned.replace(/[\s_-]+/g, " ").trim();
  return cleaned || "image";
}

function startCropScreenshot() {
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    cursor: "crosshair", zIndex: 9999
  });
  document.body.appendChild(overlay);

  const rect = document.createElement("div");
  Object.assign(rect.style, {
    position: "absolute",
    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.8)",
    zIndex: 10000
  });
  overlay.appendChild(rect);

  let startX, startY;
  let filename = "cropped image";

  function mouseDown(e) {
    overlay.style.pointerEvents = "none";
    const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
    overlay.style.pointerEvents = "auto";

    if (elementUnderCursor && elementUnderCursor.tagName === 'IMG') {
      const img = elementUnderCursor;
      if (img.src) {
        try {
          const url = new URL(img.src);
          const pathParts = url.pathname.split('/');
          const fname = pathParts[pathParts.length - 1];
          const nameWithoutExt = fname.substring(0, fname.lastIndexOf('.')) || fname;
          filename = cleanFilename(nameWithoutExt);
        } catch (error) {
          console.warn("Could not parse image src as URL:", img.src);
        }
      }
    }

    startX = e.clientX;
    startY = e.clientY;
    rect.style.left = startX + "px";
    rect.style.top = startY + "px";
    rect.style.width = "0px";
    rect.style.height = "0px";
    overlay.addEventListener("mousemove", mouseMove);
    overlay.addEventListener("mouseup", mouseUp);
  }

  function mouseMove(e) {
    const x = Math.min(e.clientX, startX);
    const y = Math.min(e.clientY, startY);
    const w = Math.abs(e.clientX - startX);
    const h = Math.abs(e.clientY - startY);
    rect.style.left = x + "px";
    rect.style.top = y + "px";
    rect.style.width = w + "px";
    rect.style.height = h + "px";
  }

  function mouseUp(e) {
    // Ngắt các listener để tránh sự kiện không mong muốn
    overlay.removeEventListener("mousemove", mouseMove);
    overlay.removeEventListener("mouseup", mouseUp);

    // Tính toán kích thước vùng chọn
    const sX = Math.min(e.clientX, startX);
    const sY = Math.min(e.clientY, startY);
    const eX = Math.max(e.clientX, startX);
    const eY = Math.max(e.clientY, startY);
    const selectionWidth = eX - sX;
    const selectionHeight = eY - sY;
    
    // ====================== THAY ĐỔI CHÍNH Ở ĐÂY ======================
    // Nếu vùng chọn quá nhỏ (nhỏ hơn 50x50), hủy bỏ thao tác
    if (selectionWidth < 50 || selectionHeight < 50) {
        console.log("Hủy cắt ảnh: Vùng chọn quá nhỏ.");
        document.body.removeChild(overlay); // Xóa lớp phủ để trở lại bình thường
        return; // Dừng hàm tại đây, không thực hiện các bước tiếp theo
    }
    // =================================================================

    // Nếu vùng chọn hợp lệ, tiếp tục quá trình
    overlay.style.display = "none"; // Ẩn lớp phủ để không thấy nó trong ảnh chụp
    
    const dpr = window.devicePixelRatio || 1;
    const cropX = Math.floor(sX * dpr);
    const cropY = Math.floor(sY * dpr);
    const cropW = Math.ceil(selectionWidth * dpr);
    const cropH = Math.ceil(selectionHeight * dpr);
    
    // Dùng setTimeout để đảm bảo trình duyệt có thời gian ẩn lớp phủ trước khi chụp
    setTimeout(() => {
        chrome.runtime.sendMessage({
            action: "captureTab",
            cropX,
            cropY,
            cropW,
            cropH,
            filename
        });
        // Xóa lớp phủ sau khi đã gửi tin nhắn
        if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
        }
    }, 50);
  }

  overlay.addEventListener("mousedown", mouseDown);
}

function processCrop(msg) {
  if (msg.cropW <= 0 || msg.cropH <= 0) {
      console.warn("Crop dimensions are invalid. Aborting crop.");
      return;
  }
    
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = msg.cropW;
    canvas.height = msg.cropH;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, msg.cropX, msg.cropY, msg.cropW, msg.cropH, 0, 0, msg.cropW, msg.cropH);

    canvas.toBlob(blob => {
      if (!blob) return console.error("canvas.toBlob failed");
      const url = URL.createObjectURL(blob);
      chrome.runtime.sendMessage({action: "download", url, filename: msg.filename});
    }, 'image/png');
  };
  img.onerror = () => {
    console.error("Failed to load image for cropping from dataUrl.");
  };
  img.src = msg.dataUrl;
}