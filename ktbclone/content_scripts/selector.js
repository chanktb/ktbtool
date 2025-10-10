// content_scripts/selector.js (Phiên bản khôi phục thuật toán tách nền sắc nét)

if (typeof window.ktbClonerScriptInjected === "undefined") {
  window.ktbClonerScriptInjected = true;

  // --- 1. CẤU HÌNH (Vui lòng kiểm tra lại) ---
  const MOCKUP_SETS = [
    {
      name: "Printiment",
      id: "printiment",
      extension: "jpg",
      coords: { x: 423, y: 305, w: 404, h: 527 },
      defaults: {
        prefix: "Official",
        suffix: "Tee Sweater Hoodie",
        watermark: "printiment.png",
      },
    },
    {
      name: "KTBTee",
      id: "ktbtee",
      extension: "webp",
      coords: { x: 362, y: 254, w: 424, h: 582 },
      defaults: {
        prefix: "Original",
        suffix: "Shirt",
        watermark: "ktbtee.png",
      },
    },
    {
      name: "Whatwillwear",
      id: "whatwillwear",
      extension: "jpg",
      coords: { x: 370, y: 356, w: 415, h: 610 },
      defaults: {
        prefix: "Premium",
        suffix: "Sweatshirt Tee",
        watermark: "whatwillwear.png",
      },
    },
    {
      name: "Amertee",
      id: "amertee",
      extension: "jpg",
      coords: { x: 373, y: 240, w: 447, h: 601 },
      defaults: {
        prefix: "Original",
        suffix: "Shirt Hoodie",
        watermark: "amertee.png",
      },
    },
    {
      name: "Albumcoverprint",
      id: "albumcoverprint",
      extension: "jpg",
      coords: { x: 358, y: 240, w: 469, h: 583 },
      defaults: {
        prefix: "Trendy",
        suffix: "Sweater Tee",
        watermark: "albumcoverprint.png",
      },
    },
  ];
  const TITLE_CLEAN_KEYWORDS = [
    "Orament-Christmas-den",
    "Ornament-X-Mas-2024",
    "Ornament-poster-black",
    "Orament-X-mas",
    "Mug-and-Ornament",
    "Longsleeve-Shirt",
    "T-shirts-shirt",
    "t-shirt-white",
    "t-shirt-black",
    "Posters-black",
    "Posters-white",
    "black-poster",
    "white-poster",
    "long-sleeve",
    "poster-portrait",
    "Poster-Canvas",
    "ladies-tee",
    "v-neck",
    "t-shirt_classic",
    "shirt_classic",
    "shirts-men-shirt",
    "White-Ornaments",
    "white-shirt",
    "classic-mens",
    "men-shirt",
    "sweatshirt",
    "t-shirts",
    "t-shirt",
    "tshirt",
    "Ladies",
    "sweater",
    "hoodie",
    "Official",
    "ornament",
    "poster",
    "shirt",
    "Original",
    "Originals",
    "Unisex",
    "mug",
    "shirt0",
	"gift0"
  ];

  // --- 2. CÁC HÀM TIỆN ÍCH VÀ XỬ LÝ ẢNH ---
  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = url;
    });
  }
  function magicWandRemove(ctx, canvas, startX, startY, tolerance) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const width = canvas.width;
    const height = canvas.height;
    const seedIdx = (startY * width + startX) * 4;
    if (data[seedIdx + 3] === 0) return;
    const sr = data[seedIdx],
      sg = data[seedIdx + 1],
      sb = data[seedIdx + 2];
    const stack = [[startX, startY]];
    while (stack.length > 0) {
      const [x, y] = stack.pop();
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      const idx = y * width + x;
      const i = idx * 4;
      if (data[i + 3] === 0) continue;
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      const colorMatch =
        Math.abs(r - sr) <= tolerance &&
        Math.abs(g - sg) <= tolerance &&
        Math.abs(b - sb) <= tolerance;
      if (colorMatch) {
        data[i + 3] = 0;
        stack.push([x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]);
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
  function getTrimmedCanvas(canvas) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let minX = canvas.width,
      minY = canvas.height,
      maxX = 0,
      maxY = 0;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        if (data[(y * canvas.width + x) * 4 + 3] > 0) {
          minX = Math.min(x, minX);
          minY = Math.min(y, minY);
          maxX = Math.max(x, maxX);
          maxY = Math.max(y, maxY);
        }
      }
    }
    if (minX > maxX || minY > maxY) {
      const newCanvas = document.createElement("canvas");
      newCanvas.width = 1;
      newCanvas.height = 1;
      return newCanvas;
    }
    const padding = 10;
    const newWidth = maxX - minX + 1 + padding * 2;
    const newHeight = maxY - minY + 1 + padding * 2;
    const newCanvas = document.createElement("canvas");
    newCanvas.width = newWidth;
    newCanvas.height = newHeight;
    newCanvas
      .getContext("2d")
      .drawImage(
        canvas,
        minX,
        minY,
        maxX - minX + 1,
        maxY - minY + 1,
        padding,
        padding,
        maxX - minX + 1,
        maxY - minY + 1
      );
    return newCanvas;
  }
  async function removeBackground(canvas) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const tolerance = 30;
    const width = canvas.width;
    const height = canvas.height;
    const corners = [
      { x: 1, y: 1 },
      { x: width - 2, y: 1 },
      { x: 1, y: height - 2 },
      { x: width - 2, y: height - 2 },
    ];
    for (const corner of corners) {
      magicWandRemove(ctx, canvas, corner.x, corner.y, tolerance);
    }
    return getTrimmedCanvas(canvas);
  }
  function determineShirtColor(image, coords) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    const pixelData = ctx.getImageData(coords.x + 1, coords.y + 1, 1, 1).data;
    const brightness = (pixelData[0] + pixelData[1] + pixelData[2]) / 3;
    return brightness > 150;
  }
  function cleanTitle(fileName) {
    let stem = fileName;
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      stem = fileName.substring(0, lastDotIndex);
    }
    const sortedKeywords = [...TITLE_CLEAN_KEYWORDS].sort(
      (a, b) => b.length - a.length
    );
    sortedKeywords.forEach((keyword) => {
      const pattern = new RegExp(
        `\\b${keyword.replace(/[-_\s]/g, "[-_\\s]?")}\\b`,
        "gi"
      );
      stem = stem.replace(pattern, "");
    });
    stem = stem.replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
    return stem || "downloaded-design";
  }
  function rotateCanvas(canvas, angle) {
    const angleInDegrees = parseInt(angle, 10) || 0;
    if (angleInDegrees === 0) return canvas;
    const rad = (angleInDegrees * Math.PI) / 180;
    const w = canvas.width;
    const h = canvas.height;
    const newWidth = Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad));
    const newHeight = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad));
    const rotatedCanvas = document.createElement("canvas");
    rotatedCanvas.width = newWidth;
    rotatedCanvas.height = newHeight;
    const ctx = rotatedCanvas.getContext("2d");
    ctx.translate(newWidth / 2, newHeight / 2);
    ctx.rotate(rad);
    ctx.drawImage(canvas, -w / 2, -h / 2);
    return rotatedCanvas;
  }
  async function composeOnMockup(
    designCanvas,
    originalImage,
    cropCoords,
    selectedMockup,
    watermarkValue
  ) {
    const isWhiteShirt = determineShirtColor(originalImage, cropCoords);
    const color = isWhiteShirt ? "white" : "black";
    const mockupFileName = `${selectedMockup.id}_${color}.${selectedMockup.extension}`;
    const mockupUrl = chrome.runtime.getURL(`assets/mockups/${mockupFileName}`);
    const mockupImage = await loadImage(mockupUrl);
    const finalCanvas = document.createElement("canvas");
    const ctx = finalCanvas.getContext("2d", { willReadFrequently: true });
    finalCanvas.width = mockupImage.width;
    finalCanvas.height = mockupImage.height;
    ctx.drawImage(mockupImage, 0, 0);
    const designW = designCanvas.width;
    const designH = designCanvas.height;
    const {
      x: frameX,
      y: frameY,
      w: frameW,
      h: frameH,
    } = selectedMockup.coords;
    let finalDesignW, finalDesignH, finalDesignX, finalDesignY;
    const designRatio = designW / designH;
    const frameRatio = frameW / frameH;
    if (designRatio >= frameRatio) {
      finalDesignW = frameW;
      finalDesignH = frameW / designRatio;
      finalDesignX = frameX;
      finalDesignY = frameY;
    } else {
      finalDesignH = frameH;
      finalDesignW = frameH * designRatio;
      finalDesignY = frameY;
      finalDesignX = frameX + (frameW - finalDesignW) / 2;
    }
    ctx.drawImage(
      designCanvas,
      finalDesignX,
      finalDesignY,
      finalDesignW,
      finalDesignH
    );
    if (watermarkValue) {
      const isImage = /\.(jpg|jpeg|png|webp)$/i.test(watermarkValue);
      if (isImage) {
        try {
          const watermarkUrl = chrome.runtime.getURL(
            `assets/watermarks/${watermarkValue}`
          );
          const watermarkImg = await loadImage(watermarkUrl);
          const padding = 50;
          const maxWidth = 280;
          const scale = Math.min(1, maxWidth / watermarkImg.width);
          const sigWidth = watermarkImg.width * scale;
          const sigHeight = watermarkImg.height * scale;
          const sigX = finalCanvas.width - sigWidth - padding;
          const sigY = finalCanvas.height - sigHeight - padding;
          ctx.drawImage(watermarkImg, sigX, sigY, sigWidth, sigHeight);
        } catch (error) {
          console.warn("Không thể tải ảnh watermark:", watermarkValue);
        }
      } else {
        ctx.font = "bold 60px Verdana";
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        const padding = 20;
        ctx.fillText(
          watermarkValue,
          finalCanvas.width - padding,
          finalCanvas.height - padding
        );
      }
    }
    return finalCanvas;
  }
  function _convert_to_gps(value, is_longitude) {
    const abs_value = Math.abs(value);
    const ref = is_longitude
      ? value >= 0
        ? "E"
        : "W"
      : value >= 0
      ? "N"
      : "S";
    const degrees = Math.floor(abs_value);
    const minutes_float = (abs_value - degrees) * 60;
    const minutes = Math.floor(minutes_float);
    const seconds_float = (minutes_float - minutes) * 60;
    return {
      value: [
        [degrees, 1],
        [minutes, 1],
        [Math.round(seconds_float * 100), 100],
      ],
      ref: ref,
    };
  }
  function createExifData(mockupId, final_filename, exif_defaults) {
    const domain_exif = mockupId + ".com";
    const now = new Date();
    const digitized_time = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const original_time = new Date(
      digitized_time.getTime() -
        (Math.floor(Math.random() * (7500 - 3600 + 1)) + 3600) * 1000
    );
    const toExifDT = (date) =>
      date.toISOString().slice(0, 19).replace("T", " ").replace(/-/g, ":");
    try {
      const zeroth = {};
      zeroth[piexif.ImageIFD.Artist] = domain_exif;
      zeroth[piexif.ImageIFD.Copyright] = domain_exif;
      zeroth[piexif.ImageIFD.ImageDescription] = final_filename;
      zeroth[piexif.ImageIFD.Software] =
        exif_defaults.Software || "Adobe Photoshop 25.0";
      zeroth[piexif.ImageIFD.DateTime] = toExifDT(digitized_time);
      zeroth[piexif.ImageIFD.Make] = exif_defaults.Make || "";
      zeroth[piexif.ImageIFD.Model] = exif_defaults.Model || "";
      const exif = {};
      exif[piexif.ExifIFD.DateTimeOriginal] = toExifDT(original_time);
      exif[piexif.ExifIFD.DateTimeDigitized] = toExifDT(digitized_time);
      exif[piexif.ExifIFD.FNumber] = exif_defaults.FNumber || [0, 1];
      exif[piexif.ExifIFD.ExposureTime] = exif_defaults.ExposureTime || [0, 1];
      exif[piexif.ExifIFD.ISOSpeedRatings] = exif_defaults.ISOSpeedRatings || 0;
      exif[piexif.ExifIFD.FocalLength] = exif_defaults.FocalLength || [0, 1];
      const gps = {};
      const { GPSLatitude, GPSLongitude } = exif_defaults;
      if (GPSLatitude !== undefined && GPSLongitude !== undefined) {
        const gps_lat_data = _convert_to_gps(GPSLatitude, false);
        const gps_lon_data = _convert_to_gps(GPSLongitude, true);
        gps[piexif.GPSIFD.GPSLatitude] = gps_lat_data.value;
        gps[piexif.GPSIFD.GPSLatitudeRef] = gps_lat_data.ref;
        gps[piexif.GPSIFD.GPSLongitude] = gps_lon_data.value;
        gps[piexif.GPSIFD.GPSLongitudeRef] = gps_lon_data.ref;
      }
      const exifObj = { "0th": zeroth, Exif: exif, GPS: gps };
      return piexif.dump(exifObj);
    } catch (e) {
      console.error("Lỗi khi tạo dữ liệu EXIF:", e);
      return null;
    }
  }

  // =======================================================================
  // === 3. LOGIC CHÍNH CỦA EXTENSION ===
  // =======================================================================
  let overlay = null;
  let selectionBox = null;
  let isSelecting = false;
  let startCoords = { x: 0, y: 0 };

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "start-selection") {
      if (!overlay) createOverlay();
    } else if (msg.action === "processCrop") {
      processScreenshot(msg);
    }
  });
  function createOverlay() {
    overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      cursor: "crosshair",
      zIndex: 999999,
    });
    document.body.appendChild(overlay);
    selectionBox = document.createElement("div");
    Object.assign(selectionBox.style, {
      position: "absolute",
      border: "2px dashed #fff",
      boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
      zIndex: 1000000,
    });
    overlay.appendChild(selectionBox);
    overlay.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
  }
  function onMouseDown(e) {
    isSelecting = true;
    startCoords = { x: e.clientX, y: e.clientY };
    Object.assign(selectionBox.style, {
      left: startCoords.x + "px",
      top: startCoords.y + "px",
      width: "0px",
      height: "0px",
    });
    overlay.addEventListener("mousemove", onMouseMove);
    overlay.addEventListener("mouseup", onMouseUp);
  }
  function onMouseMove(e) {
    if (!isSelecting) return;
    const x = Math.min(e.clientX, startCoords.x);
    const y = Math.min(e.clientY, startCoords.y);
    const w = Math.abs(e.clientX - startCoords.x);
    const h = Math.abs(e.clientY - startCoords.y);
    Object.assign(selectionBox.style, {
      left: x + "px",
      top: y + "px",
      width: w + "px",
      height: h + "px",
    });
  }

  async function onMouseUp(e) {
    isSelecting = false;
    overlay.style.display = "none";
    let filename = "cropped-image";
    const host = window.location.hostname;
    const settings = await chrome.storage.sync.get([
      "filenameSources",
      "initialWarningShown",
    ]);
    const sources = settings.filenameSources || {};
    const sourceMethod = host && sources[host] ? sources[host] : "image_src";
    if (!settings.initialWarningShown) {
      alert(
        "Thông báo: Tên file đang được lấy từ nguồn mặc định (tên ảnh gốc). Bạn có thể thay đổi cài đặt này cho từng trang web trong popup của extension."
      );
      chrome.storage.sync.set({ initialWarningShown: true });
    }
    if (sourceMethod === "clipboard") {
      try {
        const clipboardText = await navigator.clipboard.readText();
        if (clipboardText.trim()) {
          filename = clipboardText.trim();
        }
      } catch (error) {
        console.warn(
          "Không thể đọc clipboard, sẽ dùng tên file gốc. Lỗi:",
          error.message
        );
      }
    }
    if (filename === "cropped-image") {
      overlay.style.pointerEvents = "none";
      const elementUnderCursor = document.elementFromPoint(
        e.clientX,
        e.clientY
      );
      overlay.style.pointerEvents = "auto";
      if (
        elementUnderCursor &&
        elementUnderCursor.tagName === "IMG" &&
        elementUnderCursor.src
      ) {
        try {
          const url = new URL(elementUnderCursor.src, window.location.href);
          const pathParts = url.pathname.split("/");
          const fname = pathParts.pop() || "image";
          filename = fname.substring(0, fname.lastIndexOf(".")) || fname;
        } catch (error) {
          console.warn(
            "Không thể lấy tên file từ src:",
            elementUnderCursor.src
          );
        }
      }
    }
    const dpr = window.devicePixelRatio || 1;
    const cropData = {
      x: Math.floor(Math.min(e.clientX, startCoords.x) * dpr),
      y: Math.floor(Math.min(e.clientY, startCoords.y) * dpr),
      w: Math.ceil(Math.abs(e.clientX - startCoords.x) * dpr),
      h: Math.ceil(Math.abs(e.clientY - startCoords.y) * dpr),
    };
    const result = await chrome.storage.sync.get(["selectedMockupId"]);
    const selectedId = result.selectedMockupId || MOCKUP_SETS[0].id;
    const selectedMockup = MOCKUP_SETS.find((m) => m.id === selectedId);
    setTimeout(() => {
      chrome.runtime.sendMessage({
        action: "captureTab",
        cropData: cropData,
        filename: filename,
        selectedMockup: selectedMockup,
      });
      cleanup();
    }, 100);
  }

  async function processScreenshot(msg) {
    if (!msg.cropData || msg.cropData.w <= 0 || msg.cropData.h <= 0) return;
    try {
      const screenshotImg = await loadImage(msg.dataUrl);
      const designCanvas = document.createElement("canvas");
      designCanvas.width = msg.cropData.w;
      designCanvas.height = msg.cropData.h;
      const designCtx = designCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      designCtx.drawImage(
        screenshotImg,
        msg.cropData.x,
        msg.cropData.y,
        msg.cropData.w,
        msg.cropData.h,
        0,
        0,
        msg.cropData.w,
        msg.cropData.h
      );
      const transparentDesignCanvas = await removeBackground(designCanvas);

      const settings = await chrome.storage.sync.get([
        "settingOverrides",
        "rotationAngle",
      ]);
      const overrides = settings.settingOverrides || {};
      const mockupOverrides = overrides[msg.selectedMockup.id] || {};
      const angle = settings.rotationAngle || 0;

      const rotatedDesignCanvas = rotateCanvas(transparentDesignCanvas, angle);

      const prefix =
        mockupOverrides.prefix !== undefined
          ? mockupOverrides.prefix
          : msg.selectedMockup.defaults.prefix;
      const suffix =
        mockupOverrides.suffix !== undefined
          ? mockupOverrides.suffix
          : msg.selectedMockup.defaults.suffix;
      const watermark =
        mockupOverrides.watermark !== undefined
          ? mockupOverrides.watermark
          : msg.selectedMockup.defaults.watermark;

      const finalCanvas = await composeOnMockup(
        rotatedDesignCanvas,
        screenshotImg,
        msg.cropData,
        msg.selectedMockup,
        watermark
      );
      const cleanedName = cleanTitle(msg.filename);
      const finalFilename = [prefix, cleanedName, suffix]
        .filter(Boolean)
        .join(" ")
        .trim();

      let dataUrl = finalCanvas.toDataURL("image/jpeg", 0.9);

      // Các giá trị EXIF mặc định
      const exif_defaults = {
        Software: "Adobe Photoshop 22.3",
        Make: "Canon",
        Model: "Canon EOS R5",
        GPSLatitude: 33.7465515,
        GPSLongitude: -118.0297799,
        FNumber: [28, 10],
        ExposureTime: [1, 125],
        ISOSpeedRatings: 100,
        FocalLength: [50, 1],
      };

      const exifBytes = createExifData(
        msg.selectedMockup.id,
        finalFilename,
        exif_defaults
      );
      if (exifBytes) {
        dataUrl = piexif.insert(exifBytes, dataUrl);
      }

      chrome.runtime.sendMessage({
        action: "downloadImage",
        dataUrl: dataUrl,
        filename: finalFilename + ".jpg",
      });
    } catch (error) {
      console.error("Lỗi trong quá trình xử lý ảnh:", error);
      alert("Có lỗi xảy ra, vui lòng kiểm tra Console (F12).");
    }
  }

  function onKeyDown(e) {
    if (e.key === "Escape") cleanup();
  }
  function cleanup() {
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
    document.removeEventListener("keydown", onKeyDown);
  }
}
