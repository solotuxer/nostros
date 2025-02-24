import React, { useContext, useState } from 'react'
import { FlatList, ListRenderItem, ScrollView, StyleSheet, View } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { useTranslation } from 'react-i18next'
import { RelayPoolContext } from '../../Contexts/RelayPoolContext'
import { Relay } from '../../Functions/DatabaseFunctions/Relays'
import { defaultRelays, REGEX_SOCKET_LINK } from '../../Constants/Relay'
import {
  List,
  Switch,
  AnimatedFAB,
  useTheme,
  Text,
  Button,
  TextInput,
  IconButton,
  Divider,
  Snackbar,
} from 'react-native-paper'
import RBSheet from 'react-native-raw-bottom-sheet'
import { relayToColor } from '../../Functions/NativeFunctions'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

export const RelaysPage: React.FC = () => {
  const defaultRelayInput = React.useMemo(() => 'wss://', [])
  const { updateRelayItem, addRelayItem, removeRelayItem, relays } = useContext(RelayPoolContext)
  const { t } = useTranslation('common')
  const theme = useTheme()
  const bottomSheetAddRef = React.useRef<RBSheet>(null)
  const bottomSheetEditRef = React.useRef<RBSheet>(null)
  const [selectedRelay, setSelectedRelay] = useState<Relay>()
  const [addRelayInput, setAddRelayInput] = useState<string>(defaultRelayInput)
  const [showNotification, setShowNotification] = useState<string>()

  const addRelay: (url: string) => void = (url) => {
    addRelayItem({
      url,
      active: 1,
      global_feed: 1,
    }).then(() => {
      setShowNotification('add')
    })
  }

  const removeRelay: (url: string) => void = (url) => {
    removeRelayItem({
      url,
    }).then(() => {
      setShowNotification('remove')
    })
  }

  const activeRelay: (relay: Relay) => void = (relay) => {
    relay.active = 1
    updateRelayItem(relay).then(() => {
      setShowNotification('active')
    })
  }

  const desactiveRelay: (relay: Relay) => void = (relay) => {
    relay.active = 0
    relay.global_feed = 0
    updateRelayItem(relay).then(() => {
      setShowNotification('desactive')
    })
  }

  const activeGlobalFeedRelay: (relay: Relay) => void = (relay) => {
    relay.active = 1
    relay.global_feed = 1
    updateRelayItem(relay).then(() => {
      setShowNotification('globalFeedActive')
    })
  }

  const desactiveGlobalFeedRelay: (relay: Relay) => void = (relay) => {
    relay.global_feed = 0
    updateRelayItem(relay).then(() => {
      setShowNotification('globalFeedActiveUnactive')
    })
  }

  const onPressAddRelay: () => void = () => {
    if (REGEX_SOCKET_LINK.test(addRelayInput)) {
      if (relays.find((relay) => relay.url === addRelayInput)) {
        setShowNotification('alreadyExists')
      } else {
        addRelay(addRelayInput)
        setAddRelayInput(defaultRelayInput)
      }
    } else {
      setShowNotification('badFormat')
    }
    bottomSheetAddRef.current?.close()
  }

  const rbSheetCustomStyles = React.useMemo(() => {
    return {
      container: {
        backgroundColor: theme.colors.background,
        paddingTop: 16,
        paddingRight: 16,
        paddingBottom: 32,
        paddingLeft: 16,
        borderTopRightRadius: 28,
        borderTopLeftRadius: 28,
        height: 'auto',
      },
    }
  }, [])

  const myRelays = relays
    .filter((relay) => !defaultRelays.includes(relay.url))
    .sort((a, b) => {
      if (a.url > b.url) return 1
      if (a.url < b.url) return -1
      return 0
    })

  const renderItem: ListRenderItem<Relay> = ({ item, index }) => {
    return (
      <List.Item
        key={index}
        title={item.url.split('wss://')[1]?.split('/')[0]}
        right={() => (
          <>
            <Switch
              value={item.global_feed !== undefined && item.global_feed > 0}
              onValueChange={() =>
                item.global_feed ? desactiveGlobalFeedRelay(item) : activeGlobalFeedRelay(item)
              }
            />
            <Switch
              style={styles.switch}
              value={item.active !== undefined && item.active > 0}
              onValueChange={() => (item.active ? desactiveRelay(item) : activeRelay(item))}
            />
          </>
        )}
        left={() => (
          <MaterialCommunityIcons
            style={styles.relayColor}
            name='circle'
            color={relayToColor(item.url)}
          />
        )}
        onPress={() => {
          setSelectedRelay(item)
          bottomSheetEditRef.current?.open()
        }}
      />
    )
  }

  return (
    <View style={styles.container}>
      <List.Item
        title={t('relaysPage.relayName')}
        right={() => (
          <>
            <Text style={styles.listHeader}>{t('relaysPage.globalFeed')}</Text>
            <Text style={styles.listHeader}>{t('relaysPage.active')}</Text>
          </>
        )}
      />
      <ScrollView horizontal={false}>
        {myRelays.length > 0 && (
          <>
            <View style={styles.titleWrapper}>
              <Text style={styles.title} variant='titleMedium'>
                {t('relaysPage.myList')}
              </Text>
              <Divider/>
            </View>
            <FlatList
              showsVerticalScrollIndicator={false}
              data={myRelays}
              renderItem={renderItem}
            />
          </>
        )}
        <View style={styles.titleWrapper}>
          <Text style={styles.title} variant='titleMedium'>
            {t('relaysPage.recommended')}
          </Text>
          <Divider/>
        </View>
        <FlatList
          showsVerticalScrollIndicator={false}
          data={defaultRelays.map(
            (url) =>
              relays.find((relay) => relay.url === url && relay.active && relay.active > 0) ?? {
                url,
              },
          )}
          renderItem={renderItem}
          style={styles.list}
        />
      </ScrollView>
      <AnimatedFAB
        style={styles.fab}
        icon='plus'
        label='Add'
        onPress={() => bottomSheetAddRef.current?.open()}
        animateFrom='right'
        iconMode='static'
        extended={false}
      />
      {showNotification && (
        <Snackbar
          style={styles.snackbar}
          visible={showNotification !== undefined}
          duration={Snackbar.DURATION_SHORT}
          onIconPress={() => setShowNotification(undefined)}
          onDismiss={() => setShowNotification(undefined)}
        >
          {t(`relaysPage.notifications.${showNotification}`)}
        </Snackbar>
      )}
      <RBSheet ref={bottomSheetAddRef} closeOnDragDown={true} customStyles={rbSheetCustomStyles}>
        <View style={styles.addRelay}>
          <View style={styles.bottomDrawerButton}>
            <TextInput
              mode='outlined'
              label={t('relaysPage.labelAdd') ?? ''}
              onChangeText={setAddRelayInput}
              value={addRelayInput}
            />
          </View>
          <View style={styles.bottomDrawerButton}>
            <Button mode='contained' onPress={onPressAddRelay}>
              {t('relaysPage.add')}
            </Button>
          </View>
          <Button
            mode='outlined'
            onPress={() => {
              bottomSheetAddRef.current?.close()
              setAddRelayInput(defaultRelayInput)
            }}
          >
            {t('relaysPage.cancel')}
          </Button>
        </View>
      </RBSheet>
      <RBSheet ref={bottomSheetEditRef} closeOnDragDown={true} customStyles={rbSheetCustomStyles}>
        <View>
          <View style={styles.relayActions}>
            <View style={styles.actionButton}>
              <IconButton
                icon='trash-can-outline'
                size={28}
                onPress={() => {
                  if (selectedRelay) removeRelay(selectedRelay.url)
                  bottomSheetEditRef.current?.close()
                }}
              />
              <Text>{t('relaysPage.removeRelay')}</Text>
            </View>
            <View style={styles.actionButton}>
              <IconButton
                icon='content-copy'
                size={28}
                onPress={() => {
                  if (selectedRelay) Clipboard.setString(selectedRelay.url)
                }}
              />
              <Text>{t('relaysPage.copyRelay')}</Text>
            </View>
          </View>
          <Divider style={styles.divider} />
          <Text variant='titleLarge'>{selectedRelay?.url.split('wss://')[1]?.split('/')[0]}</Text>
        </View>
      </RBSheet>
    </View>
  )
}

const styles = StyleSheet.create({
  titleWrapper: {
    marginBottom: 4,
    marginTop: 24,
    paddingRight: 16,
  },
  title: {
    marginBottom: 8,
  },
  bottomDrawerButton: {
    paddingBottom: 16,
  },
  container: {
    padding: 0,
    paddingLeft: 16,
  },
  list: {
    paddingBottom: 130,
  },
  snackbar: {
    margin: 16,
    bottom: 70,
  },
  relayColor: {
    paddingTop: 9,
  },
  switch: {
    marginLeft: 32,
  },
  listHeader: {
    paddingRight: 5,
    paddingLeft: 16,
    textAlign: 'center',
  },
  fab: {
    bottom: 65,
    right: 16,
    position: 'absolute',
  },
  addRelay: {
    alignContent: 'center',
    justifyContent: 'space-between',
  },
  relayActions: {
    flexDirection: 'row',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  divider: {
    marginBottom: 26,
    marginTop: 26,
  },
})

export default RelaysPage
