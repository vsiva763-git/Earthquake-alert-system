import { create } from 'zustand'

export const useAlertStore = create((set) => ({
  alerts: [],
  lastHighAlert: null,
  iotConnected: false,

  setAlerts: (alerts) => set({ alerts }),
  addAlert: (alert) => set((state) => ({ 
    alerts: [alert, ...state.alerts].slice(0, 50) // Keep last 50
  })),
  setLastHighAlert: (alert) => set({ lastHighAlert: alert }),
  setIotConnected: (status) => set({ iotConnected: status }),
}))
