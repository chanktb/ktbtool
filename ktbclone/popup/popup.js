// popup.js (Phiên bản lưu cài đặt theo website)
const MOCKUP_SETS = [
    { 
        name: 'Printiment', 
        id: 'printiment', 
        extension: 'jpg', 
        coords: { x: 423, y: 305, w: 404, h: 527 },
        defaults: {
            prefix: 'Official',
            suffix: 'Tee Sweater Hoodie',
            watermark: 'printiment.png'
        }
    },
    { 
        name: 'KTBTee', 
        id: 'ktbtee', 
        extension: 'webp', 
        coords: { x: 362, y: 254, w: 424, h: 582 },
        defaults: {
            prefix: 'Original',
            suffix: 'Shirt',
            watermark: 'ktbtee.png'
        }
    },
    { 
        name: 'Whatwillwear', 
        id: 'whatwillwear', 
        extension: 'jpg', 
        coords: { x: 370, y: 356, w: 415, h: 610 },
        defaults: {
            prefix: 'Premium',
            suffix: 'Sweatshirt Tee',
            watermark: 'whatwillwear.png'
        }
    },
    { 
        name: 'Amertee', 
        id: 'amertee', 
        extension: 'jpg', 
        coords: { x: 373, y: 240, w: 447, h: 601 },
        defaults: {
            prefix: 'Original',
            suffix: 'Shirt Hoodie',
            watermark: 'amertee.png'
        }
    },
    { 
        name: 'Albumcoverprint', 
        id: 'albumcoverprint', 
        extension: 'jpg', 
        coords: { x: 358, y: 240, w: 469, h: 583 },
        defaults: {
            prefix: 'Trendy',
            suffix: 'Sweater Tee',
            watermark: 'albumcoverprint.png'
        }
    }
];

document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('mockup-list');
    const statusDiv = document.getElementById('status');
    const prefixInput = document.getElementById('prefix');
    const suffixInput = document.getElementById('suffix');
    const watermarkInput = document.getElementById('watermark');
    const rotationInput = document.getElementById('rotation');
    const filenameSourceRadios = document.querySelectorAll('input[name="filename-source"]');

    let currentTabHost = '';
    let selectedMockupId = MOCKUP_SETS[0].id;

    function updateInputFields(mockupId, overrides) {
        const mockup = MOCKUP_SETS.find(m => m.id === mockupId);
        if (!mockup) return;
        const mockupOverrides = overrides[mockupId] || {};
        prefixInput.value = mockupOverrides.prefix !== undefined ? mockupOverrides.prefix : mockup.defaults.prefix;
        suffixInput.value = mockupOverrides.suffix !== undefined ? mockupOverrides.suffix : mockup.defaults.suffix;
        watermarkInput.value = mockupOverrides.watermark !== undefined ? mockupOverrides.watermark : mockup.defaults.watermark;
    }

    async function saveSettings() {
        const currentOverrides = (await chrome.storage.sync.get('settingOverrides')).settingOverrides || {};
        currentOverrides[selectedMockupId] = {
            prefix: prefixInput.value.trim(),
            suffix: suffixInput.value.trim(),
            watermark: watermarkInput.value.trim()
        };

        const selectedSource = document.querySelector('input[name="filename-source"]:checked').value;
        const filenameSources = (await chrome.storage.sync.get('filenameSources')).filenameSources || {};
        if (currentTabHost) {
            filenameSources[currentTabHost] = selectedSource;
        }

        chrome.storage.sync.set({
            settingOverrides: currentOverrides,
            filenameSources: filenameSources,
            rotationAngle: parseInt(rotationInput.value, 10) || 0
        }, () => {
            statusDiv.textContent = 'Đã lưu!';
            setTimeout(() => { statusDiv.textContent = ''; }, 1500);
        });
    }

    prefixInput.addEventListener('change', saveSettings);
    suffixInput.addEventListener('change', saveSettings);
    watermarkInput.addEventListener('change', saveSettings);
    rotationInput.addEventListener('change', saveSettings);
    filenameSourceRadios.forEach(radio => radio.addEventListener('change', saveSettings));
    
    async function loadAllSettings() {
        const result = await chrome.storage.sync.get(['selectedMockupId', 'settingOverrides', 'filenameSources', 'rotationAngle']);
        
        selectedMockupId = result.selectedMockupId || MOCKUP_SETS[0].id;
        const overrides = result.settingOverrides || {};
        const sources = result.filenameSources || {};
        
        updateInputFields(selectedMockupId, overrides);
        rotationInput.value = result.rotationAngle || 0;

        const currentSource = (currentTabHost && sources[currentTabHost]) ? sources[currentTabHost] : 'image_src';
        document.querySelector(`input[name="filename-source"][value="${currentSource}"]`).checked = true;

        listContainer.innerHTML = '';
        MOCKUP_SETS.forEach(mockup => {
            const item = document.createElement('div');
            item.className = 'mockup-item';
            if (mockup.id === selectedMockupId) item.classList.add('selected');
            
            const previewUrl = chrome.runtime.getURL(`assets/mockups/${mockup.id}_white.${mockup.extension}`);
            item.innerHTML = `<img src="${previewUrl}" alt="${mockup.name}"><span>${mockup.name}</span>`;
            
            item.addEventListener('click', async () => {
                selectedMockupId = mockup.id;
                await chrome.storage.sync.set({ selectedMockupId: selectedMockupId });
                document.querySelectorAll('.mockup-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                const updatedOverrides = (await chrome.storage.sync.get('settingOverrides')).settingOverrides || {};
                updateInputFields(selectedMockupId, updatedOverrides);
            });
            listContainer.appendChild(item);
        });
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url && tabs[0].url.startsWith('http')) {
            currentTabHost = new URL(tabs[0].url).hostname;
        } else {
            document.querySelectorAll('input[name="filename-source"]').forEach(el => el.disabled = true);
        }
        loadAllSettings();
    });
});