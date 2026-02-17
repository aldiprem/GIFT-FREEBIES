// Link Manager JavaScript
(function() {
    console.log('🔗 LINK MANAGER - Script started...');

    // ==================== HAPTIC FEEDBACK ====================
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

    // ==================== STATE ====================
    let links = [];
    let selectedLinks = new Set();

    // ==================== DOM ELEMENTS ====================
    const elements = {
        savedLinksFull: document.getElementById('savedLinksFull'),
        createNewLinkBtn: document.getElementById('createNewLinkBtn'),
        deleteSelectedBtn: document.getElementById('deleteSelectedBtn'),
        saveAndCloseBtn: document.getElementById('saveAndCloseBtn'),
        
        // Modal elements
        modal: document.getElementById('createLinkModal'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        modalCancelBtn: document.getElementById('modalCancelBtn'),
        modalSaveBtn: document.getElementById('modalSaveBtn'),
        linkTitleInput: document.getElementById('linkTitleInput'),
        linkUrlInput: document.getElementById('linkUrlInput')
    };

    // ==================== INITIALIZATION ====================
    function init() {
        console.log('🚀 Initializing link manager...');
        
        // Check if elements exist
        for (let [key, value] of Object.entries(elements)) {
            if (!value) {
                console.warn(`⚠️ Element not found: ${key}`);
            }
        }
        
        // Load saved links from localStorage
        loadLinks();
        
        // Setup event listeners
        setupEventListeners();
        
        // Render links
        renderLinks();
    }

    // ==================== LOAD/SAVE LINKS ====================
    function loadLinks() {
        const saved = localStorage.getItem('giftfreebies_links');
        console.log('📥 Loading links from storage:', saved);
        
        if (saved) {
            try {
                links = JSON.parse(saved);
                console.log('✅ Links loaded:', links);
            } catch (e) {
                console.error('❌ Error parsing links:', e);
                links = [];
            }
        } else {
            console.log('ℹ️ No saved links found, using defaults');
            // Default links - comment out if you don't want defaults
            // links = [
            //     { id: '1', title: 'Channel Telegram', url: 'https://t.me/giftfreebies' }
            // ];
            links = [];
        }
    }

    function saveLinks() {
        console.log('💾 Saving links:', links);
        localStorage.setItem('giftfreebies_links', JSON.stringify(links));
    }

    // ==================== RENDER LINKS ====================
    function renderLinks() {
        if (!elements.savedLinksFull) {
            console.error('❌ savedLinksFull element not found');
            return;
        }
        
        console.log('🎨 Rendering links, count:', links.length);
        
        if (links.length === 0) {
            elements.savedLinksFull.innerHTML = `
                <div class="empty-links">
                    <div class="empty-icon">🔗</div>
                    <div class="empty-text">Belum ada tautan tersimpan</div>
                    <div class="empty-subtext">Klik tombol ➕ untuk membuat tautan baru</div>
                </div>
            `;
            return;
        }
        
        let html = '';
        links.forEach(link => {
            const isSelected = selectedLinks.has(link.id);
            html += `
                <div class="link-item ${isSelected ? 'selected' : ''}" data-id="${link.id}">
                    <div class="link-info">
                        <div class="link-icon">🔗</div>
                        <div class="link-details">
                            <div class="link-title">${escapeHtml(link.title || 'Untitled')}</div>
                            <div class="link-url">${escapeHtml(link.url || '#')}</div>
                        </div>
                    </div>
                    <div class="link-selector ${isSelected ? 'selected' : ''}" data-id="${link.id}">
                        ${isSelected ? '✓' : ''}
                    </div>
                </div>
            `;
        });
        
        elements.savedLinksFull.innerHTML = html;
        
        // Add click listeners to link items
        document.querySelectorAll('.link-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't toggle if clicking on selector (already handled)
                if (e.target.classList.contains('link-selector')) return;
                
                const id = item.dataset.id;
                if (id) toggleSelectLink(id);
            });
        });
        
        document.querySelectorAll('.link-selector').forEach(selector => {
            selector.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = selector.dataset.id;
                if (id) toggleSelectLink(id);
            });
        });
    }
    
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==================== SELECT LINK TOGGLE ====================
    function toggleSelectLink(id) {
        console.log('🔘 Toggling select for link:', id);
        hapticImpact('light');
        
        if (selectedLinks.has(id)) {
            selectedLinks.delete(id);
        } else {
            selectedLinks.add(id);
        }
        
        // Update UI
        const linkItem = document.querySelector(`.link-item[data-id="${id}"]`);
        const selector = document.querySelector(`.link-selector[data-id="${id}"]`);
        
        if (linkItem) {
            if (selectedLinks.has(id)) {
                linkItem.classList.add('selected');
                if (selector) {
                    selector.classList.add('selected');
                    selector.textContent = '✓';
                }
            } else {
                linkItem.classList.remove('selected');
                if (selector) {
                    selector.classList.remove('selected');
                    selector.textContent = '';
                }
            }
        }
    }

    // ==================== CREATE NEW LINK ====================
    function showCreateModal() {
        console.log('📝 Showing create modal');
        hapticImpact('medium');
        
        // Reset form
        if (elements.linkTitleInput) elements.linkTitleInput.value = '';
        if (elements.linkUrlInput) elements.linkUrlInput.value = 'https://';
        
        // Show modal
        if (elements.modal) {
            elements.modal.style.display = 'flex';
        }
    }

    function hideModal() {
        console.log('🔒 Hiding modal');
        if (elements.modal) {
            elements.modal.style.display = 'none';
        }
    }

    function createNewLink() {
        console.log('➕ Creating new link');
        
        if (!elements.linkTitleInput || !elements.linkUrlInput) {
            console.error('❌ Link input elements not found');
            return;
        }
        
        const title = elements.linkTitleInput.value.trim();
        let url = elements.linkUrlInput.value.trim();
        
        // Validate
        if (!title) {
            hapticNotification('error');
            alert('Judul tautan harus diisi!');
            return;
        }
        
        if (!url) {
            hapticNotification('error');
            alert('URL tautan harus diisi!');
            return;
        }
        
        // Validate URL format
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            hapticNotification('error');
            alert('URL harus diawali dengan http:// atau https://');
            return;
        }
        
        // Generate unique ID
        const id = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
        
        // Add to links
        links.push({
            id: id,
            title: title,
            url: url
        });
        
        console.log('✅ Link created:', { id, title, url });
        
        // Save
        saveLinks();
        
        // Render
        renderLinks();
        
        // Haptic feedback
        hapticNotification('success');
        
        // Hide modal
        hideModal();
    }

    // ==================== DELETE SELECTED ====================
    function deleteSelected() {
        console.log('🗑️ Delete selected links, count:', selectedLinks.size);
        
        if (selectedLinks.size === 0) {
            hapticNotification('error');
            alert('Pilih tautan yang ingin dihapus terlebih dahulu!');
            return;
        }
        
        hapticImpact('heavy');
        
        if (confirm(`Hapus ${selectedLinks.size} tautan yang dipilih?`)) {
            // Filter out selected links
            links = links.filter(link => !selectedLinks.has(link.id));
            
            // Clear selection
            selectedLinks.clear();
            
            // Save
            saveLinks();
            
            // Render
            renderLinks();
            
            // Haptic feedback
            hapticNotification('success');
            console.log('✅ Selected links deleted');
        }
    }

    // ==================== SAVE AND CLOSE ====================
    function saveAndClose() {
        console.log('💾 Save and close, sending links to parent');
        hapticImpact('medium');
        
        // Kirim data links ke parent window (create.html)
        if (window.opener) {
            window.opener.postMessage({
                type: 'linksUpdated',
                links: links
            }, '*');
            console.log('📨 Links sent to parent');
        } else {
            console.warn('⚠️ No opener window found');
            // If no opener, just go back
        }
        
        // Kembali ke create.html
        window.location.href = 'create.html';
    }

    // ==================== SETUP EVENT LISTENERS ====================
    function setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Create new link button
        if (elements.createNewLinkBtn) {
            elements.createNewLinkBtn.addEventListener('click', showCreateModal);
            console.log('✅ Create new link button listener added');
        } else {
            console.error('❌ createNewLinkBtn not found');
        }
        
        // Delete selected button
        if (elements.deleteSelectedBtn) {
            elements.deleteSelectedBtn.addEventListener('click', deleteSelected);
            console.log('✅ Delete selected button listener added');
        } else {
            console.error('❌ deleteSelectedBtn not found');
        }
        
        // Save and close button
        if (elements.saveAndCloseBtn) {
            elements.saveAndCloseBtn.addEventListener('click', saveAndClose);
            console.log('✅ Save and close button listener added');
        } else {
            console.error('❌ saveAndCloseBtn not found');
        }
        
        // Modal close buttons
        if (elements.closeModalBtn) {
            elements.closeModalBtn.addEventListener('click', hideModal);
        }
        
        if (elements.modalCancelBtn) {
            elements.modalCancelBtn.addEventListener('click', hideModal);
        }
        
        // Modal save button
        if (elements.modalSaveBtn) {
            elements.modalSaveBtn.addEventListener('click', createNewLink);
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (elements.modal && e.target === elements.modal) {
                hideModal();
            }
        });
        
        // Enter key in inputs
        if (elements.linkUrlInput) {
            elements.linkUrlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    createNewLink();
                }
            });
        }
        
        if (elements.linkTitleInput) {
            elements.linkTitleInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    elements.linkUrlInput?.focus();
                }
            });
        }
    }

    // ==================== START ====================
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
