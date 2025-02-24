import React, { useContext, useEffect, useState } from 'react'
import { FlatList, ListRenderItem, StyleSheet, View } from 'react-native'
import { AppContext } from '../../Contexts/AppContext'
import { Event } from '../../lib/nostr/Events'
import { useTranslation } from 'react-i18next'
import { RelayPoolContext } from '../../Contexts/RelayPoolContext'
import getUnixTime from 'date-fns/getUnixTime'
import { Note } from '../../Functions/DatabaseFunctions/Notes'
import { getETags, getTaggedPubKeys } from '../../Functions/RelayFunctions/Events'
import { getUsers, User } from '../../Functions/DatabaseFunctions/Users'
import { formatPubKey } from '../../Functions/RelayFunctions/Users'
import { Asset, launchImageLibrary } from 'react-native-image-picker'
import {
  Button,
  Card,
  Divider,
  IconButton,
  Snackbar,
  Switch,
  Text,
  TextInput,
  TouchableRipple,
  useTheme,
} from 'react-native-paper'
import { UserContext } from '../../Contexts/UserContext'
import { goBack } from '../../lib/Navigation'
import { Kind } from 'nostr-tools'
import ProfileData from '../../Components/ProfileData'
import NoteCard from '../../Components/NoteCard'
import { imageHostingServices } from '../../Constants/Services'
import RBSheet from 'react-native-raw-bottom-sheet'

interface SendPageProps {
  route: { params: { note: Note; type?: 'reply' | 'repost' } | undefined }
}

export const SendPage: React.FC<SendPageProps> = ({ route }) => {
  const theme = useTheme()
  const { database, getImageHostingService } = useContext(AppContext)
  const { publicKey } = useContext(UserContext)
  const { relayPool, lastConfirmationtId } = useContext(RelayPoolContext)
  const { t } = useTranslation('common')
  // state
  const [showNotification, setShowNotification] = useState<undefined | string>()
  const [uploadingFile, setUploadingFile] = useState<boolean>(false)
  const [content, setContent] = useState<string>('')
  const [contentWarning, setContentWarning] = useState<boolean>(false)
  const [userSuggestions, setUserSuggestions] = useState<User[]>([])
  const [userMentions, setUserMentions] = useState<User[]>([])
  const [isSending, setIsSending] = useState<boolean>(false)
  const [imageUpload, setImageUpload] = useState<Asset>()
  const note = React.useMemo(() => route.params?.note, [])
  const [imageHostingService] = useState<string>(getImageHostingService())
  const bottomSheetImageRef = React.useRef<RBSheet>(null)

  useEffect(() => {
    if (isSending) goBack()
  }, [lastConfirmationtId])

  const onChangeText: (text: string) => void = (text) => {
    const match = text.match(/.*@(.*)$/)
    const note: Note | undefined = route.params?.note
    if (database && match && match?.length > 0) {
      let request = getUsers(database, { name: match[1], order: 'contact DESC,name ASC' })

      if (match[1] === '' && note) {
        const taggedPubKeys = getTaggedPubKeys(note)
        request = getUsers(database, {
          includeIds: [...taggedPubKeys, note.pubkey],
          order: 'contact DESC,name ASC',
        })
      }

      request.then((results) => {
        setUserSuggestions(results.filter((item) => item.id !== publicKey))
      })
    } else {
      setUserSuggestions([])
    }
    setContent(text)
  }

  const mentionText: (user: User) => string = (user) => {
    return `@${user.name ?? formatPubKey(user.id)}`
  }

  const getImage: () => void = () => {
    launchImageLibrary({ selectionLimit: 1, mediaType: 'photo' }, async (result) => {
      const assets = result?.assets
      if (assets && assets.length > 0) {
        const file = assets[0]
        if (file.uri && file.type && file.fileName) {
          setImageUpload(file)
          bottomSheetImageRef.current?.open()
        } else {
          setUploadingFile(false)
          setShowNotification('imageUploadErro')
        }
      } else {
        setUploadingFile(false)
        setShowNotification('imageUploadErro')
      }
    })
  }

  const uploadImage: () => void = async () => {
    if (imageUpload?.uri && imageUpload.type && imageUpload.fileName) {
      imageHostingServices[imageHostingService]
        .sendFunction(imageUpload.uri, imageUpload.type, imageUpload.fileName)
        .then((imageUri) => {
          bottomSheetImageRef.current?.close()
          setUploadingFile(false)
          setContent((prev) => `${prev}\n\n${imageUri}`)
          setImageUpload(undefined)
          setShowNotification('imageUploaded')
        })
        .catch(() => {
          bottomSheetImageRef.current?.close()
          setUploadingFile(false)
          setShowNotification('imageUploadErro')
        })
    }
  }

  const onPressSend: () => void = () => {
    if (database && publicKey) {
      setIsSending(true)
      let tags: string[][] = []

      let rawContent = content

      if (note?.id) {
        if (route.params?.type === 'reply') {
          tags = note.tags
          if (getETags(note).length === 0) {
            tags.push(['e', note.id, '', 'root'])
          } else {
            tags.push(['e', note.id, '', 'reply'])
          }
          tags.push(['p', note.pubkey, ''])
        } else if (route.params?.type === 'repost') {
          rawContent = `#[${tags.length}] ${rawContent}`
          tags.push(['e', note.id, '', ''])
        }
      }

      if (contentWarning) tags.push(['content-warning', ''])

      if (userMentions.length > 0) {
        userMentions.forEach((user) => {
          const userText = mentionText(user)
          if (rawContent.includes(userText)) {
            rawContent = rawContent.replace(userText, `#[${tags.length}]`)
            tags.push(['p', user.id])
          }
        })
      }

      const event: Event = {
        content: rawContent,
        created_at: getUnixTime(new Date()),
        kind: Kind.Text,
        pubkey: publicKey,
        tags,
      }
      relayPool?.sendEvent(event).catch(() => {})
    }
  }

  const addUserMention: (user: User) => void = (user) => {
    setUserMentions((prev) => {
      prev.push(user)
      return prev
    })
    setContent((prev) => {
      const splitText = prev.split('@')
      splitText.pop()
      return `${splitText.join('@')}${mentionText(user)} `
    })
    setUserSuggestions([])
  }

  const renderContactItem: ListRenderItem<User> = ({ item, index }) => (
    <TouchableRipple onPress={() => addUserMention(item)}>
      <View key={index} style={styles.contactRow}>
        <ProfileData
          username={item?.name}
          publicKey={item?.id}
          validNip05={item?.valid_nip05}
          nip05={item?.nip05}
          lud06={item?.lnurl}
          picture={item?.picture}
          avatarSize={40}
        />
        <View style={styles.contactFollow}>
          <Text>{item.contact ? t('sendPage.isContact') : t('sendPage.isNotContact')}</Text>
        </View>
      </View>
    </TouchableRipple>
  )

  const bottomSheetStyles = React.useMemo(() => {
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

  return (
    <>
      <View style={[styles.textInputContainer, { paddingBottom: note ? 200 : 10 }]}>
        {note && (
          <View style={styles.noteCard}>
            <NoteCard
              note={note}
              showAction={false}
              showPreview={false}
              showAnswerData={false}
              showRepostPreview={false}
              numberOfLines={5}
            />
          </View>
        )}
        <View style={styles.textInput}>
          <TextInput
            ref={(ref) => ref?.focus()}
            mode='outlined'
            multiline
            numberOfLines={30}
            outlineStyle={{ borderColor: 'transparent' }}
            value={content}
            onChangeText={onChangeText}
            scrollEnabled
          />
        </View>
      </View>
      <View style={styles.actions}>
        {userSuggestions.length > 0 ? (
          <View style={styles.contactsList}>
            <FlatList
              data={userSuggestions}
              renderItem={renderContactItem}
              ItemSeparatorComponent={Divider}
              horizontal={false}
            />
          </View>
        ) : (
          <View style={{ backgroundColor: theme.colors.elevation.level1 }}>
            <View style={styles.contentWarning}>
              <View style={styles.switchWrapper}>
                <Switch value={contentWarning} onValueChange={setContentWarning} />
                <Text>{t('sendPage.contentWarning')}</Text>
              </View>
              <IconButton
                icon='image-outline'
                size={25}
                style={styles.imageButton}
                onPress={getImage}
                disabled={uploadingFile}
              />
            </View>
            <View style={styles.send}>
              <Button
                mode='contained'
                onPress={onPressSend}
                disabled={route.params?.type !== 'repost' && (!content || content === '')}
                loading={isSending || uploadingFile}
              >
                {t('sendPage.send')}
              </Button>
            </View>
          </View>
        )}
      </View>
      <RBSheet ref={bottomSheetImageRef} closeOnDragDown={true} customStyles={bottomSheetStyles}>
        <Card style={styles.imageUploadPreview}>
          {imageUpload && (
            <Card.Cover source={{ uri: imageUpload?.uri ?? '' }} resizeMode='contain' />
          )}
        </Card>
        <Text>
          {t('sendPage.poweredBy', { uri: imageHostingServices[imageHostingService].uri })}
        </Text>
        <Button
          style={styles.buttonSpacer}
          mode='contained'
          onPress={uploadImage}
          loading={uploadingFile}
        >
          {t('sendPage.uploadImage')}
        </Button>
        <Button
          mode='outlined'
          onPress={() => {
            bottomSheetImageRef.current?.close()
            setImageUpload(undefined)
          }}
        >
          {t('sendPage.cancel')}
        </Button>
      </RBSheet>
      {showNotification && (
        <Snackbar
          style={styles.snackbar}
          visible={showNotification !== undefined}
          duration={Snackbar.DURATION_SHORT}
          onIconPress={() => setShowNotification(undefined)}
          onDismiss={() => setShowNotification(undefined)}
        >
          {t(`sendPage.${showNotification}`, {
            uri: imageHostingServices[imageHostingService].donation,
          })}
        </Snackbar>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  switchWrapper: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
  },
  snackbar: {
    margin: 16,
    bottom: 100,
  },
  textInputContainer: {
    flex: 1,
  },
  textInput: {
    paddingBottom: 0,
  },
  imageButton: {
    marginBottom: -13,
    marginTop: -8,
  },
  noteCard: {
    flexDirection: 'column-reverse',
    paddingLeft: 16,
    paddingRight: 16,
  },
  actions: {
    height: 100,
    flexDirection: 'column-reverse',
    zIndex: 999,
  },
  contactsList: {
    bottom: 0,
    maxHeight: 200,
  },
  contactRow: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  contactData: {
    paddingLeft: 16,
  },
  contactName: {
    flexDirection: 'row',
  },
  contactInfo: {
    flexDirection: 'row',
    alignContent: 'center',
  },
  contactFollow: {
    justifyContent: 'center',
  },
  contentWarning: {
    flexDirection: 'row',
    alignContent: 'center',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 16,
  },
  send: {
    padding: 16,
  },
  verifyIcon: {
    paddingTop: 4,
    paddingLeft: 5,
  },
  imageUploadPreview: {
    marginTop: 16,
    marginBottom: 16,
  },
  buttonSpacer: {
    marginTop: 16,
    marginBottom: 16,
  },
})

export default SendPage
