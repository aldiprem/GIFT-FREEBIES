// Search/View Giveaway JavaScript
(function() {
    console.log('🔍 SEARCH GIVEAWAY - Script started...');

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
    
    const elements = {
        loading: document.getElementById('loading'),
        error: document.getElementById('error'),
        giveawayContent: document.getElementById('giveawayContent'),
        errorTitle: document.getElementById('errorTitle'),
        errorMessage: document.getElementById('errorMessage'),
        
        // Giveaway elements
        statusBadge: document.getElementById('statusBadge'),
        giveawayIdDisplay: document.getElementById('giveawayIdDisplay'),
        creatorSection: document.getElementById('creatorSection'),
        creatorAvatar: document.getElementById('creatorAvatar'),
        creatorName: document.getElementById('creatorName'),
        creatorUsername: document.getElementById('creatorUsername'),
        prizesSection: document.getElementById('prizesSection'),
        textSection: document.getElementById('textSection'),
        requirementsSection: document.getElementById('requirementsSection'),
        
        // Channels
        channelsTitle: document.getElementById('channelsTitle'),
        channelsSection: document.getElementById('channelsSection'),
        
        // Links
        linksTitle: document.getElementById('linksTitle'),
        linksSection: document.getElementById('linksSection'),
        
        // Duration
        createdAt: document.getElementById('createdAt'),
        endDate: document.getElementById('endDate'),
        countdown: document.getElementById('countdown'),
        
        // CAPTCHA
        captchaStatus: document.getElementById('captchaStatus'),
        
        // Stats
        participantsCount: document.getElementById('participantsCount'),
        winnersCount: document.getElementById('winnersCount'),
        ticketsCount: document.getElementById('ticketsCount'),
        
        // Buttons
        joinBtn: document.getElementById('joinBtn'),
        shareBtn: document.getElementById('shareBtn'),
        backToHomeBtn: document.getElementById('backToHomeBtn'),
        
        // Modals
        joinModal: document.getElementById('joinModal'),
        closeJoinModal: document.getElementById('closeJoinModal'),
        cancelJoinBtn: document.getElementById('cancelJoinBtn'),
        verifyJoinBtn: document.getElementById('verifyJoinBtn'),
        verificationList: document.getElementById('verificationList'),
        captchaContainer: document.getElementById('captchaContainer'),
        captchaQuestion: document.getElementById('captchaQuestion'),
        captchaAnswer: document.getElementById('captchaAnswer'),
        
        successModal: document.getElementById('successModal'),
        closeSuccessModal: document.getElementById('closeSuccessModal'),
        successTicket: document.getElementById('successTicket')
    };

    // ==================== STATE ====================
    let giveawayId = null;
    let giveawayData = null;
    let telegramUser = null;
    let countdownInterval = null;
    let captchaAnswer = 0;
    
    // ==================== FUNGSI GET URL PARAMETER ====================
    function getGiveawayIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('search') || urlParams.get('id');
    }

    // ==================== FUNGSI FORMAT HTML ====================
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    }

    // ==================== FUNGSI FETCH GIVEAWAY ====================
    async function fetchGiveaway(id) {
        try {
            console.log(`📡 Fetching giveaway with ID: ${id}`);
            
            const response = await fetch(`${API_BASE_URL}/api/giveaways/${id}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Giveaway tidak ditemukan');
                }
                throw new Error(`Gagal memuat data: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ Giveaway data received:', result);
            
            if (result.success && result.giveaway) {
                return result.giveaway;
            } else {
                throw new Error('Data giveaway tidak valid');
            }
            
        } catch (error) {
            console.error('❌ Error fetching giveaway:', error);
            throw error;
        }
    }

    // ==================== FUNGSI RENDER GIVEAWAY ====================
    function renderGiveaway(data) {
        giveawayData = data;
        
        // Update header
        elements.giveawayIdDisplay.textContent = `ID: ${data.giveaway_id || data.id}`;
        
        // Update status badge
        updateStatusBadge(data.status, data.end_date);
        
        // Update creator info
        if (data.creator) {
            const creator = data.creator;
            elements.creatorName.textContent = creator.fullname || 'Unknown';
            elements.creatorUsername.textContent = creator.username || 'unknown';
            
            // Generate avatar
            const firstChar = (creator.fullname || 'U').charAt(0).toUpperCase();
            elements.creatorAvatar.textContent = firstChar;
        } else {
            elements.creatorName.textContent = 'Unknown Creator';
            elements.creatorUsername.textContent = 'unknown';
            elements.creatorAvatar.textContent = '?';
        }
        
        // Render prizes
        renderPrizes(data.prizes);
        
        // Render text
        renderGiveawayText(data.giveaway_text);
        
        // Render requirements
        renderRequirements(data.requirements);
        
        // Render channels
        renderChannels(data.channels);
        
        // Render links
        renderLinks(data.links);
        
        // Render dates
        elements.createdAt.textContent = formatDate(data.created_at);
        elements.endDate.textContent = formatDate(data.end_date);
        
        // Render CAPTCHA status
        if (data.captcha_enabled) {
            elements.captchaStatus.textContent = 'Aktif';
            elements.captchaStatus.classList.remove('disabled');
        } else {
            elements.captchaStatus.textContent = 'Nonaktif';
            elements.captchaStatus.classList.add('disabled');
        }
        
        // Render stats
        elements.participantsCount.textContent = data.participants_count || 0;
        elements.winnersCount.textContent = data.winners_count || 0;
        elements.ticketsCount.textContent = data.participants_count || 0; // Sementara sama dengan peserta
        
        // Show/hide join button based on status
        if (data.status === 'active') {
            elements.joinBtn.style.display = 'flex';
        } else {
            elements.joinBtn.style.display = 'none';
        }
        
        // Start countdown
        startCountdown(data.end_date);
    }

    function updateStatusBadge(status, endDate) {
        const badge = elements.statusBadge;
        
        if (status === 'active') {
            // Cek apakah sudah melewati end date
            if (endDate) {
                const now = new Date();
                const end = new Date(endDate);
                if (now > end) {
                    badge.textContent = 'Expired';
                    badge.className = 'status-badge expired';
                    return;
                }
            }
            badge.textContent = 'Active';
            badge.className = 'status-badge';
        } else if (status === 'ended') {
            badge.textContent = 'Ended';
            badge.className = 'status-badge ended';
        } else if (status === 'deleted') {
            badge.textContent = 'Deleted';
            badge.className = 'status-badge expired';
        } else {
            badge.textContent = status;
            badge.className = 'status-badge';
        }
    }

    function renderPrizes(prizes) {
        if (!prizes || !Array.isArray(prizes) || prizes.length === 0) {
            elements.prizesSection.innerHTML = '<div class="prize-item">Tidak ada hadiah</div>';
            return;
        }
        
        let html = '';
        prizes.forEach((prize, index) => {
            const colors = ['#FF6B6B', '#4ECDC4', '#FFD166', '#A06CD5', '#F7B731'];
            const bgColor = colors[index % colors.length];
            
            html += `
                <div class="prize-item">
                    <span class="prize-number" style="background: ${bgColor};">${index + 1}</span>
                    ${escapeHtml(prize)}
                </div>
            `;
        });
        
        elements.prizesSection.innerHTML = html;
    }

    function renderGiveawayText(text) {
        if (!text) {
            elements.textSection.innerHTML = '<em>Tidak ada deskripsi</em>';
            return;
        }
        
        // Parse HTML content (aman karena dari database)
        elements.textSection.innerHTML = text;
    }

    function renderRequirements(requirements) {
        if (!requirements || !Array.isArray(requirements) || requirements.length === 0) {
            elements.requirementsSection.innerHTML = '<div class="requirement-item">Tidak ada syarat khusus</div>';
            return;
        }
        
        let html = '';
        requirements.forEach(req => {
            let icon = '';
            let label = req;
            
            switch(req) {
                case 'subscribe': icon = '🔔'; label = 'Subscribe Channel'; break;
                case 'premium': icon = '⭐'; label = 'Akun Premium'; break;
                case 'nonpremium': icon = '👤'; label = 'Akun Non-Premium'; break;
                case 'aktif': icon = '✅'; label = 'Akun Aktif'; break;
                case 'share': icon = '📤'; label = 'Share Postingan'; break;
                default: icon = '🔘';
            }
            
            html += `
                <div class="requirement-item">
                    <span class="requirement-icon">${icon}</span>
                    <span>${label}</span>
                </div>
            `;
        });
        
        elements.requirementsSection.innerHTML = html;
    }

    function renderChannels(channels) {
        if (!channels || !Array.isArray(channels) || channels.length === 0) {
            elements.channelsTitle.style.display = 'none';
            elements.channelsSection.style.display = 'none';
            return;
        }
        
        elements.channelsTitle.style.display = 'flex';
        elements.channelsSection.style.display = 'flex';
        
        let html = '';
        channels.forEach(channel => {
            const channelName = typeof channel === 'string' ? channel : (channel.title || channel.username || 'Unknown');
            const username = typeof channel === 'string' ? channel.replace('@', '') : (channel.username || '').replace('@', '');
            const isVerified = typeof channel !== 'string' && channel.is_verified;
            
            html += `
                <div class="channel-item">
                    <div class="channel-icon">📢</div>
                    <div class="channel-info">
                        <div class="channel-name">
                            ${escapeHtml(channelName)}
                            ${isVerified ? '<span class="channel-verified">✅</span>' : ''}
                        </div>
                        <div class="channel-username">${username}</div>
                    </div>
                    <a href="https://t.me/${username}" target="_blank" class="channel-btn">Buka</a>
                </div>
            `;
        });
        
        elements.channelsSection.innerHTML = html;
    }

    function renderLinks(links) {
        if (!links || !Array.isArray(links) || links.length === 0) {
            elements.linksTitle.style.display = 'none';
            elements.linksSection.style.display = 'none';
            return;
        }
        
        elements.linksTitle.style.display = 'flex';
        elements.linksSection.style.display = 'flex';
        
        let html = '';
        links.forEach(link => {
            const title = link.title || 'Tautan';
            const url = link.url || '#';
            
            html += `
                <div class="link-item" onclick="window.open('${escapeHtml(url)}', '_blank')">
                    <div class="link-icon">🔗</div>
                    <div class="link-info">
                        <div class="link-title">${escapeHtml(title)}</div>
                        <div class="link-url">${escapeHtml(url)}</div>
                    </div>
                </div>
            `;
        });
        
        elements.linksSection.innerHTML = html;
    }

    function startCountdown(endDate) {
        if (!endDate) {
            elements.countdown.textContent = 'Tidak terbatas';
            return;
        }
        
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        
        function updateCountdown() {
            const now = new Date();
            const end = new Date(endDate);
            const diff = end - now;
            
            if (diff <= 0) {
                elements.countdown.textContent = 'Berakhir';
                updateStatusBadge(giveawayData?.status, endDate);
                if (elements.joinBtn) elements.joinBtn.style.display = 'none';
                clearInterval(countdownInterval);
                return;
            }
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            let text = '';
            if (days > 0) text += `${days} hari `;
            if (hours > 0 || days > 0) text += `${hours} jam `;
            if (minutes > 0 || hours > 0 || days > 0) text += `${minutes} menit `;
            text += `${seconds} detik`;
            
            elements.countdown.textContent = text;
        }
        
        updateCountdown();
        countdownInterval = setInterval(updateCountdown, 1000);
    }

    // ==================== FUNGSI VERIFICATION MODAL ====================
    function showJoinModal() {
        if (!giveawayData) return;
        
        // Generate verification list
        let listHtml = '';
        if (giveawayData.requirements && giveawayData.requirements.length > 0) {
            giveawayData.requirements.forEach(req => {
                let text = '';
                switch(req) {
                    case 'subscribe': text = 'Subscribe ke channel'; break;
                    case 'premium': text = 'Memiliki akun Premium'; break;
                    case 'nonpremium': text = 'Akun non-Premium'; break;
                    case 'aktif': text = 'Akun aktif'; break;
                    case 'share': text = 'Share postingan ini'; break;
                    default: text = req;
                }
                listHtml += `<li>${text}</li>`;
            });
        }
        
        // Add channel verification
        if (giveawayData.channels && giveawayData.channels.length > 0) {
            giveawayData.channels.forEach(channel => {
                const channelName = typeof channel === 'string' ? channel : (channel.title || channel.username || 'Channel');
                listHtml += `<li>Bergabung dengan ${channelName}</li>`;
            });
        }
        
        if (!listHtml) {
            listHtml = '<li>Tidak ada verifikasi khusus</li>';
        }
        
        elements.verificationList.innerHTML = listHtml;
        
        // Generate CAPTCHA if enabled
        if (giveawayData.captcha_enabled) {
            elements.captchaContainer.style.display = 'block';
            const num1 = Math.floor(Math.random() * 10) + 1;
            const num2 = Math.floor(Math.random() * 10) + 1;
            captchaAnswer = num1 + num2;
            elements.captchaQuestion.textContent = `${num1} + ${num2} = ?`;
            elements.captchaAnswer.value = '';
        } else {
            elements.captchaContainer.style.display = 'none';
        }
        
        elements.joinModal.style.display = 'flex';
        hapticImpact('light');
    }

    function hideJoinModal() {
        elements.joinModal.style.display = 'none';
    }

    function showSuccessModal() {
        // Generate random ticket number
        const ticketNumber = 'TICKET-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        elements.successTicket.textContent = ticketNumber;
        
        elements.successModal.style.display = 'flex';
        hapticNotification('success');
    }

    function hideSuccessModal() {
        elements.successModal.style.display = 'none';
    }

    // ==================== FUNGSI JOIN GIVEAWAY ====================
    async function joinGiveaway() {
        if (!telegramUser) {
            hapticNotification('error');
            alert('Silakan buka melalui Telegram Web App');
            return;
        }
        
        // Verify CAPTCHA if enabled
        if (giveawayData.captcha_enabled) {
            const userAnswer = parseInt(elements.captchaAnswer.value);
            if (isNaN(userAnswer) || userAnswer !== captchaAnswer) {
                hapticNotification('error');
                alert('Jawaban CAPTCHA salah!');
                return;
            }
        }
        
        hapticImpact('medium');
        
        // Simulasi join (nanti diganti dengan API call)
        setTimeout(() => {
            hideJoinModal();
            showSuccessModal();
            
            // Update participant count
            const currentCount = parseInt(elements.participantsCount.textContent) || 0;
            elements.participantsCount.textContent = currentCount + 1;
            elements.ticketsCount.textContent = currentCount + 1;
        }, 1000);
    }

    // ==================== FUNGSI SHARE ====================
    function shareGiveaway() {
        const url = window.location.href;
        const text = `Ikuti giveaway ini: ${giveawayData?.prizes?.[0] || 'Giveaway'} - ${url}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'GiftFreebies Giveaway',
                text: text,
                url: url
            }).then(() => {
                hapticNotification('success');
            }).catch(() => {
                hapticImpact('light');
            });
        } else {
            // Fallback copy to clipboard
            navigator.clipboard.writeText(url).then(() => {
                hapticNotification('success');
                alert('Link giveaway disalin!');
            }).catch(() => {
                hapticImpact('light');
            });
        }
    }

    // ==================== FUNGSI INIT ====================
    async function init() {
        console.log('🚀 Initializing search page...');
        
        // Get Telegram user if available
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.expand();
            tg.ready();
            telegramUser = tg.initDataUnsafe?.user;
            console.log('👤 Telegram user:', telegramUser);
        }
        
        // Get giveaway ID from URL
        giveawayId = getGiveawayIdFromUrl();
        console.log('🔍 Giveaway ID from URL:', giveawayId);
        
        if (!giveawayId) {
            // No giveaway ID in URL
            elements.loading.style.display = 'none';
            elements.error.style.display = 'flex';
            elements.errorTitle.textContent = 'ID Giveaway Tidak Ditemukan';
            elements.errorMessage.textContent = 'URL tidak mengandung ID giveaway yang valid.';
            return;
        }
        
        try {
            // Fetch giveaway data
            const data = await fetchGiveaway(giveawayId);
            
            // Hide loading, show content
            elements.loading.style.display = 'none';
            elements.giveawayContent.style.display = 'block';
            
            // Render giveaway
            renderGiveaway(data);
            
            // Setup event listeners
            setupEventListeners();
            
        } catch (error) {
            console.error('❌ Error:', error);
            
            elements.loading.style.display = 'none';
            elements.error.style.display = 'flex';
            elements.errorTitle.textContent = 'Gagal Memuat Giveaway';
            elements.errorMessage.textContent = error.message || 'Terjadi kesalahan saat memuat data.';
        }
    }

    function setupEventListeners() {
        // Join button
        if (elements.joinBtn) {
            elements.joinBtn.addEventListener('click', () => {
                if (!telegramUser) {
                    hapticNotification('error');
                    alert('Silakan buka melalui Telegram Web App untuk mengikuti giveaway');
                    return;
                }
                showJoinModal();
            });
        }
        
        // Share button
        if (elements.shareBtn) {
            elements.shareBtn.addEventListener('click', shareGiveaway);
        }
        
        // Back to home button
        if (elements.backToHomeBtn) {
            elements.backToHomeBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
        
        // Modal close buttons
        if (elements.closeJoinModal) {
            elements.closeJoinModal.addEventListener('click', hideJoinModal);
        }
        
        if (elements.cancelJoinBtn) {
            elements.cancelJoinBtn.addEventListener('click', hideJoinModal);
        }
        
        if (elements.closeSuccessModal) {
            elements.closeSuccessModal.addEventListener('click', hideSuccessModal);
        }
        
        // Verify join button
        if (elements.verifyJoinBtn) {
            elements.verifyJoinBtn.addEventListener('click', joinGiveaway);
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === elements.joinModal) {
                hideJoinModal();
            }
            if (e.target === elements.successModal) {
                hideSuccessModal();
            }
        });
    }

    // ==================== START ====================
    init();
})();
