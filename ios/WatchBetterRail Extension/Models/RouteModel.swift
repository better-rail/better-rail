import Foundation

// MARK: - RouteResult
struct RouteResult: Decodable {
    let MessageType: Int
    let Message: String?
    let Data: DataClass
}

// MARK: - DataClass
struct DataClass: Decodable {
  let Error: String?
  let Routes: [Route]
}

// MARK: - Station
//struct Station: Decodable {
//    let StationNumber: Int
//    let OmesPercent: Double
//    let Time: String
//    let Platform: Int
//}


// MARK: - Route
struct Route: Decodable {
    let Train: [Train]
    let IsExchange: Bool
    let EstTime: String
}

// MARK: - Train
struct Train: Decodable {
  let Trainno, OrignStation, DestinationStation, ArrivalTime: String
  let DepartureTime: String
  let StopStations: [StopStation]
  let LineNumber, Route: String
  let Midnight, Handicap, DirectTrain: Bool
  let ReservedSeat: Bool
  //  let Platform, DestPlatform: String // causes a decode problem
  let IsFullTrain: Bool
}

// MARK: - StopStation
struct StopStation: Decodable {
    let StationId, ArrivalTime, DepartureTime, Platform: String
}

struct RouteModel {
  /// Today's date, formatted properly for Israel Railways API endpoint
  static private var todayDate: String {
    let dateFormatter = DateFormatter()
    dateFormatter.dateFormat = "YYYYMMdd"
    return dateFormatter.string(from: Date())
  }
  
  func fetchRoute(originId: String, destinationId: String, completion: @escaping (_ result: RouteResult) -> Void) {
    let url = URL(string: "https://www.rail.co.il/apiinfo/api/Plan/GetRoutes?OId=\(originId)&TId=\(destinationId)&Date=\(RouteModel.todayDate)&Hour=0000")!

    let task = URLSession.shared.dataTask(with: url) { (data, response, error) in
        guard let data = data else { return }
        
        do {
          let route = try JSONDecoder().decode(RouteResult.self, from: data)
          
          completion(route)
        } catch let error {
          print(error)
        }
    }

    task.resume()
  }
}
