import React, { useCallback, useContext, useState, useEffect } from 'react'
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native'
import { AppContext } from '../../Contexts/AppContext'
import { getMainNotes, getMainNotesCount, Note } from '../../Functions/DatabaseFunctions/Notes'
import { handleInfinityScroll } from '../../Functions/NativeFunctions'
import { UserContext } from '../../Contexts/UserContext'
import { RelayPoolContext } from '../../Contexts/RelayPoolContext'
import { Kind } from 'nostr-tools'
import { RelayFilters } from '../../lib/nostr/RelayPool/intex'
import { Chip, Button, Text } from 'react-native-paper'
import NoteCard from '../../Components/NoteCard'
import { useTheme } from '@react-navigation/native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { t } from 'i18next'
import { FlashList, ListRenderItem } from '@shopify/flash-list'
import { getUnixTime } from 'date-fns'

interface GlobalFeedProps {
  navigation: any
}

export const GlobalFeed: React.FC<GlobalFeedProps> = ({ navigation }) => {
  const theme = useTheme()
  const { database, showPublicImages } = useContext(AppContext)
  const { publicKey } = useContext(UserContext)
  const { lastEventId, relayPool, lastConfirmationtId } = useContext(RelayPoolContext)
  const initialPageSize = 10
  const [notes, setNotes] = useState<Note[]>([])
  const [lastLoadAt, setLastLoadAt] = useState<number>(0)
  const [newNotesCount, setNewNotesCount] = useState<number>(0)
  const [pageSize, setPageSize] = useState<number>(initialPageSize)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    subscribeNotes()
  }, [])

  useEffect(() => {
    if (relayPool && publicKey) {
      loadNotes()
    }
  }, [lastEventId, lastConfirmationtId, lastLoadAt])

  useEffect(() => {
    if (pageSize > initialPageSize) {
      subscribeNotes(true)
    }
  }, [pageSize])

  const updateLastLoad: () => void = () => {
    setLastLoadAt(getUnixTime(new Date()) - 5)
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    updateLastLoad()
    setNewNotesCount(0)
  }, [])

  const subscribeNotes: (past?: boolean) => void = async (past) => {
    if (!database || !publicKey) return

    const message: RelayFilters = {
      kinds: [Kind.Text, Kind.RecommendRelay],
      limit: pageSize,
    }

    if (past) message.until = lastLoadAt

    relayPool?.subscribe('homepage-global-main', [message])
    setRefreshing(false)
    updateLastLoad()
  }

  const onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void = (event) => {
    if (handleInfinityScroll(event)) {
      setPageSize(pageSize + initialPageSize)
    }
  }

  const loadNotes: () => void = () => {
    if (database && publicKey) {
      if (lastLoadAt > 0) {
        getMainNotesCount(database, lastLoadAt).then(setNewNotesCount)
      }
      getMainNotes(database, publicKey, pageSize, false, {
        until: lastLoadAt,
      }).then((results) => {
        setRefreshing(false)
        if (results.length > 0) {
          setNotes(results)
          relayPool?.subscribe('homepage-global-meta', [
            {
              kinds: [Kind.Metadata],
              authors: results.map((note) => note.pubkey ?? ''),
            },
          ])
        }
      })
    }
  }

  const renderItem: ListRenderItem<Note> = ({ item, index }) => {
    return (
      <View style={styles.noteCard} key={item.id}>
        <NoteCard
          note={item}
          showActionCount={false}
          showAvatarImage={showPublicImages}
          showPreview={showPublicImages}
        />
      </View>
    )
  }

  const ListEmptyComponent = React.useMemo(
    () => (
      <View style={styles.blank}>
        <MaterialCommunityIcons
          name='account-group-outline'
          size={64}
          style={styles.center}
          color={theme.colors.onPrimaryContainer}
        />
        <Text variant='headlineSmall' style={styles.center}>
          {t('homeFeed.emptyTitle')}
        </Text>
        <Text variant='bodyMedium' style={styles.center}>
          {t('homeFeed.emptyDescription')}
        </Text>
        <Button mode='contained' compact onPress={() => navigation.jumpTo('contacts')}>
          {t('homeFeed.emptyButton')}
        </Button>
      </View>
    ),
    [],
  )

  return (
    <View>
      {newNotesCount > 0 && (
        <View style={styles.refreshChipWrapper}>
          <Chip
            icon={() => (
              <MaterialCommunityIcons name='cached' color={theme.colors.onSurface} size={20} />
            )}
            onPress={onRefresh}
            // visible={newNotesCount > 0}
            compact
            elevated
            style={styles.refreshChip}
          >
            {t(newNotesCount < 2 ? 'homeFeed.newMessage' : 'homeFeed.newMessages', {
              newNotesCount,
            })}
          </Chip>
        </View>
      )}
      <View style={styles.list}>
        <FlashList
          estimatedItemSize={200}
          showsVerticalScrollIndicator={false}
          data={notes}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onScroll={onScroll}
          refreshing={refreshing}
          ListEmptyComponent={ListEmptyComponent}
          horizontal={false}
          ListFooterComponent={<ActivityIndicator animating={true} />}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  list: {
    height: '100%',
  },
  refreshChipWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshChip: {
    marginTop: 16,
  },
  noteCard: {
    marginTop: 16,
  },
  center: {
    alignContent: 'center',
    textAlign: 'center',
  },
  blank: {
    justifyContent: 'space-between',
    height: 220,
    marginTop: 91,
  },
  activityIndicator: {
    padding: 16,
  },
})

export default GlobalFeed
