import SwiftUI

class TrackerViewModel: ObservableObject {
    @Published var photos: [TrackerPhoto] = []
    
    init() {
        // Add some dummy data for preview
        addPhoto(date: Date().addingTimeInterval(-86400 * 10))
        addPhoto(date: Date().addingTimeInterval(-86400 * 5))
    }
    
    func addPhoto(date: Date = Date()) {
        let newPhoto = TrackerPhoto(date: date, imageName: "face_example")
        photos.insert(newPhoto, at: 0)
    }
}

struct TrackerPhoto: Identifiable {
    let id = UUID()
    let date: Date
    let imageName: String // In a real app, this would be a file path
}
