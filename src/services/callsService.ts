/**
 * AERIX ONE - Calls Service (Phase 1 Stub)
 * WebRTC and cellular VoIP gateway connectors planned for Phase 2.
 */

export const callsService = {
  isVoipActive: false,
  phase: 'Phase 1 - Interactive UI Shell',

  initiateCall(number: string) {
    return {
      status: 'connecting',
      number,
      startedAt: new Date().toISOString()
    };
  }
};
