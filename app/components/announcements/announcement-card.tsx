import { ViewStyle, Platform, View, TextStyle } from "react-native"
import TouchableScale from "react-native-touchable-scale"
import { fontScale, spacing, color } from "../../theme"
import { Text } from "../text/text"
import { openLink } from "../../utils/helpers/open-link"
import WebView from "react-native-webview"
import { removeHtmlTagsAndEntities } from "./announcements-utils"

const ANNOUNCEMENT_CARD: ViewStyle = {
  minHeight: 80 * fontScale,

  marginBottom: spacing[4],
  paddingVertical: spacing[3],
  paddingHorizontal: spacing[3],

  borderRadius: Platform.select({ ios: 12, android: 8 }),
  backgroundColor: Platform.select({ ios: color.tertiaryBackground, android: color.inputBackground }),
  shadowColor: color.palette.black,
  shadowOffset: { height: 0, width: 0 },
  shadowOpacity: 0.05,
  elevation: 1,
}

const TITLE_STYLE: TextStyle = {
  fontFamily: "Heebo",
  color: color.primary,
  fontSize: 16,
  marginBottom: spacing[0],
}

const BODY_STYLE: TextStyle = {
  fontFamily: "Heebo",
  fontSize: 14,
}

type AnnouncementCardProps = {
  title?: string
  body: string
  link?: string
}

export const AnnouncementCard = ({ title, body, link }: AnnouncementCardProps) => (
  <TouchableScale activeScale={0.98} friction={10} disabled={!link} onPress={() => openLink(link)}>
    <View style={ANNOUNCEMENT_CARD}>
      {title && <Text style={TITLE_STYLE}>{title}</Text>}

      <Text style={BODY_STYLE}>{removeHtmlTagsAndEntities(body)}</Text>
    </View>
  </TouchableScale>
)
