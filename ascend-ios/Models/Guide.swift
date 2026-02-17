import Foundation

struct Guide: Identifiable, Hashable {
    let id = UUID()
    let title: String
    let subtitle: String
    let category: GuideCategory
    let content: String
    let imageName: String
}

enum GuideCategory: String, CaseIterable {
    case fundamentals = "Fundamentals"
    case aesthetics = "Aesthetics"
    case softmaxxing = "Softmaxxing"
    case bodymaxxing = "Bodymaxxing"
}
