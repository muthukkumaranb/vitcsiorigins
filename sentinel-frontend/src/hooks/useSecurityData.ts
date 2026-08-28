import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { securityService } from '../services';
import { IS_MOCK_MODE } from '../services';
import { ResponseActionPayload, AnalystFeedback, RiskAssessment, RiskResult } from '../types/security';

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: securityService.getDashboard,
    refetchInterval: 10000
  });
}

export function useThreatsData() {
  return useQuery({
    queryKey: ['threats'],
    queryFn: securityService.getThreats,
    refetchInterval: 8000
  });
}

export function useIdentitiesData() {
  return useQuery({
    queryKey: ['identities'],
    queryFn: securityService.getIdentities
  });
}

export function useIdentityData(userId: string) {
  return useQuery({
    queryKey: ['identity', userId],
    queryFn: () => securityService.getIdentity(userId),
    enabled: !!userId
  });
}

export function useInvestigationData(userId: string) {
  const identityQuery = useQuery({
    queryKey: ['identity', userId],
    queryFn: () => securityService.getIdentity(userId),
    enabled: IS_MOCK_MODE && !!userId
  });

  const riskQuery = useQuery<RiskAssessment | RiskResult>({
    queryKey: ['risk', userId],
    queryFn: () => securityService.getRisk(userId),
    enabled: !!userId
  });

  const baselineQuery = useQuery({
    queryKey: ['baseline', userId],
    queryFn: () => securityService.getBaseline(userId),
    enabled: IS_MOCK_MODE && !!userId
  });

  const peerQuery = useQuery({
    queryKey: ['peer', userId],
    queryFn: () => securityService.getPeerAnalysis(userId),
    enabled: IS_MOCK_MODE && !!userId
  });

  const sequenceQuery = useQuery({
    queryKey: ['sequence', userId],
    queryFn: () => securityService.getSequence(userId),
    enabled: IS_MOCK_MODE && !!userId
  });

  const contextQuery = useQuery({
    queryKey: ['context', userId],
    queryFn: () => securityService.getContext(userId),
    enabled: IS_MOCK_MODE && !!userId
  });

  const graphQuery = useQuery({
    queryKey: ['graph', userId],
    queryFn: () => securityService.getRelationshipGraph(userId),
    enabled: IS_MOCK_MODE && !!userId
  });

  return {
    identity: identityQuery.data,
    risk: riskQuery.data,
    baseline: baselineQuery.data,
    peer: peerQuery.data,
    sequence: sequenceQuery.data,
    context: contextQuery.data,
    graph: graphQuery.data,
    isLoading:
      identityQuery.isLoading ||
      riskQuery.isLoading ||
      (IS_MOCK_MODE && baselineQuery.isLoading) ||
      peerQuery.isLoading ||
      sequenceQuery.isLoading ||
      contextQuery.isLoading ||
      graphQuery.isLoading,
    isError:
      (IS_MOCK_MODE && identityQuery.isError) ||
      riskQuery.isError ||
      baselineQuery.isError ||
      peerQuery.isError ||
      sequenceQuery.isError ||
      contextQuery.isError ||
      graphQuery.isError
  };
}

export function useAnalyticsData() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: securityService.getAnalytics
  });
}

export function useAuditLogsData() {
  return useQuery({
    queryKey: ['auditLogs'],
    queryFn: securityService.getAuditLogs,
    refetchInterval: 5000
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
    }
  });
}

export function useAnalystFeedbackMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (feedback: AnalystFeedback) => securityService.submitFeedback(feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    }
  });
}
