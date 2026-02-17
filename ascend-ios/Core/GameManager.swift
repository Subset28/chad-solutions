import SwiftUI

class GameManager: ObservableObject {
    @AppStorage("user_xp") var xp: Int = 0
    @AppStorage("user_streak") var streak: Int = 1
    
    // Level calculation: simple linear or exponential curve
    var level: Int {
        return (xp / 100) + 1 // Level up every 100 XP
    }
    
    var xpProgress: Double {
        let remainder = xp % 100
        return Double(remainder) / 100.0
    }
    
    var levelTitle: String {
        switch level {
        case 1...2: return "Normie"
        case 3...5: return "Beginner Maxxer"
        case 6...10: return "Intermediate"
        case 11...20: return "Ascending"
        case 21...50: return "Chad Lite"
        case 51...99: return "Gigachad"
        default: return "Slayer"
        }
    }
    
    func completeTask() {
        // Haptic feedback could go here
        xp += 20
    }
    
    func undoTask() {
        xp = max(0, xp - 20)
    }
}
