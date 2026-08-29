import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { securityService } from '../services';
import { IS_MOCK_MODE } from '../services';
import { ResponseActionPayload, AnalystFeedback, RiskAssessment, RiskResult, AuditQueryParams } from '../types/security';

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: securityService.getDashboard,
    staleTime: 5000,
    refetchInterval: 8000,
    retry: 1,
    retryDelay: 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useThreatsData() {
  return useQuery({
    queryKey: ['threats'],
    queryFn: securityService.getThreats,
    staleTime: 5000,
    refetchInterval: 8000,
    retry: 1,
    retryDelay: 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useIdentitiesData() {
  return useQuery({
    queryKey: ['identities'],
    queryFn: securityService.getIdentities,
    staleTime: 10000,
    refetchInterval: 12000,
    retry: 1,
    placeholderData: (previousData) => previousData,
  });
}

export function useIdentityData(userId: string) {
  return useQuery({
    queryKey: ['identity', userId],
    queryFn: () => securityService.getIdentity(userId),
    staleTime: 30000,
    enabled: !!userId,
  });
}

export function useInvestigationData(id: string) {
  const identityQuery = useQuery({
    queryKey: ['identity', id],
    queryFn: () => securityService.getIdentity(id),
    staleTime: 60000,
    enabled: IS_MOCK_MODE && !!id,
  });

  const riskQuery = useQuery<RiskAssessment | RiskResult>({
    queryKey: ['risk', id],
    queryFn: () => securityService.getRisk(id),
    staleTime: 60000,
    enabled: !!id,
    retry: 1,
  });

  const baselineQuery = useQuery({
    queryKey: ['baseline', id],
    queryFn: () => securityService.getBaseline(id),
    staleTime: 60000,
    enabled: IS_MOCK_MODE && !!id,
  });

  const peerQuery = useQuery({
    queryKey: ['peer', id],
    queryFn: () => securityService.getPeerAnalysis(id),
    staleTime: 60000,
    enabled: IS_MOCK_MODE && !!id,
  });

  const sequenceQuery = useQuery({
    queryKey: ['sequence', id],
    queryFn: () => securityService.getSequence(id),
    staleTime: 60000,
    enabled: IS_MOCK_MODE && !!id,
  });

  const contextQuery = useQuery({
    queryKey: ['context', id],
    queryFn: () => securityService.getContext(id),
    staleTime: 60000,
    enabled: IS_MOCK_MODE && !!id,
  });

  const graphQuery = useQuery({
    queryKey: ['graph', id],
    queryFn: () => securityService.getRelationshipGraph(id),
    staleTime: 60000,
    enabled: IS_MOCK_MODE && !!id,
  });

  return {
    identity: identityQuery.data,
    risk: riskQuery.data,
    baseline: baselineQuery.data,
    peer: peerQuery.data,
    sequence: sequenceQuery.data,
    context: contextQuery.data,
    graph: graphQuery.data,
    isLoading: IS_MOCK_MODE
      ? identityQuery.isLoading ||
        riskQuery.isLoading ||
        baselineQuery.isLoading ||
        peerQuery.isLoading ||
        sequenceQuery.isLoading ||
        contextQuery.isLoading ||
        graphQuery.isLoading
      : riskQuery.isLoading,
    isError: IS_MOCK_MODE
      ? identityQuery.isError ||
        riskQuery.isError ||
        baselineQuery.isError ||
        peerQuery.isError ||
        sequenceQuery.isError ||
        contextQuery.isError ||
        graphQuery.isError
      : riskQuery.isError,
    error: riskQuery.error,
  };
}

export function useAnalyticsData() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: securityService.getAnalytics,
    staleTime: 30000,
    retry: 1,
  });
}

export function useAuditLogsData(params?: AuditQueryParams) {
  return useQuery({
    queryKey: ['auditLogs', params],
    queryFn: () => securityService.getAuditLogs(params),
    staleTime: 8000,
    refetchInterval: 12000,
    retry: 1,
  });
}

export function useLLMStatus() {
  return useQuery({
    queryKey: ['llmStatus'],
    queryFn: () => securityService.getLLMStatus(),
    staleTime: 30000,
    gcTime: 120000,
    retry: 0,
    refetchOnWindowFocus: false,
  });
}

export function useResponseActionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ResponseActionPayload) => securityService.executeResponse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      queryClient.invalidateQueries({ queryKey: ['threats'] });
      queryClient.invalidateQueries({ queryKey: ['identities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useAnalystFeedbackMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (feedback: AnalystFeedback) => securityService.submitFeedback(feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    },
  });
}
