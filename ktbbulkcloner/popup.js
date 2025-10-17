// popup.js (KtbBulkCloner)

// Chạy toàn bộ code khi HTML đã được tải xong
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CẤU HÌNH (TỪ v13.html & selector.js) ---

    // Proxy config (from v13.html)
    const cfProxy = "https://cors-proxy.trantpu.workers.dev/?url=";

    // Domain config (from v13.html)
    const allDomainsConfig = {
        "geekteesus.com": { type: "v13" },
        "techteesusa.com": { type: "v13" },
        "teeworksusa.com": { type: "v13" },
        "meredpremium.com": { type: "v13" },
        "orionshirt.com": { type: "v13" },
        "berrylittles.com": { type: "v13" },
        "dreameshirt.com": { type: "v13" },
        "teeextra.com": { type: "v13" },
        "eteeclothing.com": { type: "v13" },
        "milkywayshirt.com": { type: "v13" },
        "teespix.com": { type: "v13" },
        "nowbestshirt.com": { type: "v13" },
        "serenashirt.com": { type: "v13" },
        "fanaticity.com": { type: "v13" },
        "legendusashirt.com": { type: "v13" },
        "teehandus.com": { type: "v13" },
        "uscraftedtees.com": { type: "v13" },
        "capitoneshirt.com": { type: "v13" },
        "clickoneshirt.com": { type: "v13" },
        "teleteeshirt.com": { type: "v13" },
        "teeslocal.com": { type: "v13" },
        "melonashirt.com": { type: "v13" },
        "dalatshirt.com": { type: "v13" },
        "lovingsquad.com": { type: "v13" },
        "arjomany.com": { type: "v13" },
        "designatshop.com": { type: "v13" },
        "collectionpostertour.com": { type: "v13" },
        "neoteeco.com": { type: "v13" },
        "newshirtstore.com": { type: "v13" },
        "mercuryshirt.com": { type: "v13" },
    };

    // Title clean keywords (from v13.html)
    const title_clean_keywords = [
        "Orament-Christmas-den", "Ornament-X-Mas-2024", "Ornament-poster-black",
        "Mug-and-Ornament", "T-shirts-shirt", "t-shirt-white", "t-shirt-black",
        "Posters-black", "Posters-white", "black-poster", "white-poster",
        "poster-portrait", "Poster-Canvas", "ladies-tee", "t-shirt_classic",
        "shirt_classic", "shirts-men-shirt", "ornamnet-den", "ornament-den",
        "classic-mens", "hoodie-teeslocal", "ornaments-black", "White-Ornaments",
        "Black-Ornaments", "white-long-sleeve", "white-shirt", "sweatshirt",
        "t-shirts", "t-shirt", "v-neck", "tshirt", "sweater", "hoodie",
        "Official", "ornament", "poster", "shirt0", "shirts", "shirt", "Original", "Originals",
        "mug", "unisex", "long sleeve", "long sleve", "Two-Sided", "2-Sided", "Two-Side", "2-Side", "sided", "Sides", "ladies", "gift0"
    ];

    // Mockup config (from selector.js)
    const MOCKUP_SETS = [
        {
            name: "Printiment", id: "printiment", extension: "jpg",
            coords: { x: 441, y: 335, w: 363, h: 451 },
            defaults: { watermark: "printiment.png" },
        },
        {
            name: "KTBTee", id: "ktbtee", extension: "webp",
            coords: { x: 376, y: 261, w: 391, h: 483 },
            defaults: { watermark: "ktbtee.png" },
        },
        {
            name: "Whatwillwear", id: "whatwillwear", extension: "jpg",
            coords: { x: 393, y: 298, w: 381, h: 490 },
            defaults: { watermark: "whatwillwear.png" },
        },
        {
            name: "Amertee", id: "amertee", extension: "jpg",
            coords: { x: 373, y: 240, w: 447, h: 601 },
            defaults: { watermark: "amertee.png" },
        },
        {
            name: "Albumcoverprint", id: "albumcoverprint", extension: "jpg",
            coords: { x: 358, y: 240, w: 469, h: 583 },
            defaults: { watermark: "albumcoverprint.png" },
        },
    ];

    // --- 2. BIẾN TOÀN CỤC (GLOBAL STATE) ---
    let cropCoordsOnScreen = null;
    let originalCropCoords = null;
    let firstImageElement = null;
    let isCropping = false;
    let cropStartCoords = { x: 0, y: 0 };
    let selectionBox = null;
    let cropperContainer = null; 
    let statusDiv = null;
    let resultsDiv = null;
    let batchStatusDiv = null;
    
    // Giữ data sản phẩm
    window.allProducts = [];
    const productsPerPage = 100;

    // --- 3. CÁC HÀM XỬ LÝ ẢNH (TỪ selector.js) ---

    function loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous"; // Cần thiết để xử lý ảnh từ domain khác
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(new Error(`Không thể tải ảnh: ${url}. Lỗi: ${err.message}`));
            img.src = url;
        });
    }

    function getTrimmedCanvas(canvas) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;

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
            newCanvas.width = 1; newCanvas.height = 1;
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
                minX, minY, maxX - minX + 1, maxY - minY + 1,
                padding, padding, maxX - minX + 1, maxY - minY + 1
            );
        return newCanvas;
    }

    async function removeBackground(canvas) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const width = canvas.width;
        const height = canvas.height;
        const tolerance = 35;

        const cornerSamples = [
            { x: 1, y: 1 }, { x: width - 2, y: 1 },
            { x: 1, y: height - 2 }, { x: width - 2, y: height - 2 },
        ];

        const backgroundColors = cornerSamples.map(corner => {
            const i = (corner.y * width + corner.x) * 4;
            return { r: data[i], g: data[i + 1], b: data[i + 2] };
        }).filter(color => color.r !== undefined); // Lọc các giá trị không hợp lệ

        // Nếu không lấy được màu nền (ví dụ ảnh quá nhỏ), trả về canvas gốc
        if(backgroundColors.length === 0) {
             console.warn("Không thể lấy mẫu màu nền, trả về canvas gốc.");
             return canvas;
        }

        function isBackgroundColor(r, g, b) {
            return backgroundColors.some(bgColor =>
                Math.abs(r - bgColor.r) <= tolerance &&
                Math.abs(g - bgColor.g) <= tolerance &&
                Math.abs(b - bgColor.b) <= tolerance
            );
        }

        for (let i = 0; i < data.length; i += 4) {
            if (isBackgroundColor(data[i], data[i + 1], data[i + 2])) {
                data[i + 3] = 0; // Làm pixel trong suốt
            }
        }
        ctx.putImageData(imgData, 0, 0);
        return canvas;
    }

    function hardenAlphaChannel(canvas, threshold = 30) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > threshold) {
                data[i + 3] = 255;
            } else {
                data[i + 3] = 0;
            }
        }
        ctx.putImageData(imgData, 0, 0);
        return canvas;
    }

    /**
     * Sửa đổi: Nhận canvas và tọa độ gốc (originalCropCoords)
     * @param {HTMLCanvasElement} canvas - Canvas của ảnh gốc
     * @param {object} coords - Tọa độ gốc {x, y, w, h}
     * @returns {boolean} - true nếu là áo trắng, false nếu là áo đen
     */
    function determineShirtColor(canvas, coords) {
        try {
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            // Lấy 1 pixel gần tọa độ bắt đầu của vùng crop
            const pixelData = ctx.getImageData(coords.x + 1, coords.y + 1, 1, 1).data;
            const brightness = (pixelData[0] + pixelData[1] + pixelData[2]) / 3;
            return brightness > 150;
        } catch (e) {
            console.warn("Không thể xác định màu áo, mặc định là áo đen.", e.message);
            return false;
        }
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

    /**
     * Sửa đổi: Nhận canvas ảnh gốc để check màu
     */
    async function composeOnMockup(
        designCanvas, originalCanvas, cropCoords, selectedMockup, watermarkValue
    ) {
        const isWhiteShirt = determineShirtColor(originalCanvas, cropCoords);
        const color = isWhiteShirt ? "white" : "black";
        const mockupFileName = `${selectedMockup.id}_${color}.${selectedMockup.extension}`;
        
        // Sửa đổi: Dùng chrome.runtime.getURL cho extension
        const mockupUrl = chrome.runtime.getURL(`assets/mockups/${mockupFileName}`);
        
        const mockupImage = await loadImage(mockupUrl);
        const finalCanvas = document.createElement("canvas");
        const ctx = finalCanvas.getContext("2d", { willReadFrequently: true });
        finalCanvas.width = mockupImage.width;
        finalCanvas.height = mockupImage.height;
        ctx.drawImage(mockupImage, 0, 0);
        
        const designW = designCanvas.width;
        const designH = designCanvas.height;
        const { x: frameX, y: frameY, w: frameW, h: frameH } = selectedMockup.coords;
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
        ctx.drawImage(designCanvas, finalDesignX, finalDesignY, finalDesignW, finalDesignH);

        if (watermarkValue) {
            const isImage = /\.(jpg|jpeg|png|webp)$/i.test(watermarkValue);
            if (isImage) {
                try {
                    // Sửa đổi: Dùng chrome.runtime.getURL
                    const watermarkUrl = chrome.runtime.getURL(`assets/watermarks/${watermarkValue}`);
                    const watermarkImg = await loadImage(watermarkUrl);
                    const padding = 50;
                    const maxWidth = 280;
                    const scale = Math.min(1, maxWidth / watermarkImg.width);
                    const sigWidth = watermarkImg.width * scale;
                    const sigHeight = watermarkImg.height * scale;
                    const sigX = finalCanvas.width - sigWidth - padding;
                    const sigY = finalCanvas.height - sigHeight - padding;
                    ctx.drawImage(watermarkImg, sigX, sigY, sigWidth, sigHeight);
                } catch (error) { console.warn("Không thể tải ảnh watermark:", watermarkValue); }
            } else {
                ctx.font = "bold 60px Verdana";
                ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                ctx.textAlign = "right";
                ctx.textBaseline = "bottom";
                const padding = 20;
                ctx.fillText(watermarkValue, finalCanvas.width - padding, finalCanvas.height - padding);
            }
        }
        return finalCanvas;
    }

    function _convert_to_gps(value, is_longitude) {
        const abs_value = Math.abs(value);
        const ref = is_longitude ? (value >= 0 ? "E" : "W") : (value >= 0 ? "N" : "S");
        const degrees = Math.floor(abs_value);
        const minutes_float = (abs_value - degrees) * 60;
        const minutes = Math.floor(minutes_float);
        const seconds_float = (minutes_float - minutes) * 60;
        return {
            value: [[degrees, 1], [minutes, 1], [Math.round(seconds_float * 100), 100]],
            ref: ref,
        };
    }

    function createExifData(mockupId, final_filename, exif_defaults) {
        // Kiểm tra piexif đã được load chưa
        if (typeof piexif === 'undefined') {
            console.warn("Thư viện piexif.js chưa được tải. Bỏ qua EXIF.");
            return null;
        }
        
        const domain_exif = mockupId + ".com";
        const now = new Date();
        const digitized_time = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const original_time = new Date(digitized_time.getTime() - (Math.floor(Math.random() * (7500 - 3600 + 1)) + 3600) * 1000);
        const toExifDT = (date) => date.toISOString().slice(0, 19).replace("T", " ").replace(/-/g, ":");
        try {
            const zeroth = {};
            zeroth[piexif.ImageIFD.Artist] = domain_exif;
            zeroth[piexif.ImageIFD.Copyright] = domain_exif;
            zeroth[piexif.ImageIFD.ImageDescription] = final_filename;
            zeroth[piexif.ImageIFD.Software] = exif_defaults.Software || "Adobe Photoshop 25.0";
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


    // --- 4. LOGIC TẢI SẢN PHẨM (TỪ v13.html) ---

    function getV13TxtFileUrl(domain) {
        return `https://raw.githubusercontent.com/ktbteam/imagecrawler/main/domain/${domain}.txt`;
    }

    /**
     * Sửa đổi: Thêm addEventListener thay vì dùng onclick=""
     */
    function renderDomainList() {
        const v13Col1 = document.getElementById("v13Col1");
        const v13Col2 = document.getElementById("v13Col2");
        if (!v13Col1 || !v13Col2) return;
        v13Col1.innerHTML = ""; v13Col2.innerHTML = "";

        const v13Domains = Object.keys(allDomainsConfig).filter(k => allDomainsConfig[k].type === 'v13');
        const midIndex = Math.ceil(v13Domains.length / 2);

        v13Domains.forEach((d, i) => {
            const div = document.createElement("div");
            div.className = "domain";
            
            const b = document.createElement("b");
            b.innerText = d.replace('v13_', '');
            
            const button = document.createElement("button");
            button.innerText = "Show sản phẩm";
            // Sửa đổi: Gắn sự kiện trực tiếp
            button.addEventListener('click', () => fetchV13Products(d));
            
            div.appendChild(b);
            div.appendChild(button);

            if (i < midIndex) {
                v13Col1.appendChild(div);
            } else {
                v13Col2.appendChild(div);
            }
        });
        adjustV13Col2Height();
    }

    function adjustV13Col2Height() {
        const v13Col1 = document.getElementById("v13Col1");
        const v13Col2 = document.getElementById("v13Col2");
        if (v13Col1 && v13Col2) {
            v13Col2.style.maxHeight = v13Col1.offsetHeight + "px";
        }
    }

    async function fetchV13Products(domainKey) {
        clearResults();
        window.allProducts = [];
        statusDiv.innerText = `Đang tải danh sách URL ảnh từ file .txt của ${domainKey}...`;

        const txtUrl = getV13TxtFileUrl(domainKey);

        try {
            const txtRes = await fetch(cfProxy + encodeURIComponent(txtUrl));
            if (!txtRes.ok) throw new Error("Không tìm thấy file .txt hoặc lỗi mạng.");
            const allUrls = (await txtRes.text()).split('\n').map(url => url.trim()).filter(url => url && (url.startsWith('http://') || url.startsWith('https://')));
            
            processAndDisplayProducts(allUrls, domainKey);

        } catch (e) {
            statusDiv.innerText = `Lỗi: ${e.message}`;
        }
    }

    function handleLocalFile() {
        const fileInput = document.getElementById('localTxtFile');
        const file = fileInput.files[0];

        if (!file) {
            statusDiv.innerText = "Vui lòng chọn một file .txt trước.";
            return;
        }

        clearResults();
        window.allProducts = [];
        statusDiv.innerText = `Đang đọc file ${file.name}...`;

        const reader = new FileReader();
        reader.onload = (e) => {
            const allUrls = e.target.result.split('\n').map(url => url.trim()).filter(url => url && (url.startsWith('http://') || url.startsWith('https://')));
            processAndDisplayProducts(allUrls, file.name);
        };
        reader.onerror = () => {
            statusDiv.innerText = `Lỗi khi đọc file: ${reader.error}`;
        };
        reader.readAsText(file);
    }

    function processAndDisplayProducts(urlList, sourceName) {
        // Dùng các hàm xử lý title từ v13.html
        window.allProducts = urlList.map(url => ({
            url: "", // url gốc của sp, v13 ko có nên để trống
            img: url,
            title: processV13Title(url)
        }));

        const totalCount = window.allProducts.length;
        statusDiv.innerText = `Tìm thấy ${totalCount} sản phẩm từ ${sourceName}.`;

        renderProductsInBatches(sourceName, 1, totalCount, window.allProducts);
    }

    function renderProductsInBatches(sourceName, currentPage, totalCount, allProducts) {
        const oldLoadMoreBtn = resultsDiv.querySelector(".load-more-btn");
        if (oldLoadMoreBtn) {
            oldLoadMoreBtn.remove();
        }

        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = Math.min(startIndex + productsPerPage, totalCount);

        for (let i = startIndex; i < endIndex; i++) {
            const p = allProducts[i];
            renderSingleProduct(p, i);
        }

        statusDiv.innerText = `Đã hiển thị ${endIndex} trên tổng số ${totalCount} sản phẩm của ${sourceName}.`;
        if (endIndex < totalCount) {
            addLoadMoreButton(sourceName, currentPage + 1, totalCount, allProducts);
        }
    }

    function renderSingleProduct(p, index) {
        const div = document.createElement("div");
        div.className = "product";
        div.innerHTML = `<div><b>#${index + 1}</b></div>
                         ${p.img ? `<img src="${p.img}" loading="lazy" />` : "(no image)"}
                         <div class="title">${p.title}</div>`;
        resultsDiv.appendChild(div);
    }

    function clearResults() {
        resultsDiv.innerHTML = '';
    }

    function addLoadMoreButton(sourceName, currentPage, totalCount, allProducts) {
        const loadMoreBtn = document.createElement("button");
        loadMoreBtn.className = "load-more-btn";
        loadMoreBtn.innerText = `Load More... (Trang ${currentPage})`;
        loadMoreBtn.onclick = () => {
            renderProductsInBatches(sourceName, currentPage, totalCount, allProducts);
        };
        resultsDiv.appendChild(loadMoreBtn);
    }

    // --- 5. LOGIC XỬ LÝ TITLE (TỪ v13.html) ---

    function processTitle(title) {
        const userPrefixToAdd = document.getElementById("prefixToAdd").value.trim();
        const userSuffixToAdd = document.getElementById("suffixToAdd").value.trim();

        let cleanTitle = title;
        let changed = true;

        while (changed) {
            changed = false;
            for (const keyword of title_clean_keywords) {
                const regex = new RegExp(keyword.replace(/-/g, '[- ]?'), 'gi');
                if (regex.test(cleanTitle)) {
                    cleanTitle = cleanTitle.replace(regex, '');
                    changed = true;
                }
            }
        }

        cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();

        // Trả về title sạch, prefix/suffix sẽ được áp dụng lúc xử lý hàng loạt
        return cleanTitle;
    }

    function processV13Title(imgUrl) {
        let title = imgUrl.substring(imgUrl.lastIndexOf('/') + 1);
        title = title.replace(/\.[^/.]+$/, "");
        title = title.replace(/-/g, " ");
        title = processTitle(title);
        return title.trim();
    }

    // --- 6. LOGIC CHỌN VÙNG CẮT (MỚI) ---

    async function loadFirstImageForCropping() {
        if (!window.allProducts || window.allProducts.length === 0) {
            alert("Vui lòng 'Show sản phẩm' từ một domain hoặc file .txt trước!");
            return;
        }

        const firstImgUrl = window.allProducts[0].img;
        cropperContainer.innerHTML = "<p>Đang tải ảnh đầu tiên...</p>";

        try {
            firstImageElement = await loadImage(firstImgUrl);
            firstImageElement.style.maxWidth = '700px';
            firstImageElement.style.display = 'block';

            cropperContainer.innerHTML = ''; // Xóa chữ "Đang tải"
            cropperContainer.appendChild(firstImageElement);

            // Tạo selection box nếu chưa có
            if (!selectionBox) {
                selectionBox = document.createElement('div');
                Object.assign(selectionBox.style, {
                    position: 'absolute',
                    border: '2px dashed #fff',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                    zIndex: '1000',
                    display: 'none',
                    pointerEvents: 'none' // Quan trọng: để event đi qua box
                });
                cropperContainer.appendChild(selectionBox);
            }
            
            // Thêm hướng dẫn
            const status = document.createElement('p');
            status.id = "cropper-status";
            status.innerText = "Click và kéo chuột trên ảnh để chọn vùng design.";
            cropperContainer.appendChild(status);

            // Gắn sự kiện
            cropperContainer.addEventListener('mousedown', onCropMouseDown);

        } catch (err) {
            cropperContainer.innerHTML = `<p style="color: red;">Lỗi tải ảnh: ${err.message}. Vui lòng thử lại.</p>`;
        }
    }

    function onCropMouseDown(e) {
        e.preventDefault();
        isCropping = true;
        
        // Tọa độ click tương đối so với container
        const rect = cropperContainer.getBoundingClientRect();
        // Cần tính cả scroll của popup (nếu có) và vị trí của ảnh
        const imgRect = firstImageElement.getBoundingClientRect();

        cropStartCoords = {
            x: e.clientX - imgRect.left,
            y: e.clientY - imgRect.top
        };

        Object.assign(selectionBox.style, {
            display: 'block',
            left: (cropStartCoords.x + firstImageElement.offsetLeft) + 'px',
            top: (cropStartCoords.y + firstImageElement.offsetTop) + 'px',
            width: '0px',
            height: '0px'
        });

        document.addEventListener('mousemove', onCropMouseMove);
        document.addEventListener('mouseup', onCropMouseUp);
    }

    function onCropMouseMove(e) {
        if (!isCropping) return;
        
        const imgRect = firstImageElement.getBoundingClientRect();
        const currentX = e.clientX - imgRect.left;
        const currentY = e.clientY - imgRect.top;

        const x = Math.min(currentX, cropStartCoords.x);
        const y = Math.min(currentY, cropStartCoords.y);
        const w = Math.abs(currentX - cropStartCoords.x);
        const h = Math.abs(currentY - cropStartCoords.y);

        Object.assign(selectionBox.style, {
            left: (x + firstImageElement.offsetLeft) + 'px',
            top: (y + firstImageElement.offsetTop) + 'px',
            width: w + 'px',
            height: h + 'px'
        });
    }

    function onCropMouseUp(e) {
        if (!isCropping) return;
        isCropping = false;
        document.removeEventListener('mousemove', onCropMouseMove);
        document.removeEventListener('mouseup', onCropMouseUp);

        const rect = selectionBox.style;
        // Tọa độ lưu lại phải tương đối so với ảnh (không phải container)
        cropCoordsOnScreen = {
            x: parseInt(rect.left, 10) - firstImageElement.offsetLeft,
            y: parseInt(rect.top, 10) - firstImageElement.offsetTop,
            w: parseInt(rect.width, 10),
            h: parseInt(rect.height, 10)
        };
        
        // Đảm bảo tọa độ không bị âm (do kéo ngược)
        if (cropCoordsOnScreen.w < 0) { cropCoordsOnScreen.x += cropCoordsOnScreen.w; cropCoordsOnScreen.w = Math.abs(cropCoordsOnScreen.w); }
        if (cropCoordsOnScreen.h < 0) { cropCoordsOnScreen.y += cropCoordsOnScreen.h; cropCoordsOnScreen.h = Math.abs(cropCoordsOnScreen.h); }


        // Tính toán và lưu tọa độ gốc
        const displayWidth = firstImageElement.clientWidth;
        const naturalWidth = firstImageElement.naturalWidth;
        const scaleRatio = naturalWidth / displayWidth;
        
        originalCropCoords = {
            x: Math.round(cropCoordsOnScreen.x * scaleRatio),
            y: Math.round(cropCoordsOnScreen.y * scaleRatio),
            w: Math.round(cropCoordsOnScreen.w * scaleRatio),
            h: Math.round(cropCoordsOnScreen.h * scaleRatio)
        };

        const status = document.getElementById('cropper-status');
        if (status) {
            status.innerText = `Đã chọn! Tọa độ gốc: ${originalCropCoords.w}x${originalCropCoords.h}px. Sẵn sàng cho Bước 3.`;
            status.style.color = "lightgreen";
        }
    }


    // --- 7. LOGIC XỬ LÝ HÀNG LOẠT (MỚI) ---

    async function startBatchProcess() {
        if (!originalCropCoords || originalCropCoords.w === 0 || originalCropCoords.h === 0) {
            alert("Bạn chưa chọn vùng cắt (hoặc vùng cắt không hợp lệ) ở Bước 2!");
            return;
        }
        if (!window.allProducts || window.allProducts.length === 0) {
            alert("Không có sản phẩm nào trong danh sách (hãy 'Show sản phẩm' trước).");
            return;
        }

        // Lấy cài đặt từ UI
        const pattern = document.getElementById('patternFilter').value.trim();
        const skipWhite = document.getElementById('skipWhite').checked;
        const skipBlack = document.getElementById('skipBlack').checked;
        const angle = document.getElementById('rotationAngle').value || 0;
        const selectedMockupId = document.getElementById('mockupSelector').value;
        const selectedMockup = MOCKUP_SETS.find(m => m.id === selectedMockupId);

        // Lấy prefix/suffix từ UI của v13
        const prefix = document.getElementById("prefixToAdd").value.trim();
        const suffix = document.getElementById("suffixToAdd").value.trim();
        
        // Lấy watermark từ default (chưa có UI override)
        const watermark = selectedMockup.defaults.watermark;

        const exif_defaults = {
            Software: "Adobe Photoshop 22.3", Make: "Canon", Model: "Canon EOS R5",
            GPSLatitude: 33.7465515, GPSLongitude: -118.0297799,
            FNumber: [28, 10], ExposureTime: [1, 125],
            ISOSpeedRatings: 100, FocalLength: [50, 1],
        };

        batchStatusDiv.innerHTML = "Bắt đầu xử lý...<br>";
        let processedCount = 0;
        let totalCount = window.allProducts.length;

        // Hàm log helper
        const log = (msg) => {
            batchStatusDiv.innerHTML = `${msg}<br>` + batchStatusDiv.innerHTML;
            batchStatusDiv.scrollTop = 0; // Luôn hiển thị log mới nhất
        };

        for (let i = 0; i < totalCount; i++) {
            const product = window.allProducts[i];
            const currentCount = i + 1;
            const logPrefix = `[${currentCount}/${totalCount}]`;

            try {
                // 1. Lọc theo pattern
                if (pattern && !product.img.includes(pattern)) {
                    log(`${logPrefix} SKIP (Pattern): ${product.img}`);
                    continue;
                }
                
                log(`${logPrefix} PROCESSING: ${product.img}`);

                // 2. Tải ảnh gốc vào canvas
                const originalImage = await loadImage(product.img);
                const originalCanvas = document.createElement('canvas');
                originalCanvas.width = originalImage.width;
                originalCanvas.height = originalImage.height;
                originalCanvas.getContext('2d').drawImage(originalImage, 0, 0);

                // 3. Lọc áo trắng/đen
                const isWhiteShirt = determineShirtColor(originalCanvas, originalCropCoords);
                if (skipWhite && isWhiteShirt) {
                    log(`${logPrefix} SKIP (Áo trắng): ${product.img}`);
                    continue;
                }
                if (skipBlack && !isWhiteShirt) {
                    log(`${logPrefix} SKIP (Áo đen): ${product.img}`);
                    continue;
                }

                // 4. Cắt (Crop) ảnh gốc
                const croppedCanvas = document.createElement('canvas');
                croppedCanvas.width = originalCropCoords.w;
                croppedCanvas.height = originalCropCoords.h;
                croppedCanvas.getContext('2d').drawImage(
                    originalCanvas, // Dùng canvas
                    originalCropCoords.x, originalCropCoords.y,
                    originalCropCoords.w, originalCropCoords.h,
                    0, 0, originalCropCoords.w, originalCropCoords.h
                );

                // 5. Chạy luồng xử lý ảnh
                const canvasAfterBgRemoval = await removeBackground(croppedCanvas);
                const canvasAfterHardening = hardenAlphaChannel(canvasAfterBgRemoval);
                const transparentDesignCanvas = getTrimmedCanvas(canvasAfterHardening);
                const rotatedDesignCanvas = rotateCanvas(transparentDesignCanvas, angle);

                // 6. Ghép Mockup
                const finalCanvas = await composeOnMockup(
                    rotatedDesignCanvas,
                    originalCanvas,
                    originalCropCoords,
                    selectedMockup,
                    watermark
                );

                // 7. Tạo tên file và EXIF
                // Dùng title đã được xử lý bởi v13 và áp dụng prefix/suffix từ UI
                const finalFilename = [prefix, product.title, suffix].filter(Boolean).join(" ").trim();
                let dataUrl = finalCanvas.toDataURL("image/jpeg", 0.95);
                
                const exifBytes = createExifData(selectedMockup.id, finalFilename, exif_defaults);
                if (exifBytes) {
                    dataUrl = piexif.insert(exifBytes, dataUrl);
                }

                // 8. Gửi lệnh download
                chrome.runtime.sendMessage({
                    action: "downloadImage",
                    dataUrl: dataUrl,
                    filename: finalFilename + ".jpg",
                });
                
                processedCount++;
                log(`${logPrefix} <span style="color: lightgreen;">SUCCESS</span>: ${finalFilename}.jpg`);
                
                // Tạm dừng 1 chút để không làm sập trình duyệt
                await new Promise(resolve => setTimeout(resolve, 300)); 

            } catch (err) {
                log(`${logPrefix} <span style="color: red;">ERROR</span>: ${product.img} - ${err.message}`);
            }
        }
        log(`--- HOÀN THÀNH --- Đã xử lý và tải về ${processedCount} / ${totalCount} ảnh.`);
    }


    // --- 8. KHỞI TẠO ỨNG DỤNG (ENTRY POINT) ---

    function initializeApp() {
        // Cache các element DOM chính
        cropperContainer = document.getElementById('cropper-container');
        statusDiv = document.getElementById('status');
        resultsDiv = document.getElementById('results');
        batchStatusDiv = document.getElementById('batchStatus');

        // 1. Populate Mockup Selector
        const mockupSelect = document.getElementById('mockupSelector');
        if (mockupSelect) {
            MOCKUP_SETS.forEach(m => {
                mockupSelect.innerHTML += `<option value="${m.id}">${m.name}</option>`;
            });
        }

        // 2. Render danh sách domain (từ v13)
        renderDomainList();

        // 3. Gắn sự kiện cho các nút
        document.getElementById('loadFirstImageButton')?.addEventListener('click', loadFirstImageForCropping);
        document.getElementById('startBatchProcess')?.addEventListener('click', startBatchProcess);
        
        // Gắn sự kiện cho nút "Show sản phẩm từ file" (từ v13)
        const localFileInput = document.getElementById('localTxtFile');
        if (localFileInput && localFileInput.nextElementSibling) {
            localFileInput.nextElementSibling.addEventListener('click', handleLocalFile);
        }
        
        // Gắn sự kiện resize (từ v13)
        window.addEventListener("resize", adjustV13Col2Height);
    }

    // --- CHẠY HÀM KHỞI TẠO ---
    initializeApp();

});