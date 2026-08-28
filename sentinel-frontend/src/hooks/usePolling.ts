import { useQuery } from '@tanstack/react-query';
import { SecurityEvent } from '../types/security';
import { securityService } from '../services';

export function useLiveBehaviourStream() {
  const query = useQuery<SecurityEvent[]>({
    queryKey: ['events'],
    queryFn: () => securityService.getEvents(),
    refetchInterval: 10000
  });

  return {
    stream: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch
  };
}
