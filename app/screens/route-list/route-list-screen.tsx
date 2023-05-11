import React, { useEffect, useMemo, useState } from "react"
import { observer } from "mobx-react-lite"
import { View, ActivityIndicator, ViewStyle } from "react-native"
import { RouteListScreenProps } from "../../navigators/main-navigator"
import { Screen, RouteDetailsHeader, RouteCard, RouteCardHeight } from "../../components"
import { useStores } from "../../models"
import { color, spacing } from "../../theme"
import { closestIndexTo } from "date-fns"
import { RouteItem } from "../../services/api"
import { RouteListModal } from "./components/route-list-modal"
import { SharedElement } from "react-navigation-shared-element"
import { useQuery } from "react-query"
import { NoTrainsFoundMessage } from "./components/no-trains-found-msg"
import { useNetInfo } from "@react-native-community/netinfo"
import { NoInternetConnection } from "./components/no-internet-connection"
import { FlashList } from "@shopify/flash-list"

const ROOT: ViewStyle = {
  backgroundColor: color.background,
  flex: 1,
}

export const RouteListScreen = observer(function RouteListScreen({ navigation, route }: RouteListScreenProps) {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const { trainRoutes, routePlan, ride } = useStores()
  const { originId, destinationId, time, enableQuery } = route.params

  const { isInternetReachable } = useNetInfo()

  // this is for the screen to re-render when the user navigates back from the route details screen
  // and the user has started a ride - so the route card will be highlighted

  const trains = useQuery(
    ["origin", originId, "destination", destinationId, "time", routePlan.date.getDate()],
    async () => {
      const result = await trainRoutes.getRoutes(originId, destinationId, time)
      return result
    },
    { enabled: enableQuery, retry: false },
  )

  // Set the initial scroll index, since the Israel Rail API ignores the supplied time and
  // returns a route list for the whole day.
  const initialScrollIndex = useMemo(() => {
    if (trains.isSuccess) {
      let index

      if (routePlan.dateType === "departure") {
        const departureTimes = trains.data.map((route) => route.trains[0].departureTime)
        index = closestIndexTo(route.params.time, departureTimes)
      } else if (routePlan.dateType === "arrival") {
        const arrivalTimes = trains.data.map((route) => route.trains[0].arrivalTime)
        index = closestIndexTo(route.params.time, arrivalTimes)
      }

      return index
    }

    return undefined
  }, [trains.isSuccess])

  useEffect(() => {
    if (trainRoutes.resultType === "different-date") {
      setIsModalVisible(true)
    }
  }, [trainRoutes.resultType])

  const renderRouteCard = ({ item }: { item: RouteItem }) => {
    const departureTime = item.trains[0].departureTime
    let arrivalTime = item.trains[0].arrivalTime
    let stops = 0

    // If the train contains an exchange, change to arrival time to the last stop from the last train
    if (item.isExchange) {
      stops = item.trains.length - 1
      arrivalTime = item.trains[stops].arrivalTime
    }

    return (
      <RouteCard
        duration={item.duration}
        isMuchShorter={item.isMuchShorter}
        isMuchLonger={item.isMuchLonger}
        stops={stops}
        departureTime={departureTime}
        arrivalTime={arrivalTime}
        delay={item.delay}
        isActiveRide={ride.isRouteActive(item)}
        onPress={() =>
          navigation.navigate("routeDetails", {
            routeItem: item,
            originId: route.params.originId,
            destinationId: route.params.destinationId,
          })
        }
        style={{ marginBottom: spacing[3] }}
      />
    )
  }

  return (
    <Screen
      style={ROOT}
      preset="fixed"
      unsafe={true}
      statusBar="light-content"
      statusBarBackgroundColor="transparent"
      translucent
    >
      <SharedElement id="route-header">
        <RouteDetailsHeader
          originId={route.params.originId}
          destinationId={route.params.destinationId}
          style={{ paddingHorizontal: spacing[3], marginBottom: spacing[3] }}
        />
      </SharedElement>

      {!isInternetReachable && !trains.data && <NoInternetConnection />}

      {trains.status === "loading" && <ActivityIndicator size="large" style={{ marginTop: spacing[6] }} color="grey" />}

      {trains.status === "success" && trains.data.length > 0 && (
        <FlashList
          renderItem={renderRouteCard}
          keyExtractor={(item) => item.trains.map((train) => train.trainNumber).join()}
          data={trains.data}
          contentContainerStyle={{ paddingTop: spacing[4], paddingHorizontal: spacing[3], paddingBottom: spacing[3] }}
          estimatedItemSize={RouteCardHeight + spacing[3]}
          initialScrollIndex={initialScrollIndex}
          // so the list will re-render when the ride route changes, and so the item will be marked
          extraData={ride.route}
        />
      )}

      {trainRoutes.resultType === "not-found" && (
        <View style={{ marginTop: spacing[4] }}>
          <NoTrainsFoundMessage />
        </View>
      )}

      {trains.isSuccess && trains.data?.length > 0 && (
        <RouteListModal
          isVisible={isModalVisible}
          onOk={() => setIsModalVisible(false)}
          routesDate={trains.data[0].trains[0].departureTime}
        />
      )}
    </Screen>
  )
})
