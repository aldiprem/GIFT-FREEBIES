# utils.py
from datetime import datetime
import pytz
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_jakarta_time():
    """Mendapatkan waktu Jakarta dalam format string"""
    jakarta_tz = pytz.timezone('Asia/Jakarta')
    return datetime.now(jakarta_tz).strftime('%Y-%m-%d %H:%M:%S')

def log_info(message):
    """Log info message"""
    logger.info(f"✅ {message}")

def log_error(message):
    """Log error message"""
    logger.error(f"❌ {message}")

def log_warning(message):
    """Log warning message"""
    logger.warning(f"⚠️ {message}")
