import dayjs from "dayjs"
import { keys, last, isEmpty, omit } from "lodash"
import { scheduleJob, Job, RecurrenceRule } from "node-schedule"

import { env } from "../data/config"
import { Ride } from "../types/rides"
import { RouteItem } from "../types/rail"
import { logger, logNames } from "../logs"
import { sendNotification } from "./notify"
import { getRouteForRide } from "../requests"
import { endRideNotifications } from "./index"
import { rideUpdateSecond } from "../utils/notify-utils"
import { buildNotifications } from "../utils/ride-utils"
import { NotificationPayload } from "../types/notifications"
import { deleteRide, updateLastRideNotification } from "../data/redis"

export class Scheduler {
  private ride: Ride
  private route: RouteItem
  private updateDelayJob?: Job
  private jobs: Record<string, Job>
  private lastSentNotification?: NotificationPayload

  private constructor(ride: Ride, route: RouteItem) {
    this.jobs = {}
    this.ride = ride
    this.route = route
  }

  static async create(ride: Ride) {
    const route = await getRouteForRide(ride)
    if (!route) {
      return null
    }

    if (env === "production" && Date.now() >= route.arrivalTime) {
      logger.failed(logNames.scheduler.rideInPast, {
        date: ride.departureDate,
        origin: ride.originId,
        destination: ride.destinationId,
        trains: ride.trains,
      })
      deleteRide(ride.token)
      return null
    }

    const instance = new Scheduler(ride, route)
    return instance
  }

  start() {
    const notifications = this.buildRideNotifications(true)

    if (env === "production") {
      this.startUpdateDelayJob()
    }

    notifications.forEach((notification) => {
      const notificationTime = notification.time.add(notification.state.delay, "minutes").toDate()
      this.jobs[notification.id] = scheduleJob(notificationTime, () => {
        sendNotification(notification)
        this.lastSentNotification = notification

        delete this.jobs[notification.id]
        if (last(notifications)?.id === notification.id) {
          endRideNotifications(this.ride.token)
        } else {
          this.ride.lastNotificationId = notification.id
          updateLastRideNotification(this.ride.token, notification.id)
        }
      })
    })
  }

  stop() {
    for (const jobId in keys(this.jobs)) {
      this.jobs[jobId]?.cancel()
      delete this.jobs[jobId]
    }

    this.stopUpdateDelayJob()
    return deleteRide(this.ride.token)
  }

  private buildRideNotifications(isInitialRun: boolean = false) {
    const notifications = buildNotifications(this.route, this.ride, true, this.lastSentNotification?.id)

    if (env === "production") {
      if (isInitialRun && notifications[0]) {
        this.ride.lastNotificationId = notifications[0].id - 1
        updateLastRideNotification(this.ride.token, this.ride.lastNotificationId)
      }

      return notifications
    } else {
      // Test ride, send notifications every 15 seconds
      let lastDate = dayjs()
      return notifications.map((notification) => {
        lastDate = lastDate.add(15, "seconds")

        return {
          ...notification,
          time: lastDate,
          state: {
            ...notification.state,
            delay: 0,
          },
        }
      })
    }
  }

  private startUpdateDelayJob() {
    const second = rideUpdateSecond(this.ride.token)

    const rule = new RecurrenceRule()
    rule.second = second

    logger.info(logNames.scheduler.updateDelay.register, { token: this.ride.token, second })
    this.updateDelayJob = scheduleJob(rule, async () => {
      if (isEmpty(this.jobs)) {
        return this.stopUpdateDelayJob()
      }

      const newRoute = await getRouteForRide(this.ride)
      if (!newRoute) return

      if (this.lastSentNotification) {
        const notifications = buildNotifications(newRoute, this.ride, false)
        const notification = notifications.find((notification) => notification.id === this.lastSentNotification?.id)
        if (notification && this.lastSentNotification?.state.delay !== notification.state.delay) {
          this.lastSentNotification = notification
          sendNotification(omit(notification, "alert"))
        }
      }

      this.route = newRoute
      const notifications = this.buildRideNotifications()
      logger.info(logNames.scheduler.updateDelay.updated, { token: this.ride.token, delay: notifications[0].state.delay })

      notifications.forEach((notification) => {
        const notificationTime = notification.time.add(notification.state.delay, "minutes")

        if (notificationTime.isBefore(dayjs())) {
          this.jobs[notification.id]?.invoke()
        } else {
          this.jobs[notification.id]?.reschedule(notificationTime.valueOf())
        }
      })
    })
  }

  private stopUpdateDelayJob() {
    this.updateDelayJob?.cancel()
    this.updateDelayJob = undefined
    logger.info(logNames.scheduler.updateDelay.cancel, { token: this.ride.token })
  }
}
