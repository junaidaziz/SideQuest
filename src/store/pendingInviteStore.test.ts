import { usePendingInviteStore } from './pendingInviteStore';

describe('pendingInviteStore', () => {
  beforeEach(() => {
    usePendingInviteStore.setState({ token: null });
  });

  it('starts with no pending token', () => {
    expect(usePendingInviteStore.getState().token).toBeNull();
  });

  it('stashes a token via setToken', () => {
    usePendingInviteStore.getState().setToken('tok-1');
    expect(usePendingInviteStore.getState().token).toBe('tok-1');
  });

  it('overwrites a previously stashed token', () => {
    usePendingInviteStore.getState().setToken('tok-1');
    usePendingInviteStore.getState().setToken('tok-2');
    expect(usePendingInviteStore.getState().token).toBe('tok-2');
  });

  it('clears the stashed token', () => {
    usePendingInviteStore.getState().setToken('tok-1');
    usePendingInviteStore.getState().clear();
    expect(usePendingInviteStore.getState().token).toBeNull();
  });
});
