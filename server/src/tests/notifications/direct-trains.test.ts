import dayjs from "dayjs"
import { keyBy } from "lodash"

import { minutesInMs } from "../helpers/utils"
import { Status } from "../../types/notifications"
import { directRoute, stations, now, directDuration, ride } from "./mocks"
import {
  buildGetOnTrainNotifications,
  buildNextStationNotifications,
  buildGetOffTrainNotifications,
} from "../../utils/notify-utils"

beforeAll(() => {
  jest.mock("../../data/stations", () => ({
    stations,
    stationsObject: keyBy(stations, "id"),
  }))
})

test("build get on notification for direct train", () => {
  const getOnNotifications = buildGetOnTrainNotifications(directRoute, ride)

  expect(getOnNotifications).toMatchObject([
    {
      token: ride.token,
      state: {
        delay: 2,
        nextStationId: 10,
        status: Status.getOn,
      },
      time: dayjs(now - minutesInMs(1)),
      alert: {
        title: "Get on the train",
        text: "Take the train to Ashkelon from platform 6",
      },
    },
  ])
})

test("build next station notifications for direct train", () => {
  const nextStationNotifications = buildNextStationNotifications(directRoute, ride)

  expect(nextStationNotifications).toMatchObject([
    {
      token: ride.token,
      state: {
        delay: 2,
        nextStationId: 20,
        status: Status.inTransit,
      },
      time: dayjs(now + minutesInMs(1)),
    },
    {
      token: ride.token,
      state: {
        delay: 2,
        nextStationId: 30,
        status: Status.inTransit,
      },
      time: dayjs(now + minutesInMs(6)),
    },
  ])
})

test("build get off notifications for direct train", () => {
  const getOffNotifications = buildGetOffTrainNotifications(directRoute, ride)

  expect(getOffNotifications).toMatchObject([
    {
      token: ride.token,
      state: {
        delay: 2,
        nextStationId: 30,
        status: Status.inTransit,
      },
      time: dayjs(now + directDuration - minutesInMs(2)),
      alert: {
        title: "Prepare to get off",
        text: "The train will arrive shortly at Tel Aviv - Savidor Center",
      },
    },
    {
      token: ride.token,
      state: {
        delay: 2,
        nextStationId: 30,
        status: Status.getOff,
      },
      time: dayjs(now + directDuration - minutesInMs(1)),
      alert: {
        title: "Get off now",
        text: "The train arrived at Tel Aviv - Savidor Center",
      },
    },
    {
      token: ride.token,
      state: {
        delay: 2,
        nextStationId: 30,
        status: Status.arrived,
      },
      time: dayjs(now + directDuration),
    },
  ])
})
