export class NotificationManager {
  static async playSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
      console.warn('Could not play notification sound:', err);
    }
  }

  static showBrowserNotification(title, options = {}) {
    try {
      if (!('Notification' in window)) return;

      const permission = localStorage.getItem('settings_browserNotifications') === 'true';
      if (!permission || Notification.permission !== 'granted') return;

      return new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'incident-alert',
        requireInteraction: true,
        ...options
      });
    } catch (err) {
      console.warn('Could not show browser notification:', err);
    }
  }

  static showToastNotification(message, type = 'info') {
    try {
      const { toast } = require('./react-toastify-shim');
      if (toast && typeof toast[type] === 'function') {
        toast[type](message, { autoClose: 5000 });
      }
    } catch (err) {
      console.warn('Toast notification failed:', err);
    }
  }

  static notifyIncident(incident) {
    const title = `🚨 ${incident.severity.toUpperCase()}: ${incident.studentName || 'Unknown'}`;
    const body = `${incident.cheatingType || 'Exam Violation'} - ${incident.exam || 'Unknown Exam'}`;

    this.playSound();
    this.showBrowserNotification(title, {
      body,
      tag: `incident-${incident.id}`,
      data: { incidentId: incident.id }
    });
    this.showToastNotification(title, 'error');
  }
}

export default NotificationManager;
