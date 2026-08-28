import { useState, useEffect } from 'react';
import { SecurityEvent } from '../types/security';
import { MOCK_EVENTS } from '../data/mockData';

export function useLiveBehaviourStream() {
  const [stream, setStream] = useState<SecurityEvent[]>(MOCK_EVENTS);
  const [lastUpdated, setLastUpdated] = useState<number>(0);

  useEffect(() => {
    // Timer to increment last updated counter
    const timer = setInterval(() => {
      setLastUpdated((prev) => prev + 1);
    }, 1000);

    // Simulated new live incoming event stream push
    const eventTimer = setInterval(() => {
      const randomUsers = [
        { id: 'U0345', name: 'Vikram Sharma', role: 'Finance Ops' },
        { id: 'U0123', name: 'Priya Sundaram', role: 'Core DB Admin' },
        { id: 'SA-9901', name: 'SWIFT-Auto-Gateway', role: 'Settlement Bot' },
        { id: 'U0892', name: 'Anish Verma', role: 'DevOps Lead' }
      ];
      const randomEvents = [
        { type: 'LARGE TRANSACTION', risk: 'CRITICAL', desc: 'Out-of-band wire transfer initiated ₹8.4L', amt: '₹8.4L' },
        { type: 'PRIVILEGE MODIFIED', risk: 'HIGH', desc: 'User threshold limit override granted', amt: '-' },
        { type: 'NEW BENEFICIARY', risk: 'HIGH', desc: 'Unverified offshore bank account added', amt: '-' },
        { type: 'NEW DEVICE', risk: 'MEDIUM', desc: 'Unregistered device token login detected', amt: '-' },
        { type: 'SENSITIVE DATA EXPORT', risk: 'CRITICAL', desc: '387 customer PII records queried', amt: '-' }
      ];

      const user = randomUsers[Math.floor(Math.random() * randomUsers.length)];
      const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];

      const newEvent: SecurityEvent = {
        event_id: `EVT-${Math.floor(1000 + Math.random() * 9000)}`,
        user_id: user.id,
        user_name: user.name,
        timestamp: timeStr,
        event_type: event.type,
        risk_level: event.risk as any,
        description: `${user.id} (${user.name}) - ${event.desc}`,
        amount: event.amt,
        location: 'Mumbai HQ'
      };

      setStream((prev) => [newEvent, ...prev.slice(0, 19)]);
      setLastUpdated(0);
    }, 12000);

    return () => {
      clearInterval(timer);
      clearInterval(eventTimer);
    };
  }, []);

  return { stream, lastUpdated };
}
