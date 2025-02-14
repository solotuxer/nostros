import { NativeModules } from 'react-native'
const { RelayPoolModule } = NativeModules

interface RelayPoolInterface {
  send: (message: string, globalFeed: boolean) => void
  connect: (pubKey: string, callback: (eventId: string) => void) => void
  add: (url: string, callback: () => void) => void
  remove: (url: string, callback: () => void) => void
  update: (relayUrl: string, active: number, globalfeed: number, callback?: () => void) => void
  onEventId: (callback: (eventId: string) => void) => void
}

export default RelayPoolModule as RelayPoolInterface
