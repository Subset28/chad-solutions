import SwiftUI

struct DashboardView: View {
    @StateObject var gameManager = GameManager()
    
    @State private var routines = [
        RoutineItem(title: "Morning Skincare", icon: "drop.fill", isCompleted: false),
        RoutineItem(title: "Mewing Session (20m)", icon: "face.dashed", isCompleted: false),
        RoutineItem(title: "Ice Facial", icon: "snowflake", isCompleted: false),
        RoutineItem(title: "Gym / Cardio", icon: "figure.run", isCompleted: false),
        RoutineItem(title: "Sleep (8h+)", icon: "bed.double.fill", isCompleted: false)
    ]
    
    var body: some View {
        NavigationView {
            ZStack {
                Theme.background.edgesIgnoringSafeArea(.all)
                
                ScrollView {
                    VStack(spacing: 25) {
                        // Header / Stats Card
                        VStack(spacing: 15) {
                            HStack {
                                VStack(alignment: .leading) {
                                    Text("LEVEL \(gameManager.level)")
                                        .font(.caption)
                                        .fontWeight(.bold)
                                        .foregroundColor(Theme.primary)
                                        .tracking(1)
                                    
                                    Text(gameManager.levelTitle)
                                        .font(.title2)
                                        .fontWeight(.heavy)
                                        .foregroundColor(.white)
                                }
                                Spacer()
                                VStack(alignment: .trailing) {
                                    Text("STREAK")
                                        .font(.caption)
                                        .fontWeight(.bold)
                                        .foregroundColor(.gray)
                                    
                                    HStack(spacing: 4) {
                                        Image(systemName: "flame.fill")
                                            .foregroundColor(.orange)
                                        Text("\(gameManager.streak)")
                                            .font(.title2)
                                            .fontWeight(.heavy)
                                            .foregroundColor(.white)
                                    }
                                }
                            }
                            
                            // XP Bar
                            VStack(spacing: 6) {
                                GeometryReader { geometry in
                                    ZStack(alignment: .leading) {
                                        RoundedRectangle(cornerRadius: 10)
                                            .fill(Color.gray.opacity(0.3))
                                            .frame(height: 8)
                                        
                                        RoundedRectangle(cornerRadius: 10)
                                            .fill(Theme.primaryGradient)
                                            .frame(width: CGFloat(gameManager.xpProgress) * geometry.size.width, height: 8)
                                            .animation(.spring(), value: gameManager.xpProgress)
                                    }
                                }
                                .frame(height: 8)
                                
                                HStack {
                                    Text("\(gameManager.xp % 100) / 100 XP")
                                        .font(.caption2)
                                        .foregroundColor(.gray)
                                    Spacer()
                                    Text("Next Level")
                                        .font(.caption2)
                                        .foregroundColor(.gray)
                                }
                            }
                        }
                        .padding(20)
                        .background(Theme.surface)
                        .cornerRadius(20)
                        .padding(.horizontal)
                        
                        // Todays Rituals
                        VStack(alignment: .leading, spacing: 15) {
                            Text("TODAY'S RITUALS")
                                .font(.headline)
                                .foregroundColor(.gray)
                                .padding(.leading)
                            
                            ForEach($routines) { $item in
                                TaskRow(item: $item, onToggle: {
                                    if item.isCompleted {
                                        gameManager.completeTask()
                                    } else {
                                        gameManager.undoTask()
                                    }
                                })
                            }
                        }
                        .padding(.bottom, 20)
                    }
                    .padding(.top)
                }
            }
            .navigationBarHidden(true)
        }
    }
}

struct TaskRow: View {
    @Binding var item: RoutineItem
    var onToggle: () -> Void
    
    var body: some View {
        HStack {
            Image(systemName: item.icon)
                .foregroundColor(item.isCompleted ? Theme.primary : .gray)
                .frame(width: 24)
                .padding(.trailing, 8)
            
            Text(item.title)
                .font(.body)
                .fontWeight(.medium)
                .foregroundColor(.white)
                .strikethrough(item.isCompleted)
            
            Spacer()
            
            Button(action: {
                withAnimation {
                    item.isCompleted.toggle()
                    onToggle()
                }
            }) {
                Image(systemName: item.isCompleted ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundColor(item.isCompleted ? Theme.primary : .gray)
            }
        }
        .padding()
        .background(Theme.surface)
        .cornerRadius(12)
        .padding(.horizontal)
    }
}

struct RoutineItem: Identifiable {
    let id = UUID()
    let title: String
    let icon: String
    var isCompleted: Bool
}
