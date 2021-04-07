import { ApiResponse } from "apisauce"
import { Api } from "./api"
import { GetCharactersResult } from "./api.types"
import { getGeneralApiProblem } from "./api-problem"

type GetRoutesResult = {
  MessageType: number
  Message: string | null
  Data: {
    Routes: [any]
  }
}

export class RouteApi {
  private api: Api

  constructor(api: Api) {
    this.api = api
  }

  async getRoutes(originId: string, destId: string, date: string, hour: string) {
    const response: ApiResponse<GetRoutesResult> = await this.api.apisauce.get(
      `/GetRoutes?OId=680&TId=3700&Date=20210407&Hour=1830`,
    )

    if (response.data.MessageType === 1) {
      // TODO: Handle API errors
    }

    const formattedRoutes = response.data.Data.Routes.map((route) => {
      const { Train, IsExchange, EstTime } = route
      const { DepartureTime, ArrivalTime, StopStations } = Train[0]

      const stopStations = StopStations.map((station) => {
        const { StationId: stationId, ArrivalTime: arrivalTime, DepartureTime: departureTime, Platform: platform } = station
        return { stationId, arrivalTime, departureTime, platform }
      })

      return {
        isExchange: IsExchange,
        estTime: EstTime,
        departureTime: DepartureTime,
        arrivalTime: ArrivalTime,
        stopStations,
      }
    })

    return formattedRoutes
  }
}
