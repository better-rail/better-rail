import WidgetKit
import SwiftUI

struct AccessoryEntryView: View {
  var entry: TrainDetail
  @Environment(\.widgetFamily) var widgetFamily
  
  var errorMessage: String? {
    getNoTrainsMessage(statusCode: entry.departureTime, date: entry.date)
  }
  
  var body: some View {
    switch widgetFamily {
    case .accessoryInline:
      if let errorMessage {
        Text(errorMessage)
      } else {
        Text("\(String(localized: entry.isTomorrow ? "TOMORROW" : "NEXT TRAIN")) \(entry.departureTime)")
      }
    case .accessoryCircular:
      ZStack {
        AccessoryWidgetBackground()
        if entry.departureTime == "404" {
          Image(systemName: "wifi.exclamationmark")
        } else if entry.isTomorrow || entry.departureTime == "300" {
          Image(systemName: "tram")
        } else {
          Text(entry.departureTime)
        }
      }
      .widgetBackground(WidgetBackground(image: entry.origin.image).frame(height: 170))
    case .accessoryRectangular:
      HStack {
        VStack(alignment: .leading) {
          Text(formatStationName(entry.origin.name))
            .font(.system(size: 13))
            .fontWeight(.medium)
            .padding(.bottom, -4)
          HStack(alignment: .center, spacing: 2) {
            Image(systemName: "arrow.forward.circle.fill")
              .font(.system(size: 11))
            Text(formatStationName(entry.destination.name))
              .font(.system(size: 11))
          }
        }
        Spacer()
        VStack(alignment: .center) {
          if let errorMessage {
            Image(systemName: entry.departureTime == "404" ? "wifi.exclamationmark" : "tram")
              .font(.system(size: 13))
            Text(errorMessage)
              .multilineTextAlignment(.center)
              .font(.system(size: 12))
          } else {
            Text(entry.departureTime)
              .bold()
              .font(.system(size: 20, design: .rounded))
            Text(entry.isTomorrow ? "TOMORROW" : "platform \(String(entry.platform))")
              .font(.system(size: 11))
              .foregroundColor(entry.isTomorrow ? Color("purply") : .gray)
          }
        }
      }
      .widgetBackground(WidgetBackground(image: entry.origin.image).frame(height: 170))
    default:
      Text(entry.departureTime)
        .widgetBackground(WidgetBackground(image: entry.origin.image).frame(height: 170))
    }
  }
}

struct AccessoryEntryView_Previews: PreviewProvider {
    static var previews: some View {
      let origin = getStationById(3400)!
      let destination = getStationById(680)!
      
      let entry = TrainDetail(date: Date(), departureDate: "09/01/2007 09:43:00", departureTime: "15:56", arrivalTime: "16:06", platform: 3, trainNumber: 131, origin: origin, destination: destination, upcomingTrains: upcomingTrainsSnapshot)

      let emptyEntry = TrainDetail(date: Date(), departureDate: "09/01/2007 09:43:00", departureTime: "404", arrivalTime: "404", platform: 404, trainNumber: 404, origin: origin, destination: destination)
      
      if #available(iOS 14.0, *) {
        AccessoryEntryView(entry: emptyEntry)
          .previewContext(WidgetPreviewContext(family: .accessoryRectangular))
          .environment(\.locale, .init(identifier: "he"))
          .environment(\.layoutDirection, .rightToLeft)
        
        AccessoryEntryView(entry: emptyEntry)
          .previewContext(WidgetPreviewContext(family: .accessoryRectangular))
          .environment(\.locale, .init(identifier: "en"))
      }
    }
}
