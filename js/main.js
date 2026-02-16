// Konfigurasi API
const API_URL = 'https://expect-checkout-cologne-dozens.trycloudflare.com';

function formatNumber(num) {
  return new Intl.NumberFormat('id-ID').format(num);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function showLoading(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
            </div>
        `;
  }
}

function showError(containerId, message) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
            <div class="alert alert-error">❌ ${message}</div>
        `;
  }
}

function showSuccess(containerId, message) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
            <div class="alert alert-success">✅ ${message}</div>
        `;
  }
}

// Get URL Parameters
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// User Session Management
let currentUser = null;

async function loadUserSession() {
  // Coba load dari localStorage
  const savedUser = localStorage.getItem('giftfreebies_user');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    updateUserUI();
  } else {
    // Untuk demo, cek apakah ada parameter user_id di URL
    const userId = getUrlParameter('user_id');
    if (userId) {
      try {
        const response = await fetch(`${API_URL}/api/user/${userId}`);
        if (response.ok) {
          currentUser = await response.json();
          localStorage.setItem('giftfreebies_user', JSON.stringify(currentUser));
          updateUserUI();
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    } else {
      // Buat user dummy untuk demo
      currentUser = {
        user_id: 123456789,
        fullname: 'John Doe',
        username: 'johndoe',
        avatar: 'https://via.placeholder.com/40'
      };
      localStorage.setItem('giftfreebies_user', JSON.stringify(currentUser));
      updateUserUI();
    }
  }
}

// Tambahkan fungsi update connection status
function updateConnectionStatus(status, message = '') {
  const statusEl = document.getElementById('connectionStatus');
  if (!statusEl) return;

  statusEl.className = 'connection-status ' + status;

  switch (status) {
    case 'online':
      statusEl.innerHTML = '🟢 Online';
      break;
    case 'offline':
      statusEl.innerHTML = '🔴 Offline';
      break;
    case 'checking':
      statusEl.innerHTML = '🟡 Checking...';
      break;
  }

  if (message) {
    statusEl.title = message;
  }
}

// Modifikasi testApiConnection
async function testApiConnection() {
  updateConnectionStatus('checking');

  try {
    const response = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Connected to API:', data);
      updateConnectionStatus('online', `Server: ${data.timestamp}`);
      return true;
    } else {
      throw new Error('Response not OK');
    }
  } catch (error) {
    console.error('❌ Cannot connect to API:', error);
    updateConnectionStatus('offline', error.message);
    return false;
  }
}

// Panggil setiap 30 detik untuk monitoring
setInterval(testApiConnection, 30000);

function updateUserUI() {
  if (currentUser) {
    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');
    const profileFullname = document.getElementById('profileFullname');
    const profileUsername = document.getElementById('profileUsername');

    if (userNameEl) userNameEl.textContent = currentUser.fullname || currentUser.username;
    if (userAvatarEl) userAvatarEl.src = currentUser.avatar || 'https://via.placeholder.com/40';
    if (profileFullname) profileFullname.textContent = currentUser.fullname || 'No Name';
    if (profileUsername) profileUsername.textContent = `@${currentUser.username || 'username'}`;
  }
}

// API Calls
async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'API call failed');
    }

    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadUserSession();

  // Handle search if on index page
  const searchInput = document.getElementById('searchGiveaway');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleSearch, 500));
  }

  // Check for giveaway_id in URL
  const giveawayId = getUrlParameter('search') || getUrlParameter('giveaway_id');
  if (giveawayId && window.location.pathname.includes('giveaway.html')) {
    loadGiveawayDetail(giveawayId);
  } else if (giveawayId) {
    window.location.href = `giveaway.html?giveaway_id=${giveawayId}`;
  }
});

// Debounce function for search
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

async function handleSearch(e) {
  const query = e.target.value;
  if (query.length > 2) {
    try {
      const results = await apiCall(`/api/giveaways/search?q=${query}`);
      displaySearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    }
  }
}

function displaySearchResults(results) {
  const container = document.getElementById('giveawayList');
  if (!container) return;

  if (results.length === 0) {
    container.innerHTML = '<div class="alert alert-warning">Tidak ada giveaway ditemukan</div>';
    return;
  }

  container.innerHTML = results.map(giveaway => createGiveawayCard(giveaway)).join('');
}

function createGiveawayCard(giveaway) {
  const status = giveaway.status === 'active' ? 'Aktif' : 'Berakhir';
  const statusClass = giveaway.status === 'active' ? 'success' : 'warning';

  return `
        <div class="giveaway-item" onclick="window.location.href='giveaway.html?giveaway_id=${giveaway.giveaway_id}'">
            <div>
                <h3>🎁 ${giveaway.prize}</h3>
                <p>${giveaway.giveaway_text.substring(0, 100)}...</p>
                <small>👥 ${giveaway.participants_count || 0} peserta</small>
            </div>
            <div>
                <span class="giveaway-status status-${statusClass}">${status}</span>
                <br>
                <small>Berakhir: ${formatDate(giveaway.end_time)}</small>
            </div>
        </div>
    `;
}
