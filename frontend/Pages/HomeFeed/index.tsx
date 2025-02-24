import React, { useContext } from 'react'
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native'
import { UserContext } from '../../Contexts/UserContext'
import { RelayPoolContext } from '../../Contexts/RelayPoolContext'
import { AnimatedFAB, Text, TouchableRipple } from 'react-native-paper'
import { useFocusEffect, useTheme } from '@react-navigation/native'
import { navigate } from '../../lib/Navigation'
import { t } from 'i18next'
import GlobalFeed from '../GlobalFeed'
import MyFeed from '../MyFeed'
import ReactionsFeed from '../ReactionsFeed'
import RepostsFeed from '../RepostsFeed'

interface HomeFeedProps {
  navigation: any
}

export const HomeFeed: React.FC<HomeFeedProps> = ({ navigation }) => {
  const theme = useTheme()
  const { privateKey } = useContext(UserContext)
  const { relayPool } = useContext(RelayPoolContext)
  const [tabKey, setTabKey] = React.useState('myFeed')

  useFocusEffect(
    React.useCallback(() => {
      return () =>
        relayPool?.unsubscribe([
          'homepage-global-main',
          'homepage-contacts-main',
          'homepage-reactions',
          'homepage-contacts-meta',
          'homepage-replies',
        ])
    }, []),
  )

  const renderScene: Record<string, JSX.Element> = {
    globalFeed: <GlobalFeed navigation={navigation} />,
    myFeed: <MyFeed navigation={navigation} />,
    reactions: <ReactionsFeed navigation={navigation} />,
    reposts: <RepostsFeed navigation={navigation} />,
  }

  return (
    <View>
      <View style={styles.tabsNavigator}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View
            style={[
              styles.tab,
              {
                borderBottomColor:
                  tabKey === 'globalFeed' ? theme.colors.primary : theme.colors.border,
                borderBottomWidth: tabKey === 'globalFeed' ? 3 : 1,
              },
            ]}
          >
            <TouchableRipple
              style={styles.textWrapper}
              onPress={() => {
                relayPool?.unsubscribe([
                  'homepage-contacts-main',
                  'homepage-reactions',
                  'homepage-contacts-meta',
                  'homepage-replies',
                ])
                setTabKey('globalFeed')
              }}
            >
              <Text style={styles.tabText}>{t('homeFeed.globalFeed')}</Text>
            </TouchableRipple>
          </View>
          <View
            style={[
              styles.tab,
              {
                borderBottomColor: tabKey === 'myFeed' ? theme.colors.primary : theme.colors.border,
                borderBottomWidth: tabKey === 'myFeed' ? 3 : 1,
              },
            ]}
          >
            <TouchableRipple
              style={styles.textWrapper}
              onPress={() => {
                relayPool?.unsubscribe(['homepage-global-main'])
                setTabKey('myFeed')
              }}
            >
              <Text style={styles.tabText}>{t('homeFeed.myFeed')}</Text>
            </TouchableRipple>
          </View>
          <View
            style={[
              styles.tab,
              {
                borderBottomColor:
                  tabKey === 'reactions' ? theme.colors.primary : theme.colors.border,
                borderBottomWidth: tabKey === 'reactions' ? 3 : 1,
              },
            ]}
          >
            <TouchableRipple
              style={styles.textWrapper}
              onPress={() => {
                relayPool?.unsubscribe(['homepage-global-main'])
                setTabKey('reactions')
              }}
            >
              <Text style={styles.tabText}>{t('homeFeed.reactions')}</Text>
            </TouchableRipple>
          </View>
          <View
            style={[
              styles.tab,
              {
                borderBottomColor:
                  tabKey === 'reposts' ? theme.colors.primary : theme.colors.border,
                borderBottomWidth: tabKey === 'reposts' ? 3 : 1,
              },
            ]}
          >
            <TouchableRipple
              style={styles.textWrapper}
              onPress={() => {
                relayPool?.unsubscribe(['homepage-global-main'])
                setTabKey('reposts')
              }}
            >
              <Text style={styles.tabText}>{t('homeFeed.reposts')}</Text>
            </TouchableRipple>
          </View>
        </ScrollView>
      </View>
      <View style={styles.feed}>{renderScene[tabKey]}</View>
      {privateKey && (
        <AnimatedFAB
          style={[styles.fab, { top: Dimensions.get('window').height - 216 }]}
          icon='pencil-outline'
          label='Label'
          onPress={() => navigate('Send')}
          animateFrom='right'
          iconMode='static'
          extended={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  noteCard: {
    marginBottom: 16,
  },
  fab: {
    right: 16,
    position: 'absolute',
  },
  container: {
    padding: 16,
  },
  center: {
    alignContent: 'center',
    textAlign: 'center',
  },
  blank: {
    justifyContent: 'space-between',
    height: 252,
    marginTop: 75,
    padding: 16,
  },
  tab: {
    width: 160,
  },
  textWrapper: {
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
  },
  tabText: {
    textAlign: 'center',
  },
  tabsNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  feed: {
    paddingBottom: 95,
    paddingLeft: 16,
    paddingRight: 16,
  },
})

export default HomeFeed
