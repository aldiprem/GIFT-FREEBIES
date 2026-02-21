// ==================== CEK APAKAH DIPANGGIL DARI GIVEAWAY ====================
(function() {
  // Cek apakah ada data pending participation
  const pendingParticipation = sessionStorage.getItem('pending_participation');
  const returnUrl = sessionStorage.getItem('captcha_return_url');
  const giveawayId = sessionStorage.getItem('captcha_giveaway_id');

  console.log('📦 Pending participation:', pendingParticipation);
  console.log('🔙 Return URL:', returnUrl);

  // Simpan ke global
  window.pendingParticipation = pendingParticipation ? JSON.parse(pendingParticipation) : null;
  window.returnUrl = returnUrl;
  window.giveawayId = giveawayId;
})();

(function() {
  // Elemen
  const rotatableImage = document.getElementById('rotatableImage');
  const rotationSlider = document.getElementById('rotationSlider');
  const degreeDisplay = document.getElementById('degreeDisplay');
  const targetDegreeSpan = document.getElementById('targetDegree');
  const verifyBtn = document.getElementById('verifyBtn');
  const resetBtn = document.getElementById('resetBtn');
  const toast = document.getElementById('toast');

  // State
  let currentRotation = 0; // derajat saat ini (0-360)
  let targetRotation = 0; // target yang harus dicapai

  // Semua kemungkinan target (kelipatan 45 derajat)
  const possibleTargets = [0, 45, 90, 135, 180, 225, 270, 315];

  // Fungsi untuk menampilkan toast
  function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = 'toast show';

    if (type === 'success') {
      toast.classList.add('success');
    } else if (type === 'error') {
      toast.classList.add('error');
    }

    setTimeout(() => {
      toast.classList.remove('show', 'success', 'error');
    }, 2000);
  }

  // Inisialisasi: pilih target acak, set slider ke 0
  function generateNewTarget() {
    const randomIndex = Math.floor(Math.random() * possibleTargets.length);
    targetRotation = possibleTargets[randomIndex];
    targetDegreeSpan.innerText = targetRotation + '°';
  }

  // Update tampilan rotasi berdasarkan nilai slider
  function updateRotationFromSlider() {
    const val = parseInt(rotationSlider.value, 10);
    currentRotation = val;
    rotatableImage.style.transform = `rotate(${val}deg)`;
    degreeDisplay.innerText = val + '°';
  }

  // Event slider
  rotationSlider.addEventListener('input', updateRotationFromSlider);

  // Fungsi drag langsung pada gambar (desktop & touch)
  let isDragging = false;
  let startX, startRot;

  // Mouse events untuk desktop
  rotatableImage.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDragging = true;
    startX = e.clientX;
    startRot = currentRotation;
    rotatableImage.style.cursor = 'grabbing';
  });

  // Touch events untuk mobile
  rotatableImage.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isDragging = true;
    startX = e.touches[0].clientX;
    startRot = currentRotation;
  }, { passive: false });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const deltaX = e.clientX - startX;
    let newRot = startRot + deltaX * 0.8;
    newRot = ((newRot % 360) + 360) % 360;
    currentRotation = Math.round(newRot);
    rotationSlider.value = currentRotation;
    rotatableImage.style.transform = `rotate(${currentRotation}deg)`;
    degreeDisplay.innerText = currentRotation + '°';
  });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const deltaX = e.touches[0].clientX - startX;
    let newRot = startRot + deltaX * 0.8;
    newRot = ((newRot % 360) + 360) % 360;
    currentRotation = Math.round(newRot);
    rotationSlider.value = currentRotation;
    rotatableImage.style.transform = `rotate(${currentRotation}deg)`;
    degreeDisplay.innerText = currentRotation + '°';
  }, { passive: false });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      rotatableImage.style.cursor = 'grab';
    }
  });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  window.addEventListener('touchcancel', () => {
    isDragging = false;
  });

  // ==================== HANDLE TOMBOL BACK ====================
  window.addEventListener('popstate', function(event) {
    // Jika ada pending participation, batalkan
    if (window.pendingParticipation) {
      sessionStorage.removeItem('pending_participation');
      sessionStorage.removeItem('captcha_return_url');
      sessionStorage.removeItem('captcha_giveaway_id');
    }
  });
  
  // Verifikasi
  function verifyRotation() {
    const diff = Math.abs(currentRotation - targetRotation);
    const diffWrapped = Math.min(diff, 360 - diff);
  
    if (diffWrapped <= 5) {
      showToast('✓✓✓ CAPTCHA BENAR! putaran tepat.', 'success');
  
      // ===== TAMBAHKAN LOGIC UNTUK KEMBALI KE GIVEAWAY =====
      setTimeout(() => {
        // Cek apakah ada pending participation
        if (window.pendingParticipation && window.returnUrl) {
          // Tandai captcha sebagai passed
          sessionStorage.setItem(`captcha_passed_${window.pendingParticipation.giveaway_id}`, 'true');
  
          // Redirect kembali ke halaman giveaway
          window.location.href = window.returnUrl;
        } else {
          // Jika tidak ada pending, reset captcha seperti biasa
          setTimeout(() => {
            resetCaptcha();
          }, 1500);
        }
      }, 1500);
  
    } else {
      showToast(`✗✗✗ SALAH. putar ke ${targetRotation}°`, 'error');
    }
  }

  // Reset: target baru, set slider ke 0
  function resetCaptcha() {
    generateNewTarget();
    rotationSlider.value = 0;
    currentRotation = 0;
    rotatableImage.style.transform = 'rotate(0deg)';
    degreeDisplay.innerText = '0°';
    showToast('🔄 captcha baru. putar gambar', 'info');
  }

  // Event listener
  verifyBtn.addEventListener('click', verifyRotation);
  resetBtn.addEventListener('click', () => {
    if (window.pendingParticipation) {
      sessionStorage.removeItem('pending_participation');
      sessionStorage.removeItem('captcha_return_url');
      sessionStorage.removeItem('captcha_giveaway_id');
      window.pendingParticipation = null;
    }
    resetCaptcha();
  });

  // Inisialisasi pertama
  generateNewTarget();

  // Cegah semua seleksi dan konteks menu
  document.addEventListener('selectstart', (e) => e.preventDefault());
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('dragstart', (e) => e.preventDefault());
})();
