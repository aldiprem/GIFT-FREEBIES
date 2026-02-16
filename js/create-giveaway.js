// Handle requirement checkboxes
document.addEventListener('DOMContentLoaded', () => {
  const requireJoinCheck = document.getElementById('requireJoin');
  const joinChannelsField = document.getElementById('joinChannelsField');

  if (requireJoinCheck) {
    requireJoinCheck.addEventListener('change', (e) => {
      joinChannelsField.style.display = e.target.checked ? 'block' : 'none';
    });
  }

  // Handle form submission
  const form = document.getElementById('createGiveawayForm');
  if (form) {
    form.addEventListener('submit', handleCreateGiveaway);
  }
});

async function handleCreateGiveaway(e) {
  e.preventDefault();

  if (!currentUser) {
    alert('Silakan login terlebih dahulu');
    return;
  }

  // Show loading
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = '⏳ Memproses...';
  submitBtn.disabled = true;

  try {
    // Collect form data
    const formData = {
      creator_user_id: currentUser.user_id,
      prize: document.getElementById('prize').value,
      prize_description: document.getElementById('prizeDescription').value,
      prize_value: parseFloat(document.getElementById('prizeValue').value) || 0,
      total_winners: parseInt(document.getElementById('totalWinners').value) || 1,
      chat_id: document.getElementById('chatId').value,
      duration_hours: parseInt(document.getElementById('durationHours').value) || 24,
      duration_minutes: parseInt(document.getElementById('durationMinutes').value) || 0,
      giveaway_text: document.getElementById('giveawayText').value,
      button_text: document.getElementById('buttonText').value,
      share_mode: document.getElementById('shareMode').value,
      max_tickets_per_user: parseInt(document.getElementById('maxTickets').value) || 1,
      require_join_channel: document.getElementById('requireJoin').checked ? 1 : 0,
      require_comment: document.getElementById('requireComment').checked ? 1 : 0,
      require_reaction: document.getElementById('requireReaction').checked ? 1 : 0
    };

    // Add join channels if required
    if (formData.require_join_channel) {
      formData.require_join_channels = document.getElementById('joinChannels').value;
    }

    // Validate required fields
    if (!formData.prize || !formData.chat_id || !formData.giveaway_text) {
      throw new Error('Harap isi semua field yang wajib diisi');
    }

    // Send to API
    const result = await apiCall('/api/giveaways', 'POST', formData);

    // Show success message
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
            <div class="alert alert-success">
                ✅ Giveaway berhasil dibuat!<br>
                ID Giveaway: ${result.giveaway_id}<br>
                Link: <a href="giveaway.html?giveaway_id=${result.giveaway_id}" target="_blank">Lihat Giveaway</a>
            </div>
        `;

    // Scroll to result
    resultDiv.scrollIntoView({ behavior: 'smooth' });

    // Reset form
    e.target.reset();

  } catch (error) {
    console.error('Error creating giveaway:', error);
    document.getElementById('result').innerHTML = `
            <div class="alert alert-error">
                ❌ Gagal membuat giveaway: ${error.message}
            </div>
        `;
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}
