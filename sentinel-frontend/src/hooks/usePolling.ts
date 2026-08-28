import { useState, useEffect, useCallback } from 'react';
import { SecurityEvent } from '../types/security';
import { MOCK_EVENTS } from '../data/mockData';
import { securityService, IS_MOCK_MODE } from '../services';

export function useLiveBehaviourStream() {
  const [stream, setStream] = useState<SecurityEvent[]>(IS_MOCK_MODE ? MOCK_EVENTS : []);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(!IS_MOCK_MODE);
  const [isError, setIsError] = useState<boolean>(false);

  const fetchStream = useCallback(async () => {
    if (IS_MOCK_MODE) return;
    try {
      const events = await securityService.getEvents();
      if (events && events.length > 0) {
        setStream(events);
        setLastUpdated(0);
        setIsError(false);
      }
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Timer to increment last updated counter
    const timer = setInterval(() => {
      setLastUpdated((prev) => prev + 1);
    }, 1000);

    if (!IS_MOCK_MODE) {
      fetchStream();
      const pollInterval = setInterval(() => {
        if (isMounted) fetchStream();
      }, 3000);

      return () => {
        isMounted = false;
        clearInterval(timer);
        clearInterval(pollInterval);
      };
    }

    // Simulated stream in mock mode
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
      const timeStr = now.toISOString();

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

      setStream((prev) => [newEvent, ...prev.slice(0, 49)]);
      setLastUpdated(0);
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(timer);
      clearInterval(eventTimer);
    };
  }, [fetchStream]);

  return { stream, lastUpdated, isLoading, isError, refetch: fetchStream };
}
