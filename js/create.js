// Create Giveaway JavaScript
(function() {
    console.log('🎁 CREATE GIVEAWAY - Script started...');

    // ==================== FUNGSI HAPTIC FEEDBACK TELEGRAM ====================
    function hapticImpact(style = 'medium') {
        if (window.Telegram?.WebApp?.HapticFeedback) {
            try {
                window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
            } catch (e) {}
        }
    }
    
    function hapticNotification(type = 'success') {
        if (window.Telegram?.WebApp?.HapticFeedback) {
            try {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred(type);
            } catch (e) {}
        }
    }
    
    function hapticSelection() {
        if (window.Telegram?.WebApp?.HapticFeedback) {
            try {
                window.Telegram.WebApp.HapticFeedback.selectionChanged();
            } catch (e) {}
        }
    }

    // ==================== KONFIGURASI ====================
    const API_BASE_URL = 'https://individually-threaded-jokes-letting.trycloudflare.com';
    
    // ==================== DOM ELEMENTS ====================
    const elements = {
        loading: document.getElementById('loading'),
        error: document.getElementById('error'),
        formContent: document.getElementById('formContent'),
        
        // Form inputs
        prizeInput: document.getElementById('prizeInput'),
        prizesTags: document.getElementById('prizesTags'),
        giveawayText: document.getElementById('giveawayText'),
        requirementCheckboxes: document.querySelectorAll('input[name="requirements"]'),
        
        // Duration elements
        durationTabs: document.querySelectorAll('.duration-tab'),
        durationMode: document.getElementById('durationMode'),
        dateMode: document.getElementById('dateMode'),
        durationValue: document.getElementById('durationValue'),
        durationUnit: document.getElementById('durationUnit'),
        endDate: document.getElementById('endDate'),
        
        // Media uploader
        mediaInput: document.getElementById('mediaInput'),
        mediaUploader: document.getElementById('mediaUploader'),
        mediaPreview: document.getElementById('mediaPreview'),
        previewImage: document.getElementById('previewImage'),
        previewVideo: document.getElementById('previewVideo'),
        mediaRemove: document.getElementById('mediaRemove'),
        
        // Toggle
        captchaToggle: document.getElementById('captchaToggle'),
        captchaLabel: document.getElementById('captchaLabel'),
        
        // Buttons
        cancelBtn: document.getElementById('cancelBtn'),
        submitBtn: document.getElementById('submitBtn'),
        form: document.getElementById('giveawayForm'),
        
        // New elements untuk Syarat Giveaway
        selectRequirementsBtn: document.getElementById('selectRequirementsBtn'),
        selectPanel: document.getElementById('selectPanel'),
        closePanelBtn: document.getElementById('closePanelBtn'),
        selectedTags: document.getElementById('selectedTags'),
        
        // Link Manager elements - SESUAIKAN DENGAN HTML TERBARU
        linkManagerBtn: document.getElementById('linkManagerBtn'),
        linkExpandBtn: document.getElementById('linkExpandBtn'),
        linkPreviewArea: document.getElementById('linkPreviewArea'),
        linkTags: document.getElementById('linkTags'),
        linkEmptyState: document.getElementById('linkEmptyState'),
        linkCount: document.getElementById('linkCount'),
        linkTagsContainer: document.getElementById('linkTagsContainer'),
        
        // Add Link button (lama, akan disembunyikan)
        addLinkBtn: document.getElementById('addLinkBtn'),
        savedLinksContainer: document.getElementById('savedLinksContainer')
    };

    // ==================== STATE ====================
    let prizes = ['Gaming Bundle']; // Default prize
    let selectedFile = null;
    let telegramUser = null;
    let selectedRequirements = ['subscribe'];
    let savedLinks = [];
    let isLinkExpanded = false;

    // ==================== FUNGSI LINK MANAGER ====================
    function loadSavedLinks() {
        console.log('📥 Loading saved links...');
        const saved = localStorage.getItem('giftfreebies_links');
        if (saved) {
            try {
                savedLinks = JSON.parse(saved);
                console.log('✅ Loaded links:', savedLinks);
                updateLinkDisplay(); // Langsung update display
            } catch (e) {
                console.error('❌ Error parsing saved links:', e);
                savedLinks = [];
            }
        } else {
            console.log('ℹ️ No saved links found');
            savedLinks = [];
        }
    }

    function saveLinksToStorage() {
        console.log('💾 Saving links to storage:', savedLinks);
        localStorage.setItem('giftfreebies_links', JSON.stringify(savedLinks));
    }

    // Fungsi displaySavedLinks yang lama - kita biarkan tapi tidak digunakan
    function displaySavedLinks() {
        // Tidak digunakan lagi, tapi biarkan untuk kompatibilitas
        updateLinkDisplay();
    }

    function setupLinkManager() {
        console.log('🔧 Setting up Link Manager...');
        
        if (elements.linkManagerBtn) {
            elements.linkManagerBtn.addEventListener('click', () => {
                hapticImpact('medium');
                window.location.href = 'link-manager.html';
            });
        }
        
        if (elements.linkExpandBtn) {
            elements.linkExpandBtn.addEventListener('click', () => {
                hapticImpact('light');
                toggleLinkExpand();
            });
        }
        
        // Update tampilan link
        updateLinkDisplay();
    }
    
    function toggleLinkExpand() {
        isLinkExpanded = !isLinkExpanded;
        
        if (isLinkExpanded) {
            elements.linkTagsContainer.style.display = 'block';
            elements.linkPreviewArea.style.display = 'none';
            elements.linkExpandBtn.classList.add('expanded');
            elements.linkExpandBtn.textContent = '▲';
        } else {
            elements.linkTagsContainer.style.display = 'none';
            elements.linkPreviewArea.style.display = 'flex';
            elements.linkExpandBtn.classList.remove('expanded');
            elements.linkExpandBtn.textContent = '▼';
        }
    }
    
    function updateLinkDisplay() {
        if (!elements.linkPreviewArea || !elements.linkTags) return;
        
        // Update counter
        updateLinkCount();
        
        // Tampilkan atau sembunyikan tombol expand berdasarkan jumlah link
        if (savedLinks.length > 1) {
            elements.linkExpandBtn.style.display = 'flex';
        } else {
            elements.linkExpandBtn.style.display = 'none';
            // Jika expand sedang aktif, matikan
            if (isLinkExpanded) {
                isLinkExpanded = false;
                elements.linkTagsContainer.style.display = 'none';
                elements.linkPreviewArea.style.display = 'flex';
                elements.linkExpandBtn.classList.remove('expanded');
                elements.linkExpandBtn.textContent = '▼';
            }
        }
        
        if (savedLinks.length === 0) {
            // Empty state
            elements.linkPreviewArea.style.display = 'none';
            elements.linkTagsContainer.style.display = 'none';
            elements.linkEmptyState.style.display = 'flex';
            elements.linkTags.innerHTML = '';
            return;
        }
        
        elements.linkEmptyState.style.display = 'none';
        
        // Update preview (link pertama)
        const firstLink = savedLinks[0];
        elements.linkPreviewArea.innerHTML = `
            <div class="link-preview-item" data-id="${firstLink.id}">
                <span class="link-preview-icon">🔗</span>
                <div class="link-preview-content">
                    <div class="link-preview-title">${escapeHtml(firstLink.title || 'Untitled')}</div>
                    <div class="link-preview-url">${escapeHtml(firstLink.url || '#')}</div>
                </div>
                <span class="link-preview-remove" data-id="${firstLink.id}">×</span>
            </div>
        `;
        elements.linkPreviewArea.style.display = 'flex';
        
        // Add remove listener untuk preview
        const previewRemove = elements.linkPreviewArea.querySelector('.link-preview-remove');
        if (previewRemove) {
            previewRemove.addEventListener('click', (e) => {
                e.stopPropagation();
                hapticImpact('light');
                const id = previewRemove.dataset.id;
                removeLinkById(id);
            });
        }
        
        // Update semua link di container expand
        let html = '';
        savedLinks.forEach((link, index) => {
            html += `
                <div class="link-tag-item" data-id="${link.id}">
                    <span class="link-tag-icon">🔗</span>
                    <div class="link-tag-content">
                        <div class="link-tag-title">${escapeHtml(link.title || 'Untitled')}</div>
                        <div class="link-tag-url">${escapeHtml(link.url || '#')}</div>
                    </div>
                    <span class="link-tag-remove" data-id="${link.id}" data-index="${index}">×</span>
                </div>
            `;
        });
        
        elements.linkTags.innerHTML = html;
        
        // Add remove event listeners untuk semua tag
        document.querySelectorAll('.link-tag-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                hapticImpact('light');
                const id = btn.dataset.id;
                removeLinkById(id);
            });
        });
    }
    
    function removeLinkById(id) {
        savedLinks = savedLinks.filter(link => link.id !== id);
        saveLinksToStorage();
        updateLinkDisplay();
        hapticNotification('success');
    }
    
    function updateLinkCount() {
        if (elements.linkCount) {
            elements.linkCount.textContent = savedLinks.length;
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==================== INITIALIZATION ====================
    function init() {
        console.log('🚀 Initializing create giveaway form...');
        
        // Check Telegram
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.expand();
            tg.ready();
            
            telegramUser = tg.initDataUnsafe?.user;
            console.log('👤 Telegram User:', telegramUser);
            console.log('📱 HapticFeedback available:', !!tg.HapticFeedback);
        }
        
        // Load saved links
        loadSavedLinks();
        
        // Setup Link Manager UI
        setupLinkManager();
        
        // Setup event listeners
        setupEventListeners();
        
        // Set default date (2 days from now)
        setDefaultDate();
        
        // Update selected tags untuk syarat (default Subscribe)
        updateSelectedTags();
        
        // Inisialisasi status selected option button
        initSelectedOptions();
        
        // Listen for messages from link manager
        window.addEventListener('message', (event) => {
            console.log('📨 Received message:', event.data);
            if (event.data && event.data.type === 'linksUpdated') {
                savedLinks = event.data.links || [];
                console.log('🔗 Links updated:', savedLinks);
                saveLinksToStorage();
                updateLinkDisplay(); // Langsung update display
                hapticNotification('success');
            }
        });
        
        // Show form
        setTimeout(() => {
            if (elements.loading) elements.loading.style.display = 'none';
            if (elements.formContent) elements.formContent.style.display = 'block';
        }, 500);
    }

    // ==================== SETUP EVENT LISTENERS ====================
    function setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Prize input - handle comma separated values
        if (elements.prizeInput) {
            elements.prizeInput.addEventListener('keydown', handlePrizeInput);
            elements.prizeInput.addEventListener('blur', handlePrizeBlur);
        }
        
        // Prize tags remove (delegation)
        if (elements.prizesTags) {
            elements.prizesTags.addEventListener('click', (e) => {
                if (e.target.classList.contains('tag-remove')) {
                    hapticImpact('light');
                    const prize = e.target.dataset.prize;
                    removePrize(prize);
                }
            });
        }

        // Add Link button (lama) - sembunyikan, tapi kita nonaktifkan
        if (elements.addLinkBtn) {
            // elements.addLinkBtn.style.display = 'none'; // CSS sudah handle
        }
    
        // Duration tabs
        if (elements.durationTabs) {
            elements.durationTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    hapticImpact('light');
                    switchDurationTab(tab.dataset.type);
                });
            });
        }
        
        // Media uploader
        if (elements.mediaInput) {
            elements.mediaInput.addEventListener('change', handleMediaSelect);
            elements.mediaUploader.addEventListener('dragover', handleDragOver);
            elements.mediaUploader.addEventListener('dragleave', handleDragLeave);
            elements.mediaUploader.addEventListener('drop', handleDrop);
        }
        
        // Media remove
        if (elements.mediaRemove) {
            elements.mediaRemove.addEventListener('click', () => {
                hapticImpact('medium');
                removeMedia();
            });
        }
        
        // Toggle captcha
        if (elements.captchaToggle) {
            elements.captchaToggle.addEventListener('change', (e) => {
                hapticImpact('soft');
                if (elements.captchaLabel) {
                    elements.captchaLabel.textContent = e.target.checked ? 'Aktif' : 'Nonaktif';
                }
            });
        }
        
        // Form submit
        if (elements.form) {
            elements.form.addEventListener('submit', handleSubmit);
        }
        
        // Cancel button
        if (elements.cancelBtn) {
            elements.cancelBtn.addEventListener('click', () => {
                hapticImpact('medium');
                if (confirm('Batalkan pembuatan giveaway?')) {
                    window.location.href = 'index.html';
                }
            });
        }
        
        // ==================== SYARAT GIVEAWAY EVENT LISTENERS ====================
        
        // Select button untuk membuka/tutup panel
        if (elements.selectRequirementsBtn) {
            elements.selectRequirementsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                hapticImpact('light');
                if (elements.selectPanel) {
                    if (elements.selectPanel.style.display === 'none' || !elements.selectPanel.style.display) {
                        elements.selectPanel.style.display = 'block';
                    } else {
                        elements.selectPanel.style.display = 'none';
                    }
                }
            });
        }
        
        // Close panel button
        if (elements.closePanelBtn) {
            elements.closePanelBtn.addEventListener('click', () => {
                hapticImpact('light');
                if (elements.selectPanel) {
                    elements.selectPanel.style.display = 'none';
                }
            });
        }
        
        // Option buttons di panel
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                hapticSelection();
                const value = btn.dataset.value;
                const icon = btn.dataset.icon;
                const text = btn.textContent.trim();
                
                // Toggle selection
                toggleRequirement(value, icon, text);
                
                // Toggle class selected pada button
                btn.classList.toggle('selected');
            });
        });
        
        // Close panel saat klik di luar
        document.addEventListener('click', (e) => {
            if (elements.selectPanel && elements.selectRequirementsBtn) {
                if (!elements.selectPanel.contains(e.target) && 
                    !elements.selectRequirementsBtn.contains(e.target)) {
                    elements.selectPanel.style.display = 'none';
                }
            }
        });
        
        // Remove tag dari selected requirements
        if (elements.selectedTags) {
            elements.selectedTags.addEventListener('click', (e) => {
                if (e.target.classList.contains('tag-remove')) {
                    hapticImpact('light');
                    const reqValue = e.target.dataset.req;
                    removeRequirement(reqValue);
                    
                    // Update class selected pada option button
                    document.querySelectorAll('.option-btn').forEach(btn => {
                        if (btn.dataset.value === reqValue) {
                            btn.classList.remove('selected');
                        }
                    });
                }
            });
        }
    }

    // ==================== PRIZE HANDLERS ====================
    function handlePrizeInput(e) {
        if (e.key === ',' || e.key === 'Enter') {
            e.preventDefault();
            hapticImpact('soft');
            addPrizeFromInput();
        }
    }

    function handlePrizeBlur() {
        addPrizeFromInput();
    }

    function addPrizeFromInput() {
        const value = elements.prizeInput.value.trim();
        if (value) {
            hapticImpact('light');
            const newPrizes = value.split(',').map(p => p.trim()).filter(p => p);
            newPrizes.forEach(prize => {
                if (prize && !prizes.includes(prize)) {
                    prizes.push(prize);
                }
            });
            updatePrizesTags();
            elements.prizeInput.value = '';
        }
    }

    function removePrize(prize) {
        prizes = prizes.filter(p => p !== prize);
        updatePrizesTags();
    }

    function updatePrizesTags() {
        if (!elements.prizesTags) return;

        let html = '';
        prizes.forEach(prize => {
            html += `<span class="prize-tag">${prize} <span class="tag-remove" data-prize="${prize}">×</span></span>`;
        });
        elements.prizesTags.innerHTML = html;

        setTimeout(() => {
            const scrollContainer = document.querySelector('.prize-tags-scroll');
            if (scrollContainer) {
                scrollContainer.scrollLeft = scrollContainer.scrollWidth;
            }
        }, 50);
    }

    // ==================== REQUIREMENTS HANDLERS ====================
    function toggleRequirement(value, icon, text) {
        if (selectedRequirements.includes(value)) {
            selectedRequirements = selectedRequirements.filter(req => req !== value);
            const checkbox = document.querySelector(`input[name="requirements"][value="${value}"]`);
            if (checkbox) checkbox.checked = false;
        } else {
            selectedRequirements.push(value);
            const checkbox = document.querySelector(`input[name="requirements"][value="${value}"]`);
            if (checkbox) checkbox.checked = true;
        }
        updateSelectedTags();
    }

    function removeRequirement(value) {
        selectedRequirements = selectedRequirements.filter(req => req !== value);
        updateSelectedTags();
        const checkbox = document.querySelector(`input[name="requirements"][value="${value}"]`);
        if (checkbox) checkbox.checked = false;
    }

    function updateSelectedTags() {
        if (!elements.selectedTags) return;
        
        let html = '';
        selectedRequirements.forEach(req => {
            let icon = '';
            let text = '';
            
            switch(req) {
                case 'subscribe': icon = '🔔'; text = 'Subscribe'; break;
                case 'premium': icon = '⭐'; text = 'Premium'; break;
                case 'nonpremium': icon = '👤'; text = 'Non-Premium'; break;
                case 'aktif': icon = '✅'; text = 'Aktif'; break;
                case 'share': icon = '📤'; text = 'Share'; break;
                default: icon = '🔘'; text = req;
            }
            
            html += `<span class="selected-tag">${icon} ${text} <span class="tag-remove" data-req="${req}">×</span></span>`;
        });
        
        elements.selectedTags.innerHTML = html;
        
        setTimeout(() => {
            if (elements.selectedTags) {
                elements.selectedTags.scrollLeft = elements.selectedTags.scrollWidth;
            }
        }, 50);
    }

    function initSelectedOptions() {
        document.querySelectorAll('.option-btn').forEach(btn => {
            const value = btn.dataset.value;
            if (selectedRequirements.includes(value)) {
                btn.classList.add('selected');
            }
        });
    }

    // ==================== DURATION HANDLERS ====================
    function switchDurationTab(type) {
        elements.durationTabs.forEach(tab => {
            if (tab.dataset.type === type) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        if (type === 'duration') {
            elements.durationMode.classList.add('active');
            elements.dateMode.classList.remove('active');
        } else {
            elements.durationMode.classList.remove('active');
            elements.dateMode.classList.add('active');
        }
    }

    function setDefaultDate() {
        if (elements.endDate) {
            const date = new Date();
            date.setDate(date.getDate() + 2);
            date.setHours(15, 0, 0, 0);
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            elements.endDate.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        }
    }

    // ==================== MEDIA HANDLERS ====================
    function handleMediaSelect(e) {
        const file = e.target.files[0];
        if (file) {
            hapticImpact('medium');
            processMediaFile(file);
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        elements.mediaUploader.classList.add('dragover');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        elements.mediaUploader.classList.remove('dragover');
    }

    function handleDrop(e) {
        e.preventDefault();
        elements.mediaUploader.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        if (file) {
            hapticImpact('medium');
            processMediaFile(file);
            elements.mediaInput.files = e.dataTransfer.files;
        }
    }

    function processMediaFile(file) {
        if (file.size > 20 * 1024 * 1024) {
            hapticNotification('error');
            alert('File terlalu besar! Maksimal 20MB');
            return;
        }

        selectedFile = file;
        
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                elements.previewImage.src = e.target.result;
                elements.previewImage.style.display = 'block';
                elements.previewVideo.style.display = 'none';
                elements.mediaPreview.style.display = 'block';
                elements.mediaUploader.querySelector('.media-placeholder').style.display = 'none';
            };
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            const url = URL.createObjectURL(file);
            elements.previewVideo.src = url;
            elements.previewVideo.style.display = 'block';
            elements.previewImage.style.display = 'none';
            elements.mediaPreview.style.display = 'block';
            elements.mediaUploader.querySelector('.media-placeholder').style.display = 'none';
        }
    }

    function removeMedia() {
        selectedFile = null;
        elements.mediaInput.value = '';
        elements.mediaPreview.style.display = 'none';
        elements.previewImage.src = '';
        elements.previewVideo.src = '';
        elements.mediaUploader.querySelector('.media-placeholder').style.display = 'flex';
    }

    // ==================== FORM SUBMIT ====================
    async function handleSubmit(e) {
        e.preventDefault();
        
        if (prizes.length === 0) {
            hapticNotification('error');
            alert('Minimal 1 hadiah harus diisi!');
            return;
        }
        
        hapticImpact('heavy');
        
        setButtonLoading(true);
        
        const requirements = selectedRequirements;
        
        const formData = {
            creator_user_id: telegramUser?.id || 123456789,
            fullname: telegramUser ? [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ') : 'Test User',
            username: telegramUser?.username || 'testuser',
            prizes: prizes,
            giveaway_text: elements.giveawayText.value || 'Ikuti giveaway ini dan menangkan hadiah menarik! 🎁',
            requirements: requirements,
            links: savedLinks,
            duration_type: elements.durationMode.classList.contains('active') ? 'duration' : 'date',
            captcha_enabled: elements.captchaToggle.checked ? 1 : 0
        };
        
        if (formData.duration_type === 'duration') {
            formData.duration_value = parseInt(elements.durationValue.value) || 2;
            formData.duration_unit = elements.durationUnit.value;
        } else {
            formData.end_date = elements.endDate.value;
        }
        
        console.log('📤 Submitting giveaway:', formData);
        
        try {
            // Di sini nanti panggil API beneran
            await new Promise(resolve => setTimeout(resolve, 1500));
            const giveawayId = generateGiveawayId();
            setButtonLoading(false);
            showSuccess(giveawayId);
        } catch (error) {
            console.error('❌ Error:', error);
            hapticNotification('error');
            setButtonLoading(false);
            alert('Gagal membuat giveaway. Silakan coba lagi.');
        }
    }

    function generateGiveawayId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 25; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    function setButtonLoading(loading) {
        if (!elements.submitBtn) return;
        
        if (loading) {
            elements.submitBtn.classList.add('loading');
            elements.submitBtn.querySelector('.btn-text').textContent = 'Membuat...';
            elements.submitBtn.querySelector('.btn-loader').style.display = 'inline-block';
            elements.submitBtn.disabled = true;
        } else {
            elements.submitBtn.classList.remove('loading');
            elements.submitBtn.querySelector('.btn-text').textContent = 'Buat Giveaway';
            elements.submitBtn.querySelector('.btn-loader').style.display = 'none';
            elements.submitBtn.disabled = false;
        }
    }

    function showSuccess(giveawayId) {
        elements.submitBtn.classList.add('success');
        elements.submitBtn.querySelector('.btn-text').textContent = 'Berhasil!';
        
        hapticNotification('success');
        
        setTimeout(() => {
            alert(`✅ Giveaway berhasil dibuat!\n\nGiveaway ID: ${giveawayId}\n\nLink: ${API_BASE_URL}/giveaway/${giveawayId}`);
            window.location.href = 'index.html';
        }, 500);
    }

    // ==================== START ====================
    init();
})();
