apakah sudah benar?

/* ------------------------------------------------------------------
   FORM CONTAINER
   ------------------------------------------------------------------ */
.form-container {
    background: rgba(15, 25, 40, 0.2);
    backdrop-filter: blur(20px) saturate(200%);
    -webkit-backdrop-filter: blur(20px) saturate(200%);
    border: 1.5px solid rgba(0, 170, 255, 0.25);
    border-radius: 28px;
    padding: 24px;
    box-shadow: 
        0 20px 40px -10px rgba(0, 0, 0, 0.4),
        inset 0 1px 2px rgba(255, 255, 255, 0.15),
        inset 0 -2px 2px rgba(0, 0, 0, 0.2);
    position: relative;
    overflow: hidden;
    margin-top: 8px;
}

/* Efek glossy */
.form-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 60%;
    background: linear-gradient(to bottom, 
        rgba(255, 255, 255, 0.15) 0%, 
        rgba(255, 255, 255, 0.05) 40%, 
        transparent 100%);
    border-radius: 28px 28px 50% 50%;
    pointer-events: none;
    z-index: 1;
}

/* Efek border glow */
.form-container::after {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: 30px;
    padding: 2px;
    background: linear-gradient(135deg, 
        rgba(0, 170, 255, 0.5), 
        rgba(150, 100, 255, 0.3), 
        rgba(0, 170, 255, 0.5));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0.6;
    pointer-events: none;
    z-index: 1;
}

/* Form Content */
.form-content {
    position: relative;
    z-index: 5;
}

/* ------------------------------------------------------------------
   FORM HEADER
   ------------------------------------------------------------------ */
.form-header {
    text-align: center;
    margin-bottom: 28px;
    position: relative;
}

.form-title {
    color: var(--text-primary);
    font-size: 26px;
    font-weight: 700;
    margin-bottom: 8px;
    background: linear-gradient(135deg, #ffffff, #aaddff, #88ccff);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 2px 15px rgba(0, 136, 255, 0.3);
    letter-spacing: -0.5px;
    animation: titleGlow 3s ease infinite;
}

@keyframes titleGlow {
    0%, 100% { text-shadow: 0 2px 15px rgba(0, 136, 255, 0.3); }
    50% { text-shadow: 0 5px 25px rgba(0, 136, 255, 0.6); }
}

.form-subtitle {
    color: var(--text-tertiary);
    font-size: 14px;
    font-weight: 400;
    letter-spacing: 0.3px;
}

/* ------------------------------------------------------------------
   FORM GROUPS
   ------------------------------------------------------------------ */
.form-group {
    margin-bottom: 24px;
    position: relative;
}

.form-label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-secondary);
    letter-spacing: 0.3px;
}

.label-text {
    background: linear-gradient(135deg, #fff, #b0e0ff);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.label-required {
    color: #ff6b6b;
    font-size: 16px;
    animation: pulse 1.5s ease infinite;
}

.label-optional {
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 400;
    margin-left: 4px;
}

/* ------------------------------------------------------------------
   INPUT FIELDS - SAMA PERSIS DENGAN REQUIREMENTS
   ------------------------------------------------------------------ */
.textarea-wrapper {
  position: relative;
  width: 100%;
}

.form-textarea {
  width: 100%;
  padding: 10px 16px 10px 40px;
  background: rgba(10, 20, 30, 0.3);
  border: 1.5px solid rgba(0, 170, 255, 0.15);
  border-radius: 20px;
  color: var(--text-primary);
  font-size: 14px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all var(--transition-normal);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.1);
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  resize: vertical;
  min-height: 40px;
  line-height: 1.4;
  max-height: 100px;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--primary-blue);
  border-bottom-color: var(--primary-blue);
  box-shadow:
    0 0 0 3px rgba(0, 136, 255, 0.2),
    inset 0 2px 4px rgba(0, 0, 0, 0.2);
  background: rgba(15, 25, 40, 0.4);
}

.form-textarea::placeholder {
  color: rgba(255, 255, 255, 0.2);
  font-style: italic;
  font-size: 12px;
}

.textarea-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: var(--primary-blue);
  opacity: 0.7;
  transition: all var(--transition-normal);
  filter: drop-shadow(0 0 8px rgba(0, 136, 255, 0.3));
  pointer-events: none;
}

.form-textarea:focus+.textarea-icon {
  opacity: 1;
  transform: translateY(-50%) scale(1.1);
  filter: drop-shadow(0 0 12px rgba(0, 136, 255, 0.6));
}

.form-input:focus + .input-icon,
.form-textarea:focus + .textarea-icon {
    opacity: 1;
    transform: translateY(-50%) scale(1.1);
    filter: drop-shadow(0 0 12px rgba(0, 136, 255, 0.6));
}

.form-textarea:focus + .textarea-icon {
    transform: scale(1.1);
}

.input-helper {
    margin-top: 8px;
    font-size: 12px;
    color: var(--text-muted);
    padding-left: 16px;
    letter-spacing: 0.2px;
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
}

/* ------------------------------------------------------------------
   CHANNEL/GROUP INPUT - SAMA PERSIS DENGAN PRIZE
   ------------------------------------------------------------------ */
.channel-input-container {
  background: rgba(10, 20, 30, 0.3);
  border: 1.5px solid rgba(0, 170, 255, 0.15);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all var(--transition-normal);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.channel-input-container:focus-within {
  border-color: var(--primary-blue);
  box-shadow:
    0 0 0 3px rgba(0, 136, 255, 0.2),
    inset 0 2px 4px rgba(0, 0, 0, 0.2);
  background: rgba(15, 25, 40, 0.4);
}

.channel-tags-wrapper {
  width: 100%;
  padding: 12px 16px 4px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.channel-tags-scroll {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  gap: 8px;
  padding-bottom: 8px;
  scrollbar-width: thin;
  scrollbar-color: var(--primary-blue) rgba(255, 255, 255, 0.05);
  -webkit-overflow-scrolling: touch;
}

.channel-tags-scroll::-webkit-scrollbar {
  height: 4px;
}

.channel-tags-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.channel-tags-scroll::-webkit-scrollbar-thumb {
  background: var(--primary-blue);
  border-radius: 4px;
}

/* Update style channel tag */
.channel-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 8px;
  background: rgba(0, 136, 255, 0.15);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(0, 136, 255, 0.3);
  border-radius: 30px;
  color: white;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  animation: tagAppear 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 136, 255, 0.2);
  transition: all 0.2s ease;
}

.channel-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.3;
}

.channel-name {
  font-size: 13px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  gap: 4px;
}

.channel-details {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
}

.channel-id {
  font-family: monospace;
  background: rgba(0, 0, 0, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
}

.channel-members {
  display: flex;
  align-items: center;
  gap: 2px;
}

.channel-tag:hover {
  background: rgba(0, 136, 255, 0.25);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 136, 255, 0.3);
}

.channel-tag .tag-remove {
  cursor: pointer;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  font-size: 14px;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.8);
  margin-left: 4px;
  flex-shrink: 0;
}

.channel-tag .tag-remove:hover {
  background: rgba(255, 107, 107, 0.8);
  transform: rotate(90deg) scale(1.1);
  color: white;
}

.channel-input-wrapper {
  position: relative;
  width: 100%;
  padding: 8px 16px 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.channel-input-field {
  width: 100%;
  padding: 10px 16px 10px 40px;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s ease;
}

.channel-input-field:focus {
  border-bottom-color: var(--primary-blue);
}

.channel-input-field::placeholder {
  color: rgba(255, 255, 255, 0.3);
  font-style: italic;
}

.channel-input-icon {
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: var(--primary-blue);
  opacity: 0.7;
  pointer-events: none;
  transition: all 0.2s ease;
}

.channel-input-field:focus+.channel-input-icon {
  opacity: 1;
  transform: translateY(-50%) scale(1.1);
}

.channel-hint {
  padding: 0 16px 12px 16px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  font-style: italic;
  border-top: 1px solid rgba(255, 255, 255, 0.02);
}

/* ------------------------------------------------------------------
   PRIZE INPUT CONTAINER - DENGAN BUBBLE DI DALAM
   ------------------------------------------------------------------ */
.prize-input-container {
    background: rgba(10, 20, 30, 0.3);
    border: 1.5px solid rgba(0, 170, 255, 0.15);
    border-radius: 20px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    transition: all var(--transition-normal);
    box-shadow: 
        inset 0 2px 4px rgba(0, 0, 0, 0.2),
        0 4px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.prize-input-container:focus-within {
    border-color: var(--primary-blue);
    box-shadow: 
        0 0 0 3px rgba(0, 136, 255, 0.2),
        inset 0 2px 4px rgba(0, 0, 0, 0.2);
    background: rgba(15, 25, 40, 0.4);
}

.prize-input-container:hover {
    border-color: rgba(0, 170, 255, 0.3);
}

/* Wrapper untuk tags dengan scroll horizontal */
.prize-tags-wrapper {
    width: 100%;
    padding: 12px 16px 4px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.prize-tags-scroll {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    gap: 8px;
    padding-bottom: 8px;
    scrollbar-width: thin;
    scrollbar-color: var(--primary-blue) rgba(255, 255, 255, 0.05);
    -webkit-overflow-scrolling: touch;
}

.prize-tags-scroll::-webkit-scrollbar {
    height: 4px;
}

.prize-tags-scroll::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
}

.prize-tags-scroll::-webkit-scrollbar-thumb {
    background: var(--primary-blue);
    border-radius: 4px;
}

.prize-tags-scroll::-webkit-scrollbar-thumb:hover {
    background: var(--primary-blue-light);
}

/* Nomor urut pada prize tag - RANDOM VIA JS */
.prize-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 600;
  color: white;
  margin-right: 4px;
  padding: 0 2px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

/* Efek hover */
.prize-tag:hover .prize-number {
  transform: scale(1.1);
  filter: brightness(1.2);
}

/* Sesuaikan padding prize tag untuk mengakomodasi nomor */
.prize-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px 4px 6px; /* Kurangi padding kiri karena sudah ada nomor */
    background: rgba(0, 136, 255, 0.2);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border: 1px solid rgba(0, 136, 255, 0.4);
    border-radius: 30px;
    color: white;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    animation: tagAppear 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 136, 255, 0.2);
    transition: all 0.2s ease;
}

.prize-tag:hover {
    background: rgba(0, 136, 255, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 136, 255, 0.3);
}

.tag-remove {
    cursor: pointer;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    font-size: 14px;
    transition: all 0.2s ease;
    color: rgba(255, 255, 255, 0.8);
}

.tag-remove:hover {
    background: rgba(255, 107, 107, 0.8);
    transform: rotate(90deg) scale(1.1);
    color: white;
}

/* ------------------------------------------------------------------
   PRIZE INPUT CONTAINER - DENGAN GARIS BAWAH
   ------------------------------------------------------------------ */
.prize-input-wrapper {
  position: relative;
  width: 100%;
  padding: 8px 16px 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.prize-input-field {
  width: 100%;
  padding: 10px 16px 10px 40px;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s ease;
}

.prize-input-field:focus {
  border-bottom-color: var(--primary-blue);
}

.prize-input-field::placeholder {
  color: rgba(255, 255, 255, 0.3);
  font-style: italic;
}

.prize-input-icon {
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: var(--primary-blue);
  opacity: 0.7;
  pointer-events: none;
  transition: all 0.2s ease;
}

.prize-input-field:focus+.prize-input-icon {
  opacity: 1;
  transform: translateY(-50%) scale(1.1);
}

/* Hapus style lama */
.prizes-tags {
    display: none; /* Menyembunyikan yang lama */
}

/* Animasi untuk tag baru */
@keyframes tagAppear {
    from {
        opacity: 0;
        transform: scale(0.8) translateX(-10px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateX(0);
    }
}

/* ------------------------------------------------------------------
   REQUIREMENTS CONTAINER - Dengan border dan tombol Select FULL
   ------------------------------------------------------------------ */
.requirements-container {
    display: flex;
    align-items: center;
    background: rgba(10, 20, 30, 0.3);
    border: 1.5px solid rgba(0, 170, 255, 0.15);
    border-radius: 20px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    transition: all var(--transition-normal);
    box-shadow: 
        inset 0 2px 4px rgba(0, 0, 0, 0.2),
        0 4px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    min-height: 56px;
    width: 100%;
    position: relative;
}

.requirements-container:focus-within {
    border-color: var(--primary-blue);
    box-shadow: 
        0 0 0 3px rgba(0, 136, 255, 0.2),
        inset 0 2px 4px rgba(0, 0, 0, 0.2);
    background: rgba(15, 25, 40, 0.4);
}

/* Border untuk syarat terpilih (rata kiri) - FULL WIDTH */
.selected-requirements {
    flex: 1;
    padding: 10px 100px 10px 12px; /* Memberi ruang untuk tombol select di kanan */
    min-width: 0;
    width: 100%;
}

.selected-tags-scroll {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    gap: 8px;
    padding-bottom: 4px;
    scrollbar-width: thin;
    scrollbar-color: var(--primary-blue) rgba(255, 255, 255, 0.05);
    -webkit-overflow-scrolling: touch;
}

.selected-tags-scroll::-webkit-scrollbar {
    height: 3px;
}

.selected-tags-scroll::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
}

.selected-tags-scroll::-webkit-scrollbar-thumb {
    background: var(--primary-blue);
    border-radius: 3px;
}

/* Tag syarat terpilih */
.selected-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: rgba(0, 136, 255, 0.2);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border: 1px solid rgba(0, 136, 255, 0.4);
    border-radius: 30px;
    color: white;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    animation: tagAppear 0.3s ease;
}

.selected-tag .tag-remove {
    cursor: pointer;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    font-size: 12px;
    transition: all 0.2s ease;
    color: rgba(255, 255, 255, 0.8);
}

.selected-tag .tag-remove:hover {
    background: rgba(255, 107, 107, 0.8);
    transform: rotate(90deg);
    color: white;
}

/* Tombol SELECT - FULL MEMENUHI BORDER KANAN */
.select-btn {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 24px;
    background: rgba(0, 136, 255, 0.2);
    border: none;
    border-left: 1.5px solid rgba(0, 170, 255, 0.3);
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    white-space: nowrap;
    height: 100%;
    box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
}

.select-btn:hover {
    background: rgba(0, 136, 255, 0.3);
    border-left-color: var(--primary-blue);
    padding-right: 28px;
}

.select-btn:active {
    transform: scale(0.98);
}

.select-icon {
    font-size: 12px;
    transition: transform 0.2s ease;
}

.select-btn:hover .select-icon {
    transform: translateY(2px);
}

/* Panel Select */
.select-panel {
    margin-top: 8px;
    background: rgba(15, 25, 40, 0.4);
    backdrop-filter: blur(20px) saturate(200%);
    -webkit-backdrop-filter: blur(20px) saturate(200%);
    border: 1.5px solid rgba(0, 170, 255, 0.25);
    border-radius: 24px;
    overflow: hidden;
    animation: panelSlide 0.3s ease;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

@keyframes panelSlide {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(0, 0, 0, 0.2);
}

.panel-title {
    font-size: 16px;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg, #fff, #aaddff);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.panel-close {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
}

.panel-close:hover {
    background: rgba(255, 107, 107, 0.3);
    color: white;
    transform: rotate(90deg);
    border-color: rgba(255, 107, 107, 0.5);
}

.panel-options {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

/* Tombol option - 3D Transparan seperti tombol BATAL */
.option-btn {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 20px;
    background: rgba(30, 40, 50, 0.3);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1.5px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    color: var(--text-secondary);
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.25s ease;
    width: 100%;
    text-align: left;
    box-shadow: 
        0 8px 16px -4px rgba(0, 0, 0, 0.3),
        inset 0 1px 1px rgba(255, 255, 255, 0.1),
        inset 0 -1px 1px rgba(0, 0, 0, 0.2);
    position: relative;
    overflow: hidden;
}

/* Efek glossy di atas */
.option-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(to bottom, 
        rgba(255, 255, 255, 0.1), 
        transparent);
    border-radius: inherit;
    pointer-events: none;
}

.option-btn::after {
    content: attr(data-icon);
    font-size: 22px;
    filter: drop-shadow(0 0 8px rgba(0, 136, 255, 0.3));
}

.option-btn:hover {
    background: rgba(0, 136, 255, 0.15);
    border-color: rgba(0, 136, 255, 0.3);
    transform: translateY(-2px);
    color: white;
    box-shadow: 
        0 12px 24px -8px rgba(0, 136, 255, 0.3),
        inset 0 1px 2px rgba(255, 255, 255, 0.15);
}

.option-btn:active {
    transform: translateY(1px);
    box-shadow: 
        0 4px 8px -2px rgba(0, 0, 0, 0.3),
        inset 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* Active state untuk option yang sudah dipilih */
.option-btn.selected {
    background: rgba(0, 136, 255, 0.2);
    border-color: var(--primary-blue);
    color: white;
    box-shadow: 
        0 8px 16px rgba(0, 136, 255, 0.2),
        inset 0 1px 2px rgba(255, 255, 255, 0.15);
}

/* Hapus style lama requirements-grid */
.requirements-grid {
    display: none;
}

/* ------------------------------------------------------------------
   INFO ICON UNTUK SEMUA LABEL
   ------------------------------------------------------------------ */
.form-label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-secondary);
    letter-spacing: 0.3px;
}

.info-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: rgba(0, 136, 255, 0.15);
    border-radius: 50%;
    font-size: 12px;
    color: var(--primary-blue);
    box-shadow: 0 0 10px rgba(0, 136, 255, 0.3);
    cursor: help;
}

/* Hapus input-helper */
.input-helper {
    display: none;
}

/* ------------------------------------------------------------------
   DURASI GIVEAWAY - WHEEL PICKER FINAL (TANPA GLOW) - DIPERBAIKI
   ------------------------------------------------------------------ */
/* Style untuk border header yang baru */
.duration-border-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 8px;
}

/* Style untuk data durasi di dalam border */
.duration-value {
  color: white;
  font-size: 15px;
  font-weight: 500;
  background: linear-gradient(135deg, #fff, #aaddff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.3px;
  text-shadow: 0 2px 5px rgba(0, 136, 255, 0.2);
}

.duration-label {
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.3px;
    background: linear-gradient(135deg, #aaddff, #88ccff);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

/* Tombol jam - style seperti tombol BATAL */
.duration-add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 32px;
    background: rgba(30, 40, 50, 0.3);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1.5px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    padding: 0;
    position: relative;
    overflow: hidden;
}

/* Efek glossy */
.duration-add-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(to bottom,
        rgba(255, 255, 255, 0.15),
        transparent);
    border-radius: inherit;
    pointer-events: none;
}

.duration-add-btn:hover {
    background: rgba(40, 50, 60, 0.4);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.duration-add-btn:active {
    transform: translateY(0);
}

.duration-add-btn svg {
    width: 18px;
    height: 18px;
    color: white;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

/* Border Container untuk Durasi */
.duration-border-container {
    background: rgba(10, 20, 30, 0.3);
    border: 1.5px solid rgba(0, 170, 255, 0.15);
    border-radius: 20px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    transition: all var(--transition-normal);
    box-shadow: 
        inset 0 2px 4px rgba(0, 0, 0, 0.2),
        0 4px 12px rgba(0, 0, 0, 0.1);
    position: relative;
    min-height: 56px;
    width: 100%;
    padding: 12px 16px;
    margin-bottom: 8px;
}

.duration-border-container:focus-within {
    border-color: var(--primary-blue);
    box-shadow: 
        0 0 0 3px rgba(0, 136, 255, 0.2),
        inset 0 2px 4px rgba(0, 0, 0, 0.2);
    background: rgba(15, 25, 40, 0.4);
}

/* Tampilan durasi yang dipilih */
.duration-display {
    display: none;
}

.duration-text {
    color: white;
    font-size: 15px;
    font-weight: 500;
    background: linear-gradient(135deg, #fff, #aaddff);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: 0.3px;
    text-shadow: 0 2px 5px rgba(0, 136, 255, 0.2);
}

/* Naikin border sedikit */
.duration-settings-container {
  margin-top: 4px;
  padding-top: 4px;
  animation: fadeSlideDown 0.3s ease;
}

.duration-columns {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
  padding: 0 2px;
}

.duration-settings-header {
    display: none;
}

.duration-settings-title {
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    background: linear-gradient(135deg, #fff, #aaddff);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.duration-column {
    position: relative;
}

.duration-column-label {
    color: rgba(255, 255, 255, 0.5);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: center;
    width: 100%;
    margin-bottom: 8px;
}

.duration-value-display {
    display: none;
}

/* WHEEL SELECTOR */
.duration-selector {
    width: 100%;
    height: 100px;
    overflow-y: scroll;
    background: rgba(25, 35, 45, 0.3);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-radius: 24px;
    padding: 0;
    scrollbar-width: none;
    position: relative;
    border: 1.5px solid rgba(255, 255, 255, 0.05);
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3);
}

.duration-selector::-webkit-scrollbar {
    display: none;
}

.selector-options {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    padding: 76px 0; /* Padding untuk membuat item pertama di tengah */
    box-sizing: border-box;
}

.selector-option {
    height: 48px;
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.35);
    font-size: 20px;
    font-weight: 500;
    width: 100%;
    line-height: 48px;
    transition: all 0.1s ease;
    box-sizing: border-box;
    scroll-snap-align: center;
    scroll-snap-stop: always;
}

.selector-option.selected {
    color: white;
    font-size: 26px;
    font-weight: 700;
}

/* PERBAIKAN: HIGHLIGHT TENGAH - GARIS HALUS DENGAN POSISI YANG TEPAT */
.duration-column .duration-selector::before {
    display: none;
}

.duration-column::after {
    content: '';
    position: absolute;
    left: 8%;
    right: 8%;
    top: 60%;
    height: 48px;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.03);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    pointer-events: none;
    z-index: 20; /* LEBIH TINGGI DARI SELECTOR */
    box-shadow: none;
    /* FIXED POSITION - RELATIVE TO COLUMN */
    position: absolute;
    /* GAK IKUT SCROLL KARENA DI LUAR SELECTOR */
}

/* PERBAIKAN: Pastikan scroll behavior halus */
.duration-selector {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
}

.duration-save-btn-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.duration-save-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 24px;
  background: linear-gradient(135deg, #1e3a5f, #0a1a2f);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 30px;
  color: #e0f0ff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
  box-shadow:
    0 6px 12px -4px rgba(0, 0, 0, 0.4),
    inset 0 1px 1px rgba(255, 255, 255, 0.2),
    inset 0 -2px 2px rgba(0, 0, 0, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Efek glossy di atas */
.duration-save-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to bottom,
      rgba(255, 255, 255, 0.15),
      transparent);
  border-radius: inherit;
  pointer-events: none;
}

.duration-save-btn::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(135deg,
      rgba(100, 180, 255, 0.3),
      rgba(50, 100, 200, 0.1));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.4;
  pointer-events: none;
}

.duration-save-btn:hover {
  background: linear-gradient(135deg, #234a75, #0f2540);
  transform: translateY(-2px);
  box-shadow:
    0 10px 18px -6px rgba(0, 0, 0, 0.5),
    inset 0 1px 2px rgba(255, 255, 255, 0.2);
  color: white;
}

.duration-save-btn:active {
    transform: translateY(0);
}

.duration-save-btn:hover::after {
  opacity: 0.7;
  background: linear-gradient(135deg,
      rgba(120, 200, 255, 0.4),
      rgba(70, 130, 230, 0.2));
}

.duration-save-btn:active {
  transform: translateY(1px);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3),
    inset 0 1px 3px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, #1a3455, #0a1a2f);
}

/* Animasi */
@keyframes fadeSlideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* ------------------------------------------------------------------
   MEDIA UPLOADER
   ------------------------------------------------------------------ */
.media-uploader {
    position: relative;
    min-height: 160px;
    background: rgba(10, 20, 30, 0.2);
    border: 2px dashed rgba(0, 170, 255, 0.3);
    border-radius: 24px;
    overflow: hidden;
    transition: all var(--transition-normal);
    cursor: pointer;
}

.media-uploader:hover {
    border-color: var(--primary-blue);
    background: rgba(0, 136, 255, 0.05);
    transform: translateY(-2px);
}

.media-uploader.dragover {
    border-color: var(--primary-blue);
    background: rgba(0, 136, 255, 0.1);
    transform: scale(1.02);
}

.media-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: 10;
}

.media-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px 20px;
    text-align: center;
}

.media-icon {
    font-size: 48px;
    margin-bottom: 12px;
    filter: drop-shadow(0 0 20px rgba(0, 136, 255, 0.3));
    animation: bounce 2s ease infinite;
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

.media-text {
    color: var(--text-secondary);
    font-size: 15px;
    font-weight: 500;
    margin-bottom: 8px;
}

.media-hint {
    color: var(--text-muted);
    font-size: 12px;
}

.media-preview {
    position: relative;
    width: 100%;
    max-height: 200px;
    overflow: hidden;
    border-radius: 20px;
}

.preview-image,
.preview-video {
    width: 100%;
    max-height: 200px;
    object-fit: cover;
    display: block;
}

.media-remove {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 107, 107, 0.8);
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    transition: all var(--transition-normal);
    z-index: 20;
}

.media-remove:hover {
    background: #ff6b6b;
    transform: scale(1.1) rotate(90deg);
}

/* ------------------------------------------------------------------
   TOGGLE SWITCH
   ------------------------------------------------------------------ */
.toggle-container {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 0;
}

.toggle-switch {
    position: relative;
    display: inline-block;
    width: 64px;
    height: 32px;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(30, 40, 50, 0.5);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border: 1.5px solid rgba(255, 255, 255, 0.1);
    border-radius: 34px;
    transition: all var(--transition-normal);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 3px;
    bottom: 2px;
    background: linear-gradient(135deg, #fff, #e0e0e0);
    border-radius: 50%;
    transition: all var(--transition-normal);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

input:checked + .toggle-slider {
    background: rgba(0, 136, 255, 0.3);
    border-color: var(--primary-blue);
}

input:checked + .toggle-slider:before {
    transform: translateX(32px);
    background: linear-gradient(135deg, #4da6ff, #0088ff);
    box-shadow: 0 2px 12px rgba(0, 136, 255, 0.6);
}

.toggle-label {
    color: var(--text-secondary);
    font-size: 15px;
    font-weight: 500;
    transition: all var(--transition-normal);
}

input:checked ~ .toggle-label {
    color: var(--primary-blue);
    text-shadow: 0 0 10px rgba(0, 136, 255, 0.3);
}

/* ------------------------------------------------------------------
   FORM ACTIONS - 2 TOMBOL PER BARIS (SAMPINGAN)
   ------------------------------------------------------------------ */
.form-actions {
    display: flex;
    flex-direction: row; /* Horizontal, bukan column */
    gap: 12px;
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.btn {
    flex: 1; /* Membagi rata lebar */
    padding: 14px 20px; /* Sedikit dikurangi dari 16px */
    border: none;
    border-radius: 30px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all var(--transition-normal);
    position: relative;
    overflow: hidden;
    letter-spacing: 0.5px;
    text-align: center;
    white-space: nowrap; /* Mencegah text wrap */
}

.btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.2), transparent);
    border-radius: inherit;
    pointer-events: none;
}

.btn-primary {
    background: linear-gradient(135deg, #0088ff, #0066cc);
    color: white;
    box-shadow: 
        0 8px 20px rgba(0, 136, 255, 0.3),
        inset 0 1px 2px rgba(255, 255, 255, 0.2);
}

.btn-primary:hover {
    transform: translateY(-3px);
    box-shadow: 
        0 15px 30px rgba(0, 136, 255, 0.4),
        inset 0 1px 2px rgba(255, 255, 255, 0.3);
}

.btn-primary:active {
    transform: translateY(0);
}

.btn-secondary {
    background: rgba(30, 40, 50, 0.3);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1.5px solid rgba(255, 255, 255, 0.1);
    color: var(--text-secondary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-secondary:hover {
    background: rgba(40, 50, 60, 0.4);
    border-color: rgba(255, 255, 255, 0.2);
    color: white;
    transform: translateY(-2px);
}

.btn-secondary:active {
    transform: translateY(0);
}

.btn-loader {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-left: 8px;
}

/* Loading state for button */
.btn-primary.loading .btn-text {
    opacity: 0.7;
}

.btn-primary.loading .btn-loader {
    display: inline-block;
}

/* Success animation */
@keyframes successPop {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

.btn-primary.success {
    animation: successPop 0.3s ease;
    background: linear-gradient(135deg, #00c853, #009624);
}

/* ------------------------------------------------------------------
   ADD LINK BUTTON
   ------------------------------------------------------------------ */
.add-link-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 16px 20px;
  background: rgba(0, 136, 255, 0.1);
  border: 2px dashed rgba(0, 136, 255, 0.4);
  border-radius: 30px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  margin-bottom: 16px;
}

.add-link-btn:hover {
  background: rgba(0, 136, 255, 0.2);
  border-color: var(--primary-blue);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 136, 255, 0.2);
}

.add-link-btn .btn-icon {
  font-size: 20px;
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.2));
}

/* ------------------------------------------------------------------
   LINK MANAGER BUTTON - SEPERTI TOMBOL CREATE GIVEAWAY
   ------------------------------------------------------------------ */
.link-manager-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    padding: 14px 20px;
    background: linear-gradient(135deg, #6c5ce7, #a463f5);
    border: none;
    border-radius: 40px;
    color: white;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: all var(--transition-normal);
    box-shadow: 
        0 8px 20px rgba(108, 92, 231, 0.3),
        inset 0 1px 2px rgba(255, 255, 255, 0.2);
    position: relative;
    overflow: hidden;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 16px;
}

/* Efek glossy */
.link-manager-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(to bottom, 
        rgba(255, 255, 255, 0.3), 
        transparent);
    border-radius: inherit;
    pointer-events: none;
}

/* Efek shimmer */
.link-manager-btn::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -60%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
    );
    transform: rotate(30deg);
    animation: shimmer 3s infinite;
    pointer-events: none;
}

@keyframes shimmer {
    0% {
        transform: rotate(30deg) translateX(-100%);
    }
    100% {
        transform: rotate(30deg) translateX(100%);
    }
}

.link-manager-btn:hover {
    transform: translateY(-3px);
    box-shadow: 
        0 15px 30px rgba(108, 92, 231, 0.4),
        inset 0 1px 3px rgba(255, 255, 255, 0.3);
    background: linear-gradient(135deg, #7d6cf0, #b574ff);
}

.link-manager-btn:active {
    transform: translateY(0);
    box-shadow: 
        0 5px 15px rgba(108, 92, 231, 0.3),
        inset 0 1px 2px rgba(255, 255, 255, 0.2);
}

.link-manager-btn .btn-icon {
    font-size: 20px;
    filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.2));
    animation: icon-bounce 2s ease infinite;
}

@keyframes icon-bounce {
    0%, 100% {
        transform: translateX(0);
    }
    50% {
        transform: translateX(5px);
    }
}

.link-manager-btn .btn-text {
    flex: 1;
    text-align: center;
}

/* Sembunyikan tombol add-link-btn yang lama */
.add-link-btn {
    display: none;
}

/* ------------------------------------------------------------------
   FOLDABLE SECTIONS - SEMUA TERTUTUP AWALNYA
   ------------------------------------------------------------------ */
.foldable-section .foldable-content {
    display: none; /* SEMUA TERTUTUP default */
}

.foldable-section.expanded .foldable-content {
    display: block; /* Yang dibuka aja yang tampil */
}

.foldable-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    cursor: pointer;
    background: rgba(0, 0, 0, 0.1);
    border-bottom: 1px solid transparent;
    transition: all 0.2s ease;
}

.foldable-section.expanded .foldable-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.foldable-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-secondary);
}

.foldable-label {
    background: linear-gradient(135deg, #fff, #b0e0ff);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.foldable-btn {
    width: 32px;
    height: 32px;
    background: rgba(30, 40, 50, 0.3);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1.5px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    color: white;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.foldable-btn.rotated {
    transform: rotate(180deg); /* Panah ke atas saat expanded */
}

/* ------------------------------------------------------------------
   LINK INNER HEADER (DI DALAM BORDER)
   ------------------------------------------------------------------ */
.link-inner-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.link-inner-title {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.link-inner-controls {
  display: flex;
  align-items: center;
}

/* Hapus style link-header lama yang gak dipake */
.link-header {
  display: none;
}

/* Sesuaikan margin bottom */
.link-border-container {
    margin-bottom: 0;
}

/* ------------------------------------------------------------------
   SAVED LINKS CONTAINER (DI CREATE.HTML)
   ------------------------------------------------------------------ */
.saved-links-container {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.saved-link-preview {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: rgba(15, 25, 40, 0.3);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 170, 255, 0.2);
    border-radius: 20px;
    transition: all 0.2s ease;
}

.saved-link-preview .link-icon {
    font-size: 20px;
    color: var(--primary-blue);
}

.saved-link-preview .link-info {
    flex: 1;
    overflow: hidden;
}

.saved-link-preview .link-title {
    color: white;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.saved-link-preview .link-url {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ------------------------------------------------------------------
   LINK MANAGER PAGE STYLES
   ------------------------------------------------------------------ */
.link-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 24px;
}

.link-action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 8px;
    background: rgba(30, 40, 50, 0.3);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1.5px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.link-action-btn:hover {
    transform: translateY(-2px);
    background: rgba(40, 50, 60, 0.4);
    border-color: rgba(255, 255, 255, 0.2);
}

.link-action-btn.delete:hover {
    background: rgba(255, 107, 107, 0.2);
    border-color: rgba(255, 107, 107, 0.4);
}

.link-action-btn.save:hover {
    background: rgba(0, 200, 83, 0.2);
    border-color: rgba(0, 200, 83, 0.4);
}

.link-action-btn .btn-icon {
    font-size: 18px;
}

/* Saved Links Full (di link manager) */
.saved-links-full {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 400px;
    overflow-y: auto;
    padding-right: 4px;
}

.saved-links-full::-webkit-scrollbar {
    width: 4px;
}

.saved-links-full::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
}

.saved-links-full::-webkit-scrollbar-thumb {
    background: var(--primary-blue);
    border-radius: 4px;
}

/* Link Item */
.link-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: rgba(15, 25, 40, 0.3);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1.5px solid rgba(255, 255, 255, 0.05);
    border-radius: 24px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.link-item:hover {
    background: rgba(20, 30, 50, 0.4);
    border-color: rgba(0, 136, 255, 0.3);
    transform: translateY(-2px);
}

.link-item.selected {
    background: rgba(0, 136, 255, 0.15);
    border-color: var(--primary-blue);
    box-shadow: 0 8px 20px rgba(0, 136, 255, 0.2);
}

.link-info {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
    overflow: hidden;
}

.link-icon {
    font-size: 24px;
    filter: drop-shadow(0 0 8px rgba(0, 136, 255, 0.3));
}

.link-details {
    flex: 1;
    overflow: hidden;
}

.link-title {
    color: white;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.link-url {
    color: rgba(255, 255, 255, 0.5);
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.link-selector {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: white;
    transition: all 0.2s ease;
    margin-left: 12px;
    flex-shrink: 0;
}

.link-selector.selected {
    background: #ff6b6b;
    border-color: #ff6b6b;
    box-shadow: 0 0 15px rgba(255, 107, 107, 0.5);
}

/* Empty state */
.empty-links {
    text-align: center;
    padding: 40px 20px;
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
    filter: drop-shadow(0 0 20px rgba(0, 136, 255, 0.3));
}

.empty-text {
    color: white;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
}

.empty-subtext {
    color: rgba(255, 255, 255, 0.4);
    font-size: 14px;
}

/* ------------------------------------------------------------------
   MODAL STYLES
   ------------------------------------------------------------------ */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
}

.modal-container {
    width: 90%;
    max-width: 400px;
    background: rgba(15, 25, 40, 0.4);
    backdrop-filter: blur(20px) saturate(200%);
    -webkit-backdrop-filter: blur(20px) saturate(200%);
    border: 1.5px solid rgba(0, 170, 255, 0.3);
    border-radius: 32px;
    overflow: hidden;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.3s ease;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.modal-title {
    color: white;
    font-size: 20px;
    font-weight: 700;
    background: linear-gradient(135deg, #fff, #aaddff);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.modal-close {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.modal-close:hover {
    background: rgba(255, 107, 107, 0.3);
    color: white;
    transform: rotate(90deg);
}

.modal-body {
    padding: 24px;
}

.modal-footer {
    display: flex;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.modal-footer .btn {
    flex: 1;
}

/* Input helper di modal */
.modal-body .input-helper {
    display: block;
    color: rgba(255, 255, 255, 0.3);
    font-size: 12px;
    margin-top: 8px;
    padding-left: 16px;
}

/* ------------------------------------------------------------------
   TAUTAN/LINK - DESAIN BARU (REVISI FINAL)
   ------------------------------------------------------------------ */
.link-header .form-label {
    margin-bottom: 0;
}

.link-controls {
    display: flex;
    align-items: center;
}

/* Grup untuk badge dan tombol + dalam satu border */
.link-add-group {
    display: flex;
    align-items: center;
    background: rgba(30, 40, 50, 0.3);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1.5px solid rgba(255, 255, 255, 0.1);
    border-radius: 30px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Badge counter dalam border */
.link-count-badge {
    font-size: 14px;
    font-weight: 600;
    color: white;
    padding: 6px 12px;
    background: transparent;
    border-right: 1.5px solid rgba(255, 255, 255, 0.1);
}

/* Tombol + dalam border yang sama */
.link-add-btn {
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    color: white;
    font-size: 20px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0;
    line-height: 1;
}

.link-add-btn:hover {
    background: rgba(0, 136, 255, 0.2);
    color: var(--primary-blue);
}

.link-add-btn:active {
    transform: scale(0.95);
}

/* Border Container untuk Link */
.link-border-container {
    background: rgba(10, 20, 30, 0.3);
    border: 1.5px solid rgba(0, 170, 255, 0.15);
    border-radius: 20px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    transition: all var(--transition-normal);
    box-shadow: 
        inset 0 2px 4px rgba(0, 0, 0, 0.2),
        0 4px 12px rgba(0, 0, 0, 0.1);
    position: relative;
    min-height: 56px;
    width: 100%;
    padding: 12px;
    margin-bottom: 24px; /* Ditingkatkan untuk memberi ruang pada tombol expand */
}

.link-border-container:focus-within {
    border-color: var(--primary-blue);
    box-shadow: 
        0 0 0 3px rgba(0, 136, 255, 0.2),
        inset 0 2px 4px rgba(0, 0, 0, 0.2);
    background: rgba(15, 25, 40, 0.4);
}

/* Area Preview untuk link (saat collapsed) */
.link-preview-area {
    min-height: 40px;
    display: flex;
    align-items: center;
    width: 100%;
}

/* Single link preview item */
.link-preview-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(0, 136, 255, 0.15);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border: 1px solid rgba(0, 136, 255, 0.3);
    border-radius: 30px;
    color: white;
    font-size: 13px;
    font-weight: 500;
    width: 100%;
    animation: tagAppear 0.3s ease;
}

.link-preview-icon {
    font-size: 16px;
    color: var(--primary-blue);
}

.link-preview-content {
    flex: 1;
    overflow: hidden;
}

.link-preview-title {
    font-size: 13px;
    font-weight: 600;
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.link-preview-url {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.link-preview-remove {
    cursor: pointer;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    font-size: 12px;
    transition: all 0.2s ease;
    color: rgba(255, 255, 255, 0.7);
    flex-shrink: 0;
}

.link-preview-remove:hover {
    background: rgba(255, 107, 107, 0.8);
    transform: rotate(90deg);
    color: white;
}

/* Tombol Expand/Collapse - MENYATU DENGAN BORDER (VERSI STABIL) */
.link-expand-btn {
    position: absolute;
    bottom: -28px;
    right: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 70px;
    height: 28px;
    padding: 0 16px;
    
    /* Warna dan efek sama persis dengan border */
    background: rgba(10, 20, 30, 0.3);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    
    /* Border yang menyatu dengan border container */
    border: 1.5px solid rgba(0, 170, 255, 0.15);
    border-top: none;
    
    /* Hanya border kiri, kanan, bawah yang terlihat */
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    
    color: white;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; /* Hanya properti tertentu yang di-transisi */
    z-index: 5;
    letter-spacing: 1px;
    
    /* Efek glossy */
    box-shadow: 
        inset 0 -1px 1px rgba(0, 0, 0, 0.2),
        0 4px 8px rgba(0, 0, 0, 0.2);
    
    /* PENTING: Matikan transform untuk menghindari pergeseran */
    transform: none !important;
}

/* Efek glossy di bagian dalam */
.link-expand-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 40%;
    background: linear-gradient(to bottom, 
        rgba(255, 255, 255, 0.1), 
        transparent);
    border-radius: inherit;
    pointer-events: none;
}

/* Efek border glow yang menyatu */
.link-expand-btn::after {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    padding: 2px;
    background: linear-gradient(135deg, 
        rgba(0, 170, 255, 0.3), 
        transparent);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0.4;
    pointer-events: none;
    transition: opacity 0.2s ease;
}

/* Hover - tanpa transform */
.link-expand-btn:hover {
    background: rgba(20, 30, 45, 0.4);
    border-color: var(--primary-blue);
    box-shadow: 
        inset 0 -2px 2px rgba(0, 0, 0, 0.2),
        0 6px 12px rgba(0, 136, 255, 0.2);
}

.link-expand-btn:hover::after {
    opacity: 0.8;
}

/* Active - tanpa transform */
.link-expand-btn:active {
    background: rgba(0, 136, 255, 0.2);
    box-shadow: 
        inset 0 1px 2px rgba(0, 0, 0, 0.3),
        0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Saat expanded (▲) */
.link-expand-btn.expanded {
    background: rgba(0, 136, 255, 0.15);
    border-color: var(--primary-blue);
}

/* Expanded hover */
.link-expand-btn.expanded:hover {
    background: rgba(0, 136, 255, 0.25);
}

/* Sesuaikan margin bottom container */
.link-border-container {
    background: rgba(10, 20, 30, 0.3);
    border: 1.5px solid rgba(0, 170, 255, 0.15);
    border-radius: 20px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    transition: all var(--transition-normal);
    box-shadow: 
        inset 0 2px 4px rgba(0, 0, 0, 0.2),
        0 4px 12px rgba(0, 0, 0, 0.1);
    position: relative;
    min-height: 56px;
    width: 100%;
    padding: 12px;
    margin-bottom: 30px; /* Sesuaikan dengan posisi tombol */
}

.link-expand-btn.expanded:hover {
    transform: translateX(-50%) translateY(-2px);
}

/* Container untuk semua Link Tags (saat expand) */
.link-tags-container {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    animation: fadeSlideDown 0.3s ease;
}

@keyframes fadeSlideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Scroll area untuk link tags */
.link-tags-scroll {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 250px;
    overflow-y: auto;
    padding-right: 4px;
}

.link-tags-scroll::-webkit-scrollbar {
    width: 4px;
}

.link-tags-scroll::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
}

.link-tags-scroll::-webkit-scrollbar-thumb {
    background: var(--primary-blue);
    border-radius: 4px;
}

/* Link Tag Item (di mode expand) */
.link-tag-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: rgba(0, 136, 255, 0.1);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border: 1px solid rgba(0, 136, 255, 0.3);
    border-radius: 30px;
    color: white;
    font-size: 14px;
    font-weight: 500;
    animation: tagAppear 0.3s ease;
    transition: all 0.2s ease;
}

.link-tag-item:hover {
    background: rgba(0, 136, 255, 0.2);
    transform: translateX(2px);
}

.link-tag-icon {
    font-size: 18px;
    color: var(--primary-blue);
    filter: drop-shadow(0 0 5px rgba(0, 136, 255, 0.5));
}

.link-tag-content {
    flex: 1;
    overflow: hidden;
}

.link-tag-title {
    font-size: 14px;
    font-weight: 600;
    color: white;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.link-tag-url {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.link-tag-remove {
    cursor: pointer;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    font-size: 14px;
    transition: all 0.2s ease;
    color: rgba(255, 255, 255, 0.7);
    flex-shrink: 0;
}

.link-tag-remove:hover {
    background: rgba(255, 107, 107, 0.8);
    transform: rotate(90deg) scale(1.1);
    color: white;
}

/* Empty State */
.link-empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    color: rgba(255, 255, 255, 0.3);
    font-size: 13px;
    font-style: italic;
}

.link-empty-text {
    background: rgba(255, 255, 255, 0.03);
    padding: 6px 16px;
    border-radius: 30px;
}

/* Sembunyikan container lama */
.saved-links-container {
    display: none;
}

/* ------------------------------------------------------------------
   FOLDABLE SECTIONS - DESAIN 3D GLOSSY (SEPERTI TOMBOL BATAL)
   ------------------------------------------------------------------ */
.foldable-section {
  margin-bottom: 16px;
  background: rgba(30, 40, 50, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  transition: all var(--transition-normal);
  box-shadow:
    0 8px 16px -4px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.1),
    inset 0 -1px 1px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

/* Efek glossy di atas */
.foldable-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to bottom,
      rgba(255, 255, 255, 0.1),
      transparent);
  border-radius: inherit;
  pointer-events: none;
  z-index: 1;
}

/* Efek border glow halus */
.foldable-section::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.2),
      rgba(255, 255, 255, 0.05));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.3;
  pointer-events: none;
  z-index: 1;
}

.foldable-section:focus-within {
  border-color: var(--primary-blue);
  box-shadow:
    0 8px 16px -4px rgba(0, 136, 255, 0.2),
    inset 0 1px 1px rgba(255, 255, 255, 0.15);
}

.foldable-section:focus-within::after {
  opacity: 0.6;
  background: linear-gradient(135deg,
      rgba(0, 170, 255, 0.3),
      rgba(100, 100, 255, 0.1));
}

.foldable-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;
  position: relative;
  z-index: 5;
}

.foldable-section.expanded .foldable-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.foldable-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-secondary);
  position: relative;
  z-index: 5;
}

.foldable-label {
  background: linear-gradient(135deg, #fff, #b0e0ff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.foldable-btn {
  width: 32px;
  height: 32px;
  background: rgba(30, 40, 50, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow:
    0 4px 8px -2px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  z-index: 5;
}

.foldable-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to bottom,
      rgba(255, 255, 255, 0.2),
      transparent);
  border-radius: inherit;
  pointer-events: none;
}

.foldable-btn:hover {
  background: rgba(40, 50, 60, 0.4);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 8px 12px -4px rgba(0, 0, 0, 0.4);
}

.foldable-btn.rotated {
  transform: rotate(180deg);
}

.foldable-content {
  padding: 16px;
  transition: all 0.3s ease;
  position: relative;
  z-index: 5;
}

/* Hapus border container yang lama karena udah pake foldable-section */
.prize-input-container,
.requirements-container,
.link-border-container,
.duration-border-container,
.media-uploader,
.toggle-container {
  margin-bottom: 0;
}

/* Sesuaikan padding untuk konten tertentu */
.duration-border-container {
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  margin-bottom: 0;
}

.duration-border-container:focus-within {
  box-shadow: none;
}

/* Header khusus untuk link */
.foldable-header .link-controls {
  margin-left: auto;
}

/* ------------------------------------------------------------------
   SYNC LOADING MODAL DENGAN TYPING EFFECT
   ------------------------------------------------------------------ */
.sync-loading-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(15px) saturate(180%);
    -webkit-backdrop-filter: blur(15px) saturate(180%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20000;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
}

.sync-loading-modal.active {
    opacity: 1;
    pointer-events: auto;
}

.sync-loading-content {
    width: 90%;
    max-width: 380px;
    background: rgba(20, 30, 45, 0.4);
    backdrop-filter: blur(20px) saturate(200%);
    -webkit-backdrop-filter: blur(20px) saturate(200%);
    border: 1.5px solid rgba(0, 170, 255, 0.25);
    border-radius: 32px;
    overflow: hidden;
    box-shadow: 
        0 30px 60px rgba(0, 0, 0, 0.5),
        inset 0 1px 2px rgba(255, 255, 255, 0.1),
        inset 0 -2px 2px rgba(0, 0, 0, 0.2);
    transform: scale(0.9);
    transition: transform 0.3s ease;
}

.sync-loading-modal.active .sync-loading-content {
    transform: scale(1);
}

.sync-loading-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    background: linear-gradient(to bottom, rgba(0, 136, 255, 0.15), transparent);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    position: relative;
    overflow: hidden;
}

.sync-loading-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.15), transparent);
    pointer-events: none;
}

.sync-loading-title {
    font-size: 18px;
    font-weight: 700;
    background: linear-gradient(135deg, #fff, #aaddff, #88ccff);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.3px;
    text-shadow: 0 2px 10px rgba(0, 136, 255, 0.3);
    animation: titlePulse 2s ease infinite;
}

@keyframes titlePulse {
    0%, 100% { text-shadow: 0 2px 10px rgba(0, 136, 255, 0.3); }
    50% { text-shadow: 0 5px 20px rgba(0, 136, 255, 0.6); }
}

.sync-loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-top-color: var(--primary-blue);
    border-right-color: var(--primary-blue-light);
    border-radius: 50%;
    animation: spin 1s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
    box-shadow: 0 0 15px rgba(0, 136, 255, 0.3);
}

.sync-loading-body {
    padding: 24px;
}

.sync-typing-container {
    background: rgba(10, 20, 30, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    padding: 16px;
    margin-bottom: 20px;
    min-height: 180px;
    max-height: 250px;
    overflow-y: auto;
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3);
}

.sync-typing-container::-webkit-scrollbar {
    width: 4px;
}

.sync-typing-container::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 4px;
}

.sync-typing-container::-webkit-scrollbar-thumb {
    background: var(--primary-blue);
    border-radius: 4px;
}

.sync-typing-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-family: 'SF Mono', 'Fira Code', monospace;
}

.sync-typing-line {
    color: rgba(255, 255, 255, 0.9);
    font-size: 13px;
    line-height: 1.5;
    padding: 4px 8px;
    border-left: 2px solid var(--primary-blue);
    background: linear-gradient(90deg, rgba(0, 136, 255, 0.1), transparent);
    transition: opacity 0.3s ease;
    word-break: break-word;
    animation: lineGlow 2s ease infinite;
}

@keyframes lineGlow {
    0%, 100% { border-left-color: var(--primary-blue); }
    50% { border-left-color: #aaddff; }
}

.sync-typing-line.success {
    border-left-color: #10b981;
    background: linear-gradient(90deg, rgba(16, 185, 129, 0.1), transparent);
    color: #a7f3d0;
}

.sync-typing-line::before {
    content: '>';
    color: var(--primary-blue);
    margin-right: 8px;
    font-weight: bold;
    opacity: 0.7;
}

.sync-typing-line.success::before {
    color: #10b981;
    content: '✓';
}

.sync-progress-bar {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    margin: 16px 0 12px 0;
    overflow: hidden;
    position: relative;
}

.sync-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-blue), #aaddff);
    border-radius: 4px;
    width: 0%;
    transition: width 0.3s ease;
    position: relative;
    overflow: hidden;
}

.sync-progress-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}

.sync-status {
    color: rgba(255, 255, 255, 0.6);
    font-size: 13px;
    text-align: center;
    padding: 8px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 30px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    animation: statusPulse 2s ease infinite;
}

@keyframes statusPulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
}

/* ------------------------------------------------------------------
   RESPONSIVE
   ------------------------------------------------------------------ */
@media (max-width: 480px) {
    .form-container {
        padding: 20px;
    }
    
    .form-title {
        font-size: 22px;
    }
    
    .requirements-grid {
        grid-template-columns: 1fr;
    }
    
    .duration-input-group {
        flex-direction: column;
    }
    
    .form-actions {
        padding: 12px 16px;
        flex-direction: row;
    }
    
    .btn {
        width: 100%;
    }
    
    .link-actions {
      flex-direction: column;
    }

    .modal-container {
      width: 95%;
    }
    
    .sync-loading-content {
      width: 95%;
      max-width: none;
    }

    .sync-typing-container {
      min-height: 150px;
      max-height: 200px;
    }

    .sync-typing-line {
      font-size: 12px;
    }
}

@media (max-width: 380px) {
    .form-container {
        padding: 16px;
    }
    
    .form-label {
        font-size: 14px;
    }
    
    .requirement-content {
        padding: 12px;
    }
    
    .duration-tab {
        padding: 8px 12px;
        font-size: 13px;
    }
}

/* ------------------------------------------------------------------
   ANIMATIONS
   ------------------------------------------------------------------ */
@keyframes spin {
    to { transform: rotate(360deg); }
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

/* Loading state for button */
.btn-primary.loading .btn-text {
    opacity: 0.7;
}

.btn-primary.loading .btn-loader {
    display: inline-block;
}

/* Success animation */
@keyframes successPop {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

.btn-primary.success {
    animation: successPop 0.3s ease;
    background: linear-gradient(135deg, #00c853, #009624);
}

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
    
      // Channel tags remove
      if (elements.channelTags) {
        elements.channelTags.addEventListener('click', (e) => {
          if (e.target.classList.contains('tag-remove')) {
            hapticImpact('light');
            const channel = e.target.dataset.channel;
            removeChannel(channel);
          }
        });
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
  
    // Di js/create.js, update fungsi addChannelFromInput
    
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
            // Data tidak ditemukan, trigger sync dan tampilkan loading modal
            console.log(`📡 Data for @${cleanUsername} not found, triggering sync...`);
    
            // Tampilkan loading modal
            const modal = showLoadingModal(cleanUsername);
    
            const syncResponse = await fetch(`${API_BASE_URL}/api/chatid/sync/${cleanUsername}`, {
              method: 'POST'
            });
    
            if (syncResponse.status === 202) {
              syncStarted = true;
              invalidChannels.push(`${cleanChannel} (⏳ sedang sync...)`);
    
              // Polling status dengan update ke modal
              pollSyncStatus(cleanUsername, cleanChannel, modal);
            } else {
              invalidChannels.push(cleanChannel);
              completeLoadingModal(false);
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
          message += '\n\nBeberapa channel sedang di-sync. Tunggu beberapa saat dan coba lagi.';
        }
        alert(message);
      }
    
      elements.channelInput.value = '@';
    
      setTimeout(() => {
        elements.channelInput.setSelectionRange(1, 1);
      }, 10);
    }
    
    // Update fungsi pollSyncStatus
    async function pollSyncStatus(username, displayName, modal = null) {
      const maxAttempts = 30; // Tambah jadi 30 kali (60 detik)
      let attempts = 0;
    
      const pollInterval = setInterval(async () => {
        attempts++;
    
        console.log(`🔍 Polling status for @${username} (${attempts}/${maxAttempts})`);
    
        // Update status di modal
        if (modal) {
          updateSyncStatus(`Mengambil data... (${attempts}/${maxAttempts})`);
        }
    
        try {
          const response = await fetch(`${API_BASE_URL}/api/chatid/username/${username}`);
    
          if (response.ok) {
            const data = await response.json();
    
            clearInterval(pollInterval);
    
            // Update modal dengan data real
            if (modal) {
              updateLoadingModalWithData(data);
              setTimeout(() => {
                completeLoadingModal(true);
              }, 1500);
            }
    
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
    
            return;
          }
    
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            if (modal) {
              completeLoadingModal(false);
            }
            showToast(`⚠️ Timeout mengambil data untuk @${username}`, 'error');
          }
    
        } catch (error) {
          console.error('Polling error:', error);
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            if (modal) {
              completeLoadingModal(false);
            }
            showToast(`⚠️ Gagal mengambil data untuk @${username}`, 'error');
          }
        }
      }, 2000);
    }
    
    // Fungsi untuk menampilkan toast notification
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

  // Update fungsi updateChannelsTags
  function updateChannelsTags() {
    if (!elements.channelTags) return;
  
    let html = '';
    channels.forEach((channel, index) => {
      const bgColor = getRandomColor(index);
  
      let displayText = '';
      let channelId = '';
  
      if (typeof channel === 'string') {
        // Format lama
        displayText = channel;
        channelId = channel;
        html += `<span class="channel-tag" data-channel-id="${channelId}">
                          <span class="prize-number" style="background: ${bgColor};">${index + 1}</span>
                          ${escapeHtml(displayText)}
                          <span class="tag-remove" data-channel="${channelId}">×</span>
                      </span>`;
      } else {
        // Format baru dengan data lengkap
        channelId = channel.chat_id;
        const typeIcon = channel.type === 'channel' ? '📢' : '👥';
        const verifiedIcon = channel.is_verified ? ' ✅' : '';
  
        html += `<span class="channel-tag" data-channel-id="${channelId}" data-channel-data='${JSON.stringify(channel)}'>
                          <span class="prize-number" style="background: ${bgColor};">${index + 1}</span>
                          <div class="channel-info">
                              <span class="channel-name">
                                  ${typeIcon} ${escapeHtml(channel.title)}${verifiedIcon}
                              </span>
                              <span class="channel-details">
                                  <span class="channel-id">${escapeHtml(channel.chat_id)}</span>
                                  ${channel.participants_count ? `<span class="channel-members">👥 ${channel.participants_count}</span>` : ''}
                              </span>
                          </div>
                          <span class="tag-remove" data-channel="${channelId}">×</span>
                      </span>`;
      }
    });
  
    elements.channelTags.innerHTML = html;
  
    setTimeout(() => {
      const scrollContainer = document.querySelector('.channel-tags-scroll');
      if (scrollContainer) {
        scrollContainer.scrollLeft = scrollContainer.scrollWidth;
      }
    }, 50);
  }

    let typingInterval = null;
    let currentTypingIndex = 0;
    let typingLines = [];
    
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
      typingLines = [
        { text: `📡 Memulai sinkronisasi untuk @${username}...`, delay: 500 },
        { text: `🔍 Mencari data channel @${username}...`, delay: 800 },
        { text: `✅ Entity ditemukan!`, delay: 600 },
        { text: `📊 Mengambil informasi channel...`, delay: 700 },
        { text: `👥 Mengambil data anggota...`, delay: 900 }
        ];
    
      // Buat modal
      const modal = document.createElement('div');
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
                    <div class="sync-status" id="syncStatus">Menghubungi server...</div>
                </div>
            </div>
        `;
    
      document.body.appendChild(modal);
    
      // Animasi masuk
      setTimeout(() => {
        modal.classList.add('active');
      }, 10);
    
      // Mulai typing effect
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
          // Selesai semua line, update status
          updateSyncStatus('Menyimpan data ke database...');
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
    
        // Typing effect per karakter
        let charIndex = 0;
        const text = line.text;
        lineElement.textContent = '';
    
        function typeChar() {
          if (charIndex < text.length) {
            lineElement.textContent += text.charAt(charIndex);
            charIndex++;
    
            // Scroll otomatis
            typingContent.scrollTop = typingContent.scrollHeight;
    
            // Kecepatan typing random (30-80ms) untuk efek natural
            const nextDelay = 30 + Math.random() * 50;
            setTimeout(typeChar, nextDelay);
          } else {
            // Selesai satu line, lanjut ke next line
            currentTypingIndex++;
    
            // Update progress bar
            const progress = (currentTypingIndex / typingLines.length) * 100;
            updateProgressBar(progress);
    
            // Update status berdasarkan line terakhir
            if (currentTypingIndex === 1) {
              updateSyncStatus('Mencari channel di Telegram...');
            } else if (currentTypingIndex === 2) {
              updateSyncStatus('Channel ditemukan!');
            } else if (currentTypingIndex === 3) {
              updateSyncStatus('Mengambil detail channel...');
            }
    
            // Lanjut ke line berikutnya setelah delay
            setTimeout(typeNextLine, line.delay || 500);
          }
        }
    
        typeChar();
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
    
      // Tambahkan line-line baru dengan data real
      const dataLines = [
        { text: `✅ Chat ID: ${data.chat_id}`, delay: 300 },
        { text: `📢 Nama: ${data.chat_title}`, delay: 300 },
        { text: `🔗 Username: @${data.chat_username}`, delay: 300 },
        { text: `👥 Jumlah Anggota: ${data.participants_count || 'Tidak diketahui'}`, delay: 300 },
        { text: `✅ Verified: ${data.is_verified ? 'Ya' : 'Tidak'}`, delay: 300 },
        { text: `📎 Invite Link: ${data.invite_link || 'Tidak tersedia'}`, delay: 400 }
        ];
    
      // Tambahkan ke typing lines
      typingLines = [...typingLines, ...dataLines];
    
      // Update progress bar
      updateProgressBar(80);
      updateSyncStatus('Data berhasil diambil!');
    }
    
    function completeLoadingModal(success = true) {
      const modal = document.querySelector('.sync-loading-modal');
      if (!modal) return;
    
      // Hentikan typing
      if (typingInterval) {
        clearInterval(typingInterval);
        typingInterval = null;
      }
    
      // Update progress bar ke 100%
      updateProgressBar(100);
    
      if (success) {
        updateSyncStatus('✅ Selesai! Data siap digunakan.');
    
        // Tambahkan centang
        const typingContent = document.getElementById('typingContent');
        if (typingContent) {
          const completeLine = document.createElement('div');
          completeLine.className = 'sync-typing-line success';
          completeLine.innerHTML = '✅ Semua data berhasil dimuat!';
          typingContent.appendChild(completeLine);
        }
      } else {
        updateSyncStatus('❌ Gagal memuat data. Silakan coba lagi.');
      }
    
      // Tutup modal setelah 2 detik
      setTimeout(() => {
        modal.classList.remove('active');
        setTimeout(() => {
          modal.remove();
        }, 300);
      }, 2000);
    }

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
      updateChannelsTags(); // TAMBAH INI
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
