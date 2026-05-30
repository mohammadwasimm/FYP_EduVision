import { useEffect } from 'react';
import { useSocket } from '../utils/useSocket';
import NotificationManager from '../utils/notifications';

export function GlobalIncidentListener() {
  const { emit: socketEmit } = useSocket({
    new_incident: (incident) => {
      // Trigger local notifications
      NotificationManager.notifyIncident(incident);
    },
    sound_alert: (data) => {
      // Server triggered sound alert
      NotificationManager.playSound();
    }
  });

  useEffect(() => {
    // Join a global alerts room if needed
    // socketEmit('join_alerts_room');
  }, []);

  // This component doesn't render anything, it just listens for events
  return null;
}

export default GlobalIncidentListener;
