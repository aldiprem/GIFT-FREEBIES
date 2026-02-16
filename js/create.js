// Create Giveaway JavaScript
(function() {
    console.log('🎁 CREATE GIVEAWAY - Script started...');

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
        form: document.getElementById('giveawayForm')
    };

    // ==================== STATE ====================
    let prizes = ['Gaming Bundle']; // Default prize
    let selectedFile = null;
    let telegramUser = null;

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
        }
        
        // Setup event listeners
        setupEventListeners();
        
        // Set default date (2 days from now)
        setDefaultDate();
        
        // Show form
        setTimeout(() => {
            if (elements.loading) elements.loading.style.display = 'none';
            if (elements.formContent) elements.formContent.style.display = 'block';
        }, 500);
    }

    // ==================== SETUP EVENT LISTENERS ====================
    function setupEventListeners() {
        // Prize input - handle comma separated values
        if (elements.prizeInput) {
            elements.prizeInput.addEventListener('keydown', handlePrizeInput);
            elements.prizeInput.addEventListener('blur', handlePrizeBlur);
        }
        
        // Prize tags remove (delegation)
        if (elements.prizesTags) {
            elements.prizesTags.addEventListener('click', (e) => {
                if (e.target.classList.contains('tag-remove')) {
                    const prize = e.target.dataset.prize;
                    removePrize(prize);
                }
            });
        }
        
        // Duration tabs
        elements.durationTabs.forEach(tab => {
            tab.addEventListener('click', () => switchDurationTab(tab.dataset.type));
        });
        
        // Media uploader
        if (elements.mediaInput) {
            elements.mediaInput.addEventListener('change', handleMediaSelect);
            elements.mediaUploader.addEventListener('dragover', handleDragOver);
            elements.mediaUploader.addEventListener('dragleave', handleDragLeave);
            elements.mediaUploader.addEventListener('drop', handleDrop);
        }
        
        // Media remove
        if (elements.mediaRemove) {
            elements.mediaRemove.addEventListener('click', removeMedia);
        }
        
        // Toggle captcha
        if (elements.captchaToggle) {
            elements.captchaToggle.addEventListener('change', (e) => {
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
                if (confirm('Batalkan pembuatan giveaway?')) {
                    window.location.href = 'index.html';
                }
            });
        }
    }

    // ==================== PRIZE HANDLERS ====================
    function handlePrizeInput(e) {
        if (e.key === ',' || e.key === 'Enter') {
            e.preventDefault();
            addPrizeFromInput();
        }
    }

    function handlePrizeBlur() {
        addPrizeFromInput();
    }

    function addPrizeFromInput() {
        const value = elements.prizeInput.value.trim();
        if (value) {
            // Split by comma and process each prize
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
    }

    // ==================== DURATION HANDLERS ====================
    function switchDurationTab(type) {
        // Update tabs
        elements.durationTabs.forEach(tab => {
            if (tab.dataset.type === type) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Show/hide modes
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
            processMediaFile(file);
            // Update input files
            elements.mediaInput.files = e.dataTransfer.files;
        }
    }

    function processMediaFile(file) {
        // Check file size (max 20MB)
        if (file.size > 20 * 1024 * 1024) {
            alert('File terlalu besar! Maksimal 20MB');
            return;
        }

        selectedFile = file;
        
        // Check if it's image or video
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
        
        // Validate
        if (prizes.length === 0) {
            alert('Minimal 1 hadiah harus diisi!');
            return;
        }
        
        // Show loading
        setButtonLoading(true);
        
        // Get selected requirements
        const requirements = [];
        elements.requirementCheckboxes.forEach(cb => {
            if (cb.checked) requirements.push(cb.value);
        });
        
        // Prepare data
        const formData = {
            creator_user_id: telegramUser?.id || 123456789,
            fullname: telegramUser ? [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ') : 'Test User',
            username: telegramUser?.username || 'testuser',
            prizes: prizes,
            giveaway_text: elements.giveawayText.value || 'Ikuti giveaway ini dan menangkan hadiah menarik! 🎁',
            requirements: requirements,
            duration_type: elements.durationMode.classList.contains('active') ? 'duration' : 'date',
            captcha_enabled: elements.captchaToggle.checked
        };
        
        // Add duration data
        if (formData.duration_type === 'duration') {
            formData.duration_value = parseInt(elements.durationValue.value) || 2;
            formData.duration_unit = elements.durationUnit.value;
        } else {
            formData.end_date = elements.endDate.value;
        }
        
        // Simulate API call
        console.log('📤 Submitting giveaway:', formData);
        
        try {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Generate random giveaway ID
            const giveawayId = generateGiveawayId();
            
            // Success
            setButtonLoading(false);
            showSuccess(giveawayId);
            
        } catch (error) {
            console.error('❌ Error:', error);
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
        // Show success message
        elements.submitBtn.classList.add('success');
        elements.submitBtn.querySelector('.btn-text').textContent = 'Berhasil!';
        
        // Show alert with giveaway ID
        setTimeout(() => {
            alert(`✅ Giveaway berhasil dibuat!\n\nGiveaway ID: ${giveawayId}\n\nLink: ${API_BASE_URL}/giveaway/${giveawayId}`);
            
            // Redirect to index
            window.location.href = 'index.html';
        }, 500);
    }

    // ==================== START ====================
    init();
})();
