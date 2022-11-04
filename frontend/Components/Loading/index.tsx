import React from 'react'
import { Animated, Easing } from 'react-native'
import { SvgXml } from 'react-native-svg'

interface LoadingProps {
  style?: object
}

export const Loading: React.FC<LoadingProps> = ({ style = {} }) => {
  const logo =
    '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.dev/svgjs" viewBox="0 0 800 800"><g stroke="hsl(0, 0%, 100%)" fill="none" stroke-linecap="round" style="--darkreader-inline-stroke: #e8e6e3;" data-darkreader-inline-stroke=""><circle r="256" cx="400" cy="400" stroke-width="24" stroke-dasharray="68 51" stroke-dashoffset="25" transform="rotate(309, 400, 400)" opacity="1.00"></circle><circle r="224" cx="400" cy="400" stroke-width="23" stroke-dasharray="76 63" stroke-dashoffset="25" transform="rotate(258, 400, 400)" opacity="0.86"></circle><circle r="192" cx="400" cy="400" stroke-width="22" stroke-dasharray="63 31" stroke-dashoffset="25" transform="rotate(74, 400, 400)" opacity="0.73"></circle><circle r="160" cx="400" cy="400" stroke-width="21" stroke-dasharray="75 71" stroke-dashoffset="25" transform="rotate(62, 400, 400)" opacity="0.59"></circle><circle r="128" cx="400" cy="400" stroke-width="21" stroke-dasharray="43 37" stroke-dashoffset="25" transform="rotate(333, 400, 400)" opacity="0.46"></circle><circle r="96" cx="400" cy="400" stroke-width="20" stroke-dasharray="65 73" stroke-dashoffset="25" transform="rotate(17, 400, 400)" opacity="0.32"></circle><circle r="64" cx="400" cy="400" stroke-width="19" stroke-dasharray="33 58" stroke-dashoffset="25" transform="rotate(269, 400, 400)" opacity="0.19"></circle><circle r="32" cx="400" cy="400" stroke-width="18" stroke-dasharray="66 52" stroke-dashoffset="25" transform="rotate(281, 400, 400)" opacity="0.05"></circle></g></svg>'

  const spinValue = new Animated.Value(0)
  Animated.timing(spinValue, {
    toValue: 1,
    duration: 200000,
    easing: Easing.linear, // Easing is an additional import from react-native
    useNativeDriver: true, // To make use of native driver for performance
  }).start()
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '4032deg'],
  })

  return (
    <Animated.View style={{ ...style, ...{ transform: [{ rotate: spin }] } }}>
      <SvgXml xml={logo} />
    </Animated.View>
  )
}

export default Loading
