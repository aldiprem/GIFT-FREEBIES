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
    
    const elements = {
        loading: document.getElementById('loading'),
        error: document.getElementById('error'),
        formContent: document.getElementById('formContent'),
    
        // Form inputs
        prizeInput: document.getElementById('prizeInput'),
        prizesTags: document.getElementById('prizesTags'),
        giveawayText: document.getElementById('giveawayText'),
        requirementCheckboxes: document.querySelectorAll('input[name="requirements"]'),
    
        // Channel elements - TAMBAHKAN INI
        channelInput: document.getElementById('channelInput'),
        channelTags: document.getElementById('channelTags'),
        
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
        
        // Syarat Giveaway
        selectRequirementsBtn: document.getElementById('selectRequirementsBtn'),
        selectPanel: document.getElementById('selectPanel'),
        closePanelBtn: document.getElementById('closePanelBtn'),
        selectedTags: document.getElementById('selectedTags'),
        
        // Link Manager elements
        linkManagerBtn: document.getElementById('linkManagerBtn'),
        linkExpandBtn: document.getElementById('linkExpandBtn'),
        linkPreviewArea: document.getElementById('linkPreviewArea'),
        linkTags: document.getElementById('linkTags'),
        linkEmptyState: document.getElementById('linkEmptyState'),
        linkCount: document.getElementById('linkCount'),
        linkTagsContainer: document.getElementById('linkTagsContainer'),
        
        // Duration elements
        durationAddBtn: document.getElementById('durationAddBtn'),
        durationSettingsContainer: document.getElementById('durationSettingsContainer'),
        durationDisplay: document.getElementById('durationDisplay'),
        durationSaveBtn: document.getElementById('durationSaveBtn'),
        daysDisplay: document.getElementById('daysDisplay'),
        hoursDisplay: document.getElementById('hoursDisplay'),
        minutesDisplay: document.getElementById('minutesDisplay'),
        secondsDisplay: document.getElementById('secondsDisplay'),
        
        // Add Link button (lama)
        addLinkBtn: document.getElementById('addLinkBtn'),
        savedLinksContainer: document.getElementById('savedLinksContainer')
    };

    // ==================== STATE ====================
    let channels = [];
    let prizes = ['Gaming Bundle'];
    let selectedFile = null;
    let telegramUser = null;
    let selectedRequirements = ['subscribe'];
    let savedLinks = [];
    let isLinkExpanded = false;
    let isDurationExpanded = false;
    
    // Foldable sections state
    let foldableStates = {
      prize: false,
      text: false,
      channel: false,
      requirements: false,
      link: false,
      duration: false,
      media: false,
      captcha: false
    };
    
    // Duration values
    let durationDays = 10;
    let durationHours = 2;
    let durationMinutes = 30;
    let durationSeconds = 0;

    // ==================== FUNGSI LINK MANAGER ====================
    function loadSavedLinks() {
        console.log('📥 Loading saved links...');
        const saved = localStorage.getItem('giftfreebies_links');
        if (saved) {
            try {
                savedLinks = JSON.parse(saved);
                console.log('✅ Loaded links:', savedLinks);
                updateLinkDisplay();
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

    function setupLinkManager() {
      console.log('🔧 Setting up Link Manager...');
    
      if (elements.linkManagerBtn) {
        // Hapus event listener lama biar gak dobel
        elements.linkManagerBtn.replaceWith(elements.linkManagerBtn.cloneNode(true));
        elements.linkManagerBtn = document.getElementById('linkManagerBtn');
    
        elements.linkManagerBtn.addEventListener('click', () => {
          hapticImpact('medium');
          // Simpan state ke sessionStorage sebelum pindah halaman
          saveFormState();
          window.location.href = 'link-manager.html';
        });
      }
    
      if (elements.linkExpandBtn) {
        elements.linkExpandBtn.addEventListener('click', () => {
          hapticImpact('light');
          toggleLinkExpand();
        });
      }
    
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
        
        updateLinkCount();
        
        if (savedLinks.length > 1) {
            elements.linkExpandBtn.style.display = 'flex';
        } else {
            elements.linkExpandBtn.style.display = 'none';
            if (isLinkExpanded) {
                isLinkExpanded = false;
                elements.linkTagsContainer.style.display = 'none';
                elements.linkPreviewArea.style.display = 'flex';
                elements.linkExpandBtn.classList.remove('expanded');
                elements.linkExpandBtn.textContent = '▼';
            }
        }
        
        if (savedLinks.length === 0) {
            elements.linkPreviewArea.style.display = 'none';
            elements.linkTagsContainer.style.display = 'none';
            elements.linkEmptyState.style.display = 'flex';
            elements.linkTags.innerHTML = '';
            return;
        }
        
        elements.linkEmptyState.style.display = 'none';
        
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
        
        const previewRemove = elements.linkPreviewArea.querySelector('.link-preview-remove');
        if (previewRemove) {
            previewRemove.addEventListener('click', (e) => {
                e.stopPropagation();
                hapticImpact('light');
                const id = previewRemove.dataset.id;
                removeLinkById(id);
            });
        }
        
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

    // ==================== FUNGSI DURASI GIVEAWAY (IPHONE STYLE) ====================
    function setupDurationManager() {
        console.log('⏰ Setting up Duration Manager (iPhone style)...');
        
        // Set nilai default
        if (durationDays === undefined) durationDays = 10;
        if (durationHours === undefined) durationHours = 2;
        if (durationMinutes === undefined) durationMinutes = 30;
        if (durationSeconds === undefined) durationSeconds = 0;
        
        // Generate options untuk setiap kolom
        generateWheelOptions('days', 0, 31, durationDays);
        generateWheelOptions('hours', 0, 23, durationHours);
        generateWheelOptions('minutes', 0, 59, durationMinutes);
        generateWheelOptions('seconds', 0, 59, durationSeconds);
        
        // Setup wheel scroll listeners
        setupWheelScroll('days', 0, 31, (value) => { // UBAH min dari 1 jadi 0
          durationDays = value;
          if (elements.daysDisplay) elements.daysDisplay.textContent = value;
          hapticSelection();
          updateDurationDisplay();
        });
        
        setupWheelScroll('hours', 0, 23, (value) => {
          durationHours = value;
          if (elements.hoursDisplay) elements.hoursDisplay.textContent = value;
          hapticSelection();
          updateDurationDisplay();
        });
        
        setupWheelScroll('minutes', 0, 59, (value) => {
          durationMinutes = value;
          if (elements.minutesDisplay) elements.minutesDisplay.textContent = value;
          hapticSelection();
          updateDurationDisplay();
        });
        
        setupWheelScroll('seconds', 0, 59, (value) => {
          durationSeconds = value;
          if (elements.secondsDisplay) elements.secondsDisplay.textContent = value;
          hapticSelection();
          updateDurationDisplay();
        });
        
        // Tombol + untuk expand/collapse
        if (elements.durationAddBtn) {
            elements.durationAddBtn.addEventListener('click', () => {
                hapticImpact('light');
                toggleDurationExpand();
            });
        }
        
        // Tombol simpan
        if (elements.durationSaveBtn) {
            elements.durationSaveBtn.addEventListener('click', () => {
                hapticImpact('medium');
                saveDurationSettings();
            });
        }
        
        // Update tampilan durasi
        updateDurationDisplay();
    }
    
    function generateWheelOptions(unit, min, max, selectedValue) {
        const optionsContainer = document.getElementById(`${unit}Options`);
        if (!optionsContainer) return;
        
        let html = '';
        for (let i = min; i <= max; i++) {
            const isSelected = (i === selectedValue);
            html += `<div class="selector-option ${isSelected ? 'selected' : ''}" data-value="${i}">${i}</div>`;
        }
        optionsContainer.innerHTML = html;
        
        // Scroll ke nilai yang dipilih dengan posisi tengah yang PRESISI
        setTimeout(() => {
            const selector = document.getElementById(`${unit}Selector`);
            if (selector) {
                const selectedIndex = selectedValue - min;
                
                // PERBAIKAN: Hitung scroll position dengan tepat
                // Tinggi item: 48px, padding-top: 76px, setengah item: 24px
                // Rumus yang benar: (selectedIndex * 48) + (paddingTop - halfItem)
                // paddingTop - halfItem = 76 - 24 = 52
                const scrollPosition = (selectedIndex * 48) + 52;
                
                selector.scrollTop = scrollPosition;
            }
        }, 100);
    }
    
  function setupWheelScroll(unit, min, max, onChange) {
    const selector = document.getElementById(`${unit}Selector`);
    if (!selector) return;
  
    let snapTimeout;
    let lastValue = -1;
    let isScrolling = false; // TAMBAHKAN FLAG INI
    const itemHeight = 48;
    const paddingTop = 76;
    const halfItem = 24;
    const offset = paddingTop - halfItem; // 52
  
    // Fungsi untuk mendapatkan nilai berdasarkan posisi scroll
    function getValueFromScroll(scrollTop) {
      const adjustedScroll = scrollTop - offset;
      let index = Math.floor(adjustedScroll / itemHeight);
  
      if (adjustedScroll < 0) index = 0;
      index = Math.max(0, Math.min(max - min, Math.floor(index)));
  
      return min + index;
    }
  
    // Fungsi untuk mendapatkan posisi scroll dari nilai
    function getScrollFromValue(value) {
      const index = value - min;
      return (index * itemHeight) + offset;
    }
  
    // Fungsi untuk snap ke posisi terdekat
    function snapToNearest() {
      // HANYA SNAP JIKA TIDAK SEDANG DISCROLL
      if (!isScrolling) {
        const currentValue = getValueFromScroll(selector.scrollTop);
        const targetScroll = getScrollFromValue(currentValue);
  
        if (Math.abs(selector.scrollTop - targetScroll) > 1) {
          selector.scrollTop = targetScroll;
        }
  
        if (currentValue !== lastValue) {
          lastValue = currentValue;
          onChange(currentValue);
  
          const options = selector.querySelectorAll('.selector-option');
          options.forEach((opt, idx) => {
            const optValue = min + idx;
            if (optValue === currentValue) {
              opt.classList.add('selected');
            } else {
              opt.classList.remove('selected');
            }
          });
  
          hapticSelection();
        }
      }
    }
  
    selector.addEventListener('touchstart', () => {
      isScrolling = true; // SET FLAG SAAT MULAI SCROLL
      clearTimeout(snapTimeout);
    }, { passive: true });
  
    selector.addEventListener('touchend', () => {
      isScrolling = false; // RESET FLAG SAAT SCROLL SELESAI
      snapTimeout = setTimeout(snapToNearest, 100);
    });
  
    selector.addEventListener('touchcancel', () => {
      isScrolling = false; // RESET FLAG KALO DISCROLL DIBATALKAN
      snapTimeout = setTimeout(snapToNearest, 100);
    });
  
    selector.addEventListener('scroll', () => {
      const currentValue = getValueFromScroll(selector.scrollTop);
  
      if (currentValue !== lastValue) {
        lastValue = currentValue;
        onChange(currentValue);
  
        const options = selector.querySelectorAll('.selector-option');
        options.forEach((opt, idx) => {
          const optValue = min + idx;
          if (optValue === currentValue) {
            opt.classList.add('selected');
          } else {
            opt.classList.remove('selected');
          }
        });
      }
  
      // HANYA SET TIMEOUT KALAU TIDAK SEDANG DISCROLL
      if (!isScrolling) {
        clearTimeout(snapTimeout);
        snapTimeout = setTimeout(snapToNearest, 150);
      }
    });
  
    selector.addEventListener('mouseup', () => {
      isScrolling = false; // UNTUK MOUSE
      clearTimeout(snapTimeout);
      snapTimeout = setTimeout(snapToNearest, 80);
    });
  
    selector.addEventListener('mousedown', () => {
      isScrolling = true; // UNTUK MOUSE
      clearTimeout(snapTimeout);
    });
  
    // Set initial scroll position
    setTimeout(() => {
      const initialValue = unit === 'days' ? durationDays :
        unit === 'hours' ? durationHours :
        unit === 'minutes' ? durationMinutes : durationSeconds;
      selector.scrollTop = getScrollFromValue(initialValue);
      lastValue = initialValue;
    }, 100);
  }
    
    function toggleDurationExpand() {
      isDurationExpanded = !isDurationExpanded;
    
      if (elements.durationSettingsContainer) {
        elements.durationSettingsContainer.style.display = isDurationExpanded ? 'block' : 'none';
    
        // Reset scroll positions saat expand
        if (isDurationExpanded) {
          setTimeout(() => {
                    ['days', 'hours', 'minutes', 'seconds'].forEach(unit => {
              const selector = document.getElementById(`${unit}Selector`);
              if (selector) {
                const value = unit === 'days' ? durationDays :
                  unit === 'hours' ? durationHours :
                  unit === 'minutes' ? durationMinutes : durationSeconds;
    
                // SEMUA UNIT PAKAI min = 0
                const min = 0;
    
                // Gunakan rumus yang sama
                const index = value - min;
                const itemHeight = 48;
                const offset = 52;
    
                const scrollPosition = (index * itemHeight) + offset;
    
                selector.scrollTop = scrollPosition;
              }
            });
          }, 100);
        }
      }
    }
    
    function saveDurationSettings() {
        updateDurationDisplay();
        isDurationExpanded = false;
        if (elements.durationSettingsContainer) {
            elements.durationSettingsContainer.style.display = 'none';
        }
        hapticNotification('success');
    }
    
    function updateDurationDisplay() {
        if (!elements.durationDisplay) return;
        
        let parts = [];
        if (durationDays > 0) parts.push(`${durationDays} hari`);
        if (durationHours > 0) parts.push(`${durationHours} jam`);
        if (durationMinutes > 0) parts.push(`${durationMinutes} menit`);
        if (durationSeconds > 0) parts.push(`${durationSeconds} detik`);
        
        let text = parts.join(' ') || '0 detik';
        
        elements.durationDisplay.innerHTML = `<span class="duration-text">${text}</span>`;
    }

    function saveFormState() {
      // Collect foldable states
      const sections = [
            'prize', 'text', 'channel', 'requirements',
            'link', 'duration', 'media', 'captcha'
        ];
    
      sections.forEach(section => {
        const content = document.getElementById(`${section}Content`);
        if (content) {
          foldableStates[section] = content.style.display === 'block';
        }
      });
    
      const formState = {
        prizes: prizes,
        channels: channels,
        selectedRequirements: selectedRequirements,
        giveawayText: elements.giveawayText?.value || '',
        durationDays: durationDays,
        durationHours: durationHours,
        durationMinutes: durationMinutes,
        durationSeconds: durationSeconds,
        captchaEnabled: elements.captchaToggle?.checked || true,
        foldableStates: foldableStates // Simpan state foldable
      };
    
      sessionStorage.setItem('giftfreebies_form_state', JSON.stringify(formState));
      console.log('💾 Form state saved:', formState);
    }
    
    function restoreFormState() {
      const savedState = sessionStorage.getItem('giftfreebies_form_state');
      if (!savedState) return false;
    
      try {
        const state = JSON.parse(savedState);
        console.log('📥 Restoring form state:', state);
    
        // Restore prizes
        if (state.prizes && state.prizes.length > 0) {
          prizes = state.prizes;
          updatePrizesTags();
        }
    
        // Restore channels
        if (state.channels && state.channels.length > 0) {
          channels = state.channels;
          updateChannelsTags();
        }
    
        // Restore requirements
        if (state.selectedRequirements && state.selectedRequirements.length > 0) {
          selectedRequirements = state.selectedRequirements;
          document.querySelectorAll('input[name="requirements"]').forEach(cb => {
            cb.checked = selectedRequirements.includes(cb.value);
          });
          updateSelectedTags();
          initSelectedOptions();
        }
    
        // Restore giveaway text
        if (state.giveawayText && elements.giveawayText) {
          elements.giveawayText.value = state.giveawayText;
        }
    
        // Restore duration
        if (state.durationDays !== undefined) durationDays = state.durationDays;
        if (state.durationHours !== undefined) durationHours = state.durationHours;
        if (state.durationMinutes !== undefined) durationMinutes = state.durationMinutes;
        if (state.durationSeconds !== undefined) durationSeconds = state.durationSeconds;
    
        // Update displays
        if (elements.daysDisplay) elements.daysDisplay.textContent = durationDays;
        if (elements.hoursDisplay) elements.hoursDisplay.textContent = durationHours;
        if (elements.minutesDisplay) elements.minutesDisplay.textContent = durationMinutes;
        if (elements.secondsDisplay) elements.secondsDisplay.textContent = durationSeconds;
    
        // Regenerate wheel options
        generateWheelOptions('days', 0, 31, durationDays);
        generateWheelOptions('hours', 0, 23, durationHours);
        generateWheelOptions('minutes', 0, 59, durationMinutes);
        generateWheelOptions('seconds', 0, 59, durationSeconds);
        updateDurationDisplay();
    
        // Restore captcha
        if (elements.captchaToggle && state.captchaEnabled !== undefined) {
          elements.captchaToggle.checked = state.captchaEnabled;
          if (elements.captchaLabel) {
            elements.captchaLabel.textContent = state.captchaEnabled ? 'Aktif' : 'Nonaktif';
          }
        }
    
        // Restore foldable states
        if (state.foldableStates) {
          foldableStates = state.foldableStates;
        }
    
        return true;
      } catch (e) {
        console.error('❌ Error restoring form state:', e);
        return false;
      }
    }

    function setupEventListeners() {
      console.log('🔧 Setting up event listeners...');
    
      // ==================== CHANNEL INPUT ====================
      if (elements.channelInput) {
        elements.channelInput.addEventListener('focus', handleChannelInputFocus);
        elements.channelInput.addEventListener('keydown', handleChannelInputKeydown);
        elements.channelInput.addEventListener('input', handleChannelInput);
      }
    
      // Channel tags remove - Perbaikan dengan event delegation yang lebih spesifik
      if (elements.channelTags) {
        const newChannelTags = elements.channelTags.cloneNode(true);
        elements.channelTags.parentNode.replaceChild(newChannelTags, elements.channelTags);
        elements.channelTags = newChannelTags;
      
        // Tambahkan event listener baru
        elements.channelTags.addEventListener('click', function(e) {
          // Cari elemen dengan class tag-remove
          const removeBtn = e.target.closest('.tag-remove');
      
          if (removeBtn) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation(); // Tambahkan ini untuk mencegah event lain
      
            hapticImpact('light');
      
            // Ambil channelId dari dataset
            const channelId = removeBtn.dataset.channel;
            console.log('🗑️ Remove button clicked for channel:', channelId);
      
            if (channelId) {
              removeChannel(channelId);
            }
      
            return false;
          }
        }, { capture: true }); // Gunakan capture phase untuk memastikan event tertangkap
      }
    
      // Prize input
      if (elements.prizeInput) {
        elements.prizeInput.addEventListener('keydown', handlePrizeInput);
        elements.prizeInput.addEventListener('blur', handlePrizeBlur);
      }
        
        // Prize tags remove
        if (elements.prizesTags) {
            elements.prizesTags.addEventListener('click', (e) => {
                if (e.target.classList.contains('tag-remove')) {
                    hapticImpact('light');
                    const prize = e.target.dataset.prize;
                    removePrize(prize);
                }
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
        
        // ==================== SYARAT GIVEAWAY ====================
        if (elements.selectRequirementsBtn) {
            elements.selectRequirementsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                hapticImpact('light');
                if (elements.selectPanel) {
                    elements.selectPanel.style.display = 
                        elements.selectPanel.style.display === 'none' ? 'block' : 'none';
                }
            });
        }
        
        if (elements.closePanelBtn) {
            elements.closePanelBtn.addEventListener('click', () => {
                hapticImpact('light');
                if (elements.selectPanel) {
                    elements.selectPanel.style.display = 'none';
                }
            });
        }
        
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                hapticSelection();
                const value = btn.dataset.value;
                toggleRequirement(value);
                btn.classList.toggle('selected');
            });
        });
        
        document.addEventListener('click', (e) => {
            if (elements.selectPanel && elements.selectRequirementsBtn) {
                if (!elements.selectPanel.contains(e.target) && 
                    !elements.selectRequirementsBtn.contains(e.target)) {
                    elements.selectPanel.style.display = 'none';
                }
            }
        });
        
        if (elements.selectedTags) {
            elements.selectedTags.addEventListener('click', (e) => {
                if (e.target.classList.contains('tag-remove')) {
                    hapticImpact('light');
                    const reqValue = e.target.dataset.req;
                    removeRequirement(reqValue);
                    
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
                if (prize) {
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
    
    // ==================== FUNGSI RANDOM COLOR ====================
    function getRandomColor(index) {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#FFD166', '#A06CD5', '#F7B731',
            '#45AAF2', '#FC5C65', '#26DE81', '#A55EEA', '#FF9F1C',
            '#2E86C1', '#E67E22', '#E74C3C', '#3498DB', '#9B59B6',
            '#1ABC9C', '#F1C40F', '#E67E22', '#E74C3C', '#2C3E50'
        ];
        return colors[index % colors.length];
    }

    function updatePrizesTags() {
        if (!elements.prizesTags) return;
        
        let html = '';
        prizes.forEach((prize, index) => {
            const bgColor = getRandomColor(index);
            html += `<span class="prize-tag">
                <span class="prize-number" style="background: ${bgColor}; box-shadow: 0 0 10px ${bgColor}80;">${index + 1}</span>
                ${prize} 
                <span class="tag-remove" data-prize="${prize}">×</span>
            </span>`;
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
    function toggleRequirement(value) {
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
        
        // Hitung total detik
        const totalSeconds = (durationDays * 24 * 3600) + 
                            (durationHours * 3600) + 
                            (durationMinutes * 60) + 
                            durationSeconds;
        
        const formData = {
            creator_user_id: telegramUser?.id || 123456789,
            fullname: telegramUser ? [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ') : 'Test User',
            username: telegramUser?.username || 'testuser',
            prizes: prizes,
            giveaway_text: elements.giveawayText.value || 'Ikuti giveaway ini dan menangkan hadiah menarik! 🎁',
            requirements: requirements,
            links: savedLinks,
            duration: {
                days: durationDays,
                hours: durationHours,
                minutes: durationMinutes,
                seconds: durationSeconds,
                total_seconds: totalSeconds
            },
            captcha_enabled: elements.captchaToggle.checked ? 1 : 0
        };
        
        console.log('📤 Submitting giveaway:', formData);
        
        try {
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

    function setupFoldableSections() {
      console.log('🔧 Setting up foldable sections...');
    
      const sections = [
        { id: 'prize', header: 'prizeHeader', content: 'prizeContent', btn: 'prizeToggleBtn' },
        { id: 'text', header: 'textHeader', content: 'textContent', btn: 'textToggleBtn' },
        { id: 'channel', header: 'channelHeader', content: 'channelContent', btn: 'channelToggleBtn' },
        { id: 'requirements', header: 'requirementsHeader', content: 'requirementsContent', btn: 'requirementsToggleBtn' },
        { id: 'link', header: 'linkHeader', content: 'linkContent', btn: 'linkToggleBtn' },
        { id: 'duration', header: 'durationHeader', content: 'durationContent', btn: 'durationToggleBtn' },
        { id: 'media', header: 'mediaHeader', content: 'mediaContent', btn: 'mediaToggleBtn' },
        { id: 'captcha', header: 'captchaHeader', content: 'captchaContent', btn: 'captchaToggleBtn' }
        ];
    
      sections.forEach(section => {
        const header = document.getElementById(section.header);
        const content = document.getElementById(section.content);
        const btn = document.getElementById(section.btn);
        const foldableSection = header?.closest('.foldable-section');
    
        if (header && content) {
          // Set initial state berdasarkan yang direstore atau default (false)
          const isExpanded = foldableStates[section.id] || false;
          content.style.display = isExpanded ? 'block' : 'none';
    
          if (isExpanded) {
            foldableSection?.classList.add('expanded');
            if (btn) {
              btn.classList.add('rotated');
              btn.textContent = '▲';
            }
          } else {
            foldableSection?.classList.remove('expanded');
            if (btn) {
              btn.classList.remove('rotated');
              btn.textContent = '▼';
            }
          }
    
          // Toggle function
          const toggleSection = () => {
            hapticImpact('light');
            const isHidden = content.style.display === 'none';
    
            // Toggle content
            content.style.display = isHidden ? 'block' : 'none';
    
            // Update state
            foldableStates[section.id] = !isHidden;
    
            // Toggle class pada section
            if (isHidden) {
              foldableSection?.classList.add('expanded');
            } else {
              foldableSection?.classList.remove('expanded');
            }
    
            // Toggle tombol panah
            if (btn) {
              if (isHidden) {
                btn.classList.add('rotated');
                btn.textContent = '▲';
              } else {
                btn.classList.remove('rotated');
                btn.textContent = '▼';
              }
            }
          };
    
          // Add click listener to header
          header.addEventListener('click', (e) => {
            if (e.target.closest('button') && e.target.closest('button') !== btn) {
              return;
            }
            toggleSection();
          });
    
          // Add click listener to toggle button
          if (btn) {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              toggleSection();
            });
          }
        }
      });
    }

    // ==================== CHANNEL HANDLERS ====================
    function handleChannelInput(e) {
      // Cek apakah pengguna mencoba menghapus karakter pertama (@)
      if (e.key === 'Backspace' && e.target.selectionStart === 1 && e.target.selectionEnd === 1) {
        e.preventDefault();
        hapticImpact('medium'); // Getar haptic
        return;
      }
    
      if (e.key === ',' || e.key === 'Enter') {
        e.preventDefault();
        hapticImpact('soft');
        addChannelFromInput();
      }
    }
    
    function handleChannelBlur() {
      addChannelFromInput();
    }
    
    function handleChannelInputFocus() {
      const input = elements.channelInput;
      // Jika input kosong, set value dengan @
      if (!input.value) {
        input.value = '@';
        // Set cursor setelah @
        setTimeout(() => {
          input.setSelectionRange(1, 1);
        }, 10);
      }
    }
    
    function handleChannelInputKeydown(e) {
      const input = e.target;
    
      // Cegah penghapusan karakter @ pertama
      if (e.key === 'Backspace' && input.selectionStart === 1 && input.selectionEnd === 1) {
        e.preventDefault();
        hapticImpact('medium'); // Getar haptic
        return;
      }
    
      // Cegah karakter pertama selain @
      if (input.selectionStart === 0 && input.selectionEnd === 0 && e.key !== '@' && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') {
        e.preventDefault();
        hapticImpact('soft');
        return;
      }
    }
    
    // ==================== CHANNEL HANDLERS ====================
    function handleChannelInput(e) {
      // Cek apakah pengguna mencoba menghapus karakter pertama (@)
      if (e.key === 'Backspace' && e.target.selectionStart === 1 && e.target.selectionEnd === 1) {
        e.preventDefault();
        hapticImpact('medium');
        return;
      }
    
      // Deteksi koma, enter, atau tombol "Done/Return" di mobile (key = 'Enter' atau 'Go')
      if (e.key === ',' || e.key === 'Enter' || e.key === 'Go' || e.key === 'Done') {
        e.preventDefault();
        hapticImpact('soft');
        addChannelFromInput();
      }
    }
    
    function handleChannelBlur() {
      // JANGAN panggil addChannelFromInput() di blur
      // Biar gak otomatis nambah kalo klik di luar
    }
    
    function handleChannelInputFocus() {
      const input = elements.channelInput;
      if (!input.value) {
        input.value = '@';
        setTimeout(() => {
          input.setSelectionRange(1, 1);
        }, 10);
      }
    }
    
    function handleChannelInputKeydown(e) {
      const input = e.target;
    
      // Cegah penghapusan karakter @ pertama
      if (e.key === 'Backspace' && input.selectionStart === 1 && input.selectionEnd === 1) {
        e.preventDefault();
        hapticImpact('medium');
        return;
      }
    
      // Cegah karakter pertama selain @
      if (input.selectionStart === 0 && input.selectionEnd === 0 && e.key !== '@' && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') {
        e.preventDefault();
        hapticImpact('soft');
        return;
      }
    
      // Deteksi tombol Done/Return di mobile
      if (e.key === 'Enter' || e.key === 'Go' || e.key === 'Done') {
        e.preventDefault();
        hapticImpact('soft');
        addChannelFromInput();
      }
    }
    
    function handleChannelInput() {
      const input = elements.channelInput;
      let value = input.value;
    
      if (!value) {
        input.value = '@';
        input.setSelectionRange(1, 1);
        return;
      }
    
      if (value[0] !== '@') {
        input.value = '@' + value.replace(/@/g, '');
        hapticImpact('soft');
      }
    
      if (value === '@') {
        return;
      }
    }
    
    // ==================== FUNGSI GET CHAT DATA DARI API ====================
    async function getChatData(username) {
      try {
        const cleanUsername = username.replace('@', '');
    
        // Coba dulu dari database
        let response = await fetch(`${API_BASE_URL}/api/chatid/username/${cleanUsername}`);
    
        // Kalau tidak ditemukan, minta bot untuk fetch data LANGSUNG
        if (response.status === 404) {
          console.log('📡 Data tidak ditemukan, memanggil bot untuk sync...');
    
          // Panggil endpoint fetch yang akan langsung ambil data
          const fetchResponse = await fetch(`${API_BASE_URL}/api/chatid/fetch/${cleanUsername}`);
    
          if (fetchResponse.ok) {
            const result = await fetchResponse.json();
    
            if (result.success) {
              // Data berhasil diambil, tampilkan notifikasi sukses
              hapticNotification('success');
    
              // Coba lagi ambil data yang baru saja disimpan
              response = await fetch(`${API_BASE_URL}/api/chatid/username/${cleanUsername}`);
    
              if (response.ok) {
                const data = await response.json();
                return {
                  valid: true,
                  chat_id: data.chat_id,
                  title: data.chat_title,
                  username: data.chat_username,
                  type: data.chat_type,
                  invite_link: data.invite_link,
                  admin_count: data.admin_count,
                  participants_count: data.participants_count,
                  is_verified: data.is_verified,
                  admins: data.admins || []
                };
              }
            } else {
              // Gagal mengambil data
              alert(`Gagal mengambil data untuk @${cleanUsername}: ${result.error || 'Unknown error'}`);
              return {
                valid: false,
                error: result.error || 'Gagal mengambil data'
              };
            }
          }
    
          return {
            valid: false,
            error: 'Channel/group tidak ditemukan'
          };
        }
    
        if (!response.ok) {
          return {
            valid: false,
            error: 'Channel/group tidak valid'
          };
        }
    
        const data = await response.json();
    
        return {
          valid: true,
          chat_id: data.chat_id,
          title: data.chat_title,
          username: data.chat_username,
          type: data.chat_type,
          invite_link: data.invite_link,
          admin_count: data.admin_count,
          participants_count: data.participants_count,
          is_verified: data.is_verified,
          admins: data.admins || []
        };
    
      } catch (error) {
        console.error('❌ Error getting chat data:', error);
        return {
          valid: false,
          error: 'Gagal terhubung ke server'
        };
      }
    }

    // ==================== FUNGSI LOADING MODAL ====================
    let typingInterval = null;
    let currentTypingIndex = 0;
    let typingLines = [];
    let startTime = null;
    let modal = null;
    
    function showLoadingModal(username) {
        // Hapus modal yang sudah ada
        const existingModal = document.querySelector('.sync-loading-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Hentikan typing interval jika ada
        if (typingInterval) {
            clearInterval(typingInterval);
            typingInterval = null;
        }
        
        // Reset state
        currentTypingIndex = 0;
        startTime = Date.now();
        
        // Lines awal - hanya 3 baris sederhana
        typingLines = [
            { text: `📡 Menghubungi server untuk @${username}...`, delay: 300 },
            { text: `🔍 Mengambil data dari Telegram...`, delay: 400 },
            { text: `⏳ Mohon tunggu sebentar...`, delay: 500 }
        ];
        
        // Buat modal
        modal = document.createElement('div');
        modal.className = 'sync-loading-modal';
        modal.innerHTML = `
            <div class="sync-loading-content">
                <div class="sync-loading-header">
                    <div class="sync-loading-title">⏳ Memuat Data Channel</div>
                    <div class="sync-loading-spinner"></div>
                </div>
                <div class="sync-loading-body">
                    <div class="sync-typing-container">
                        <div class="sync-typing-content" id="typingContent"></div>
                    </div>
                    <div class="sync-progress-bar">
                        <div class="sync-progress-fill" id="progressFill"></div>
                    </div>
                    <div class="sync-status" id="syncStatus">Memulai...</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Animasi masuk
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // Mulai typing effect sederhana
        startTypingEffect();
        
        return modal;
    }
    
    function startTypingEffect() {
        const typingContent = document.getElementById('typingContent');
        if (!typingContent) return;
        
        typingContent.innerHTML = '';
        currentTypingIndex = 0;
        
        function typeNextLine() {
            if (currentTypingIndex >= typingLines.length) {
                // Update status
                updateSyncStatus('Menyimpan data...');
                updateProgressBar(50);
                return;
            }
            
            const line = typingLines[currentTypingIndex];
            const lineElement = document.createElement('div');
            lineElement.className = 'sync-typing-line';
            lineElement.style.opacity = '0';
            typingContent.appendChild(lineElement);
            
            // Animasi fade in
            setTimeout(() => {
                lineElement.style.opacity = '1';
            }, 50);
            
            // Tampilkan langsung tanpa typing per karakter (lebih cepat)
            lineElement.textContent = line.text;
            
            // Update progress bar
            const progress = ((currentTypingIndex + 1) / typingLines.length) * 40;
            updateProgressBar(progress);
            
            // Update status
            if (currentTypingIndex === 0) {
                updateSyncStatus('Menghubungi server...');
            } else if (currentTypingIndex === 1) {
                updateSyncStatus('Mengambil data...');
            }
            
            currentTypingIndex++;
            
            // Lanjut ke line berikutnya setelah delay
            setTimeout(typeNextLine, line.delay || 400);
        }
        
        typeNextLine();
    }
    
    function updateSyncStatus(status) {
        const statusEl = document.getElementById('syncStatus');
        if (statusEl) {
            statusEl.textContent = status;
        }
    }
    
    function updateProgressBar(percent) {
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }
    }
    
    function updateLoadingModalWithData(data) {
        const typingContent = document.getElementById('typingContent');
        if (!typingContent) return;
        
        // Hitung waktu yang telah berlalu
        const elapsedTime = Math.round((Date.now() - startTime) / 1000);
        
        // Tambahkan line-line data real
        const dataLines = [
            { text: `✅ Chat ID: ${data.chat_id}`, delay: 200 },
            { text: `📢 Nama: ${data.chat_title}`, delay: 200 },
            { text: `🔗 Username: @${data.chat_username}`, delay: 200 },
            { text: `👥 Anggota: ${data.participants_count || 'Tidak diketahui'}`, delay: 200 }
        ];
        
        // Tambahkan satu per satu dengan cepat
        let dataIndex = 0;
        
        function addNextDataLine() {
            if (dataIndex < dataLines.length) {
                const line = dataLines[dataIndex];
                const lineElement = document.createElement('div');
                lineElement.className = 'sync-typing-line success';
                lineElement.style.opacity = '0';
                lineElement.textContent = line.text;
                typingContent.appendChild(lineElement);
                
                setTimeout(() => {
                    lineElement.style.opacity = '1';
                }, 50);
                
                // Scroll otomatis
                typingContent.scrollTop = typingContent.scrollHeight;
                
                // Update progress
                const progress = 50 + ((dataIndex + 1) / dataLines.length) * 30;
                updateProgressBar(progress);
                
                dataIndex++;
                
                // Line berikutnya setelah delay singkat
                setTimeout(addNextDataLine, line.delay || 150);
            } else {
                // Selesai semua data
                updateProgressBar(90);
                updateSyncStatus('Data berhasil diambil!');
                
                // Tambahkan line selesai
                setTimeout(() => {
                    const completeLine = document.createElement('div');
                    completeLine.className = 'sync-typing-line success';
                    completeLine.innerHTML = '✅ Selesai! Data siap digunakan.';
                    typingContent.appendChild(completeLine);
                    typingContent.scrollTop = typingContent.scrollHeight;
                    
                    updateProgressBar(100);
                    updateSyncStatus('✅ Berhasil!');
                }, 300);
            }
        }
        
        // Mulai menambahkan data lines
        addNextDataLine();
    }
    
    function completeLoadingModal(success = true) {
        if (!modal) return;
        
        // Update progress bar ke 100%
        updateProgressBar(100);
        
        if (success) {
            updateSyncStatus('✅ Selesai!');
        } else {
            updateSyncStatus('❌ Gagal memuat data');
        }
        
        // Tutup modal setelah 1.5 detik
        setTimeout(() => {
            modal.classList.remove('active');
            setTimeout(() => {
                if (modal && modal.parentNode) {
                    modal.remove();
                }
                modal = null;
            }, 300);
        }, 1500);
    }

    // ==================== FUNGSI ADD CHANNEL DENGAN LOADING MODAL ====================
    async function pollSyncStatus(username, displayName) {
        const maxAttempts = 15; // Turunkan jadi 15 kali (30 detik max)
        let attempts = 0;
        let pollInterval;
    
        return new Promise((resolve) => {
            pollInterval = setInterval(async () => {
                attempts++;
                
                console.log(`🔍 Polling for @${username} (${attempts}/${maxAttempts})`);
    
                try {
                    const response = await fetch(`${API_BASE_URL}/api/chatid/username/${username}`);
    
                    if (response.ok) {
                        const data = await response.json();
                        
                        clearInterval(pollInterval);
                        
                        // Update modal dengan data real
                        if (modal) {
                            updateLoadingModalWithData(data);
                            
                            // Tunggu sebentar lalu tutup
                            setTimeout(() => {
                                completeLoadingModal(true);
                            }, 1500);
                        }
                        
                        // Tambahkan ke channels
                        const verifiedIcon = data.is_verified ? '✅' : '';
                        const typeIcon = data.chat_type === 'channel' ? '📢' : '👥';
                        const displayName = `${typeIcon} ${data.chat_title} ${verifiedIcon} (${data.chat_id})`;
                        
                        const channelData = {
                            chat_id: data.chat_id,
                            username: `@${username}`,
                            title: data.chat_title,
                            type: data.chat_type,
                            invite_link: data.invite_link,
                            admin_count: data.admin_count,
                            participants_count: data.participants_count,
                            is_verified: data.is_verified,
                            displayName: displayName
                        };
                        
                        if (!channels.some(c => c.chat_id === data.chat_id)) {
                            channels.push(channelData);
                            updateChannelsTags();
                            hapticNotification('success');
                            showToast(`✅ Data untuk @${username} berhasil diambil!`, 'success');
                        }
                        
                        resolve(true);
                        return;
                    }
                    
                    if (attempts >= maxAttempts) {
                        clearInterval(pollInterval);
                        if (modal) {
                            // Tambahkan line error
                            const typingContent = document.getElementById('typingContent');
                            if (typingContent) {
                                const errorLine = document.createElement('div');
                                errorLine.className = 'sync-typing-line';
                                errorLine.style.borderLeftColor = '#ff6b6b';
                                errorLine.innerHTML = '❌ Timeout! Silakan coba lagi.';
                                typingContent.appendChild(errorLine);
                            }
                            updateSyncStatus('❌ Gagal');
                            completeLoadingModal(false);
                        }
                        showToast(`⚠️ Timeout mengambil data untuk @${username}`, 'error');
                        resolve(false);
                    }
                    
                } catch (error) {
                    console.error('Polling error:', error);
                    if (attempts >= maxAttempts) {
                        clearInterval(pollInterval);
                        if (modal) {
                            completeLoadingModal(false);
                        }
                        showToast(`⚠️ Gagal mengambil data untuk @${username}`, 'error');
                        resolve(false);
                    }
                }
            }, 2000); // Poll setiap 2 detik
        });
    }
    
    async function addChannelFromInput() {
        let value = elements.channelInput.value.trim();
    
        if (value.endsWith(',')) {
            value = value.slice(0, -1).trim();
        }
    
        if (!value || value === '@') {
            elements.channelInput.value = '@';
            hapticNotification('error');
            return;
        }
    
        if (!value.startsWith('@')) {
            value = '@' + value;
        }
    
        const usernameRegex = /^@[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(value)) {
            hapticNotification('error');
            alert('Format username tidak valid! Hanya boleh huruf, angka, dan underscore.');
            return;
        }
    
        hapticImpact('light');
    
        const newChannels = value.split(',').map(c => c.trim()).filter(c => c && c !== '@');
    
        elements.channelInput.disabled = true;
        elements.channelInput.placeholder = 'Memvalidasi...';
    
        let validChannels = [];
        let invalidChannels = [];
        let syncStarted = false;
    
        for (const channel of newChannels) {
            let cleanChannel = channel;
            if (!cleanChannel.startsWith('@')) {
                cleanChannel = '@' + cleanChannel;
            }
    
            const cleanUsername = cleanChannel.replace('@', '');
    
            try {
                // Cek apakah data sudah ada
                let response = await fetch(`${API_BASE_URL}/api/chatid/username/${cleanUsername}`);
    
                if (response.status === 404) {
                    console.log(`📡 Data for @${cleanUsername} not found, triggering sync...`);
    
                    // Tampilkan loading modal
                    showLoadingModal(cleanUsername);
    
                    const syncResponse = await fetch(`${API_BASE_URL}/api/chatid/sync/${cleanUsername}`, {
                        method: 'POST'
                    });
    
                    if (syncResponse.status === 202) {
                        syncStarted = true;
                        invalidChannels.push(`${cleanChannel} (⏳ sync...)`);
                        
                        // Polling status - TUNGGU SAMPAI SELESAI
                        const success = await pollSyncStatus(cleanUsername, cleanChannel);
                        
                        if (success) {
                            // Data sudah ditambahkan oleh pollSyncStatus
                            console.log(`✅ Data for @${cleanUsername} loaded successfully`);
                        }
                    } else {
                        invalidChannels.push(cleanChannel);
                        if (modal) {
                            completeLoadingModal(false);
                        }
                    }
                    continue;
                }
    
                if (!response.ok) {
                    invalidChannels.push(cleanChannel);
                    continue;
                }
    
                const result = await response.json();
    
                const verifiedIcon = result.is_verified ? '✅' : '';
                const typeIcon = result.chat_type === 'channel' ? '📢' : '👥';
                const displayName = `${typeIcon} ${result.chat_title} ${verifiedIcon} (${result.chat_id})`;
    
                const channelData = {
                    chat_id: result.chat_id,
                    username: cleanChannel,
                    title: result.chat_title,
                    type: result.chat_type,
                    invite_link: result.invite_link,
                    admin_count: result.admin_count,
                    participants_count: result.participants_count,
                    is_verified: result.is_verified,
                    displayName: displayName
                };
    
                if (!channels.some(c => c.chat_id === result.chat_id)) {
                    channels.push(channelData);
                    validChannels.push(displayName);
                }
    
            } catch (error) {
                console.error('Error checking channel:', error);
                invalidChannels.push(cleanChannel);
                if (modal) {
                    completeLoadingModal(false);
                }
            }
        }
    
        elements.channelInput.disabled = false;
        elements.channelInput.placeholder = "Ketik username, tekan koma untuk menambah... (contoh: @channel1)";
    
        if (validChannels.length > 0) {
            updateChannelsTags();
            hapticNotification('success');
        }
    
        if (invalidChannels.length > 0) {
            hapticNotification('error');
    
            let message = `Channel/group tidak valid: ${invalidChannels.join(', ')}`;
            if (syncStarted) {
                message += '\n\nBeberapa channel sedang di-sync.';
            }
            // Tampilkan alert hanya jika ada channel yang benar-benar gagal
            const failedChannels = invalidChannels.filter(c => !c.includes('sync'));
            if (failedChannels.length > 0) {
                alert(message);
            }
        }
    
        elements.channelInput.value = '@';
    
        setTimeout(() => {
            elements.channelInput.setSelectionRange(1, 1);
        }, 10);
    }

    // ==================== FUNGSI TOAST NOTIFICATION ====================
    function showToast(message, type = 'info') {
        // Cek apakah sudah ada toast container
        let toastContainer = document.querySelector('.toast-container');
      
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            toastContainer.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            `;
            document.body.appendChild(toastContainer);
        }
      
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideUp 0.3s ease;
            pointer-events: auto;
        `;
        toast.textContent = message;
      
        toastContainer.appendChild(toast);
      
        // Hapus setelah 3 detik
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                toast.remove();
                if (toastContainer.children.length === 0) {
                    toastContainer.remove();
                }
            }, 300);
        }, 3000);
    }
    
    // Tambahkan CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from {
                transform: translateY(100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes fadeOut {
            to {
                opacity: 0;
                transform: translateY(100%);
            }
        }
    `;
    document.head.appendChild(style);

    function updateChannelsTags() {
      if (!elements.channelTags) return;
    
      console.log('Updating channel tags. Channels:', channels);
    
      let html = '';
      channels.forEach((channel, index) => {
        const bgColor = getRandomColor(index);
    
        if (typeof channel === 'string') {
          // Format lama
          const channelId = channel.replace('@', '');
          html += `<span class="channel-tag" data-channel-id="${channelId}">
                            <span class="prize-number" style="background: ${bgColor};">${index + 1}</span>
                            ${escapeHtml(channel)}
                            <span class="tag-remove" data-channel="${channelId}">×</span>
                        </span>`;
        } else {
          // Format baru dengan data lengkap
          const channelId = channel.chat_id;
          const typeIcon = channel.type === 'channel' ? '📢' : '👥';
          const verifiedIcon = channel.is_verified ? ' ✅' : '';
          const displayName = channel.displayName || `${typeIcon} ${channel.title}${verifiedIcon}`;
    
          html += `<span class="channel-tag" data-channel-id="${channelId}">
                            <span class="prize-number" style="background: ${bgColor};">${index + 1}</span>
                            <div class="channel-info">
                                <span class="channel-name">${displayName}</span>
                                <span class="channel-details">
                                    <span class="channel-id">${escapeHtml(channelId)}</span>
                                    ${channel.participants_count ? `<span class="channel-members">👥 ${channel.participants_count}</span>` : ''}
                                </span>
                            </div>
                            <span class="tag-remove" data-channel="${channelId}">×</span>
                        </span>`;
        }
      });
    
      elements.channelTags.innerHTML = html;
    
      // Debug: cek apakah tombol remove terpasang dengan benar
      const removeButtons = elements.channelTags.querySelectorAll('.tag-remove');
      console.log(`Added ${removeButtons.length} remove buttons`);
    
      setTimeout(() => {
        const scrollContainer = document.querySelector('.channel-tags-scroll');
        if (scrollContainer) {
          scrollContainer.scrollLeft = scrollContainer.scrollWidth;
        }
      }, 50);
    }

    function removeChannel(channelId) {
      console.log('🗑️ Removing channel:', channelId);
      console.log('Current channels before removal:', channels);
    
      // Simpan panjang array sebelum filtering
      const beforeLength = channels.length;
    
      // Hapus channel dari array
      channels = channels.filter(channel => {
        if (typeof channel === 'string') {
          return channel !== channelId;
        } else {
          // Untuk channel object, bandingkan chat_id (sebagai number atau string)
          const channelIdStr = String(channelId);
          const chatIdStr = String(channel.chat_id);
          const usernameStr = channel.username || '';
    
          return chatIdStr !== channelIdStr && usernameStr !== channelId && usernameStr !== `@${channelIdStr}`;
        }
      });
    
      console.log('Channels after removal:', channels);
      console.log(`Removed ${beforeLength - channels.length} channel(s)`);
    
      // Update tampilan tags
      updateChannelsTags();
    
      // Haptic feedback
      hapticNotification('success');
    }

    // ==================== FUNGSI INIT ====================
    function init() {
        console.log('🚀 Initializing create giveaway form...');
      
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.expand();
            tg.ready();
            telegramUser = tg.initDataUnsafe?.user;
        }
      
        // Load links dari localStorage dulu
        loadSavedLinks();
      
        // Restore form state (dari sessionStorage)
        const restored = restoreFormState();
      
        // Setup foldable sections - SEMUA TERTUTUP AWALNYA
        setupFoldableSections();
      
        setupLinkManager();
        setupDurationManager();
        setupEventListeners();
      
        if (!restored) {
            durationDays = 10;
            durationHours = 2;
            durationMinutes = 30;
            durationSeconds = 0;
      
            if (elements.daysDisplay) elements.daysDisplay.textContent = durationDays;
            if (elements.hoursDisplay) elements.hoursDisplay.textContent = durationHours;
            if (elements.minutesDisplay) elements.minutesDisplay.textContent = durationMinutes;
            if (elements.secondsDisplay) elements.secondsDisplay.textContent = durationSeconds;
      
            updateDurationDisplay();
        }
      
        updateSelectedTags();
        updateChannelsTags();
        initSelectedOptions();
      
        // Listen for messages from link manager
        window.addEventListener('message', (event) => {
            console.log('📨 Received message:', event.data);
            if (event.data && event.data.type === 'linksUpdated') {
                savedLinks = event.data.links || [];
                saveLinksToStorage();
                updateLinkDisplay();
                hapticNotification('success');
            }
        });
      
        setTimeout(() => {
            if (elements.loading) elements.loading.style.display = 'none';
            if (elements.formContent) elements.formContent.style.display = 'block';
        }, 500);
    }

    // ==================== START ====================
    init();
})();
