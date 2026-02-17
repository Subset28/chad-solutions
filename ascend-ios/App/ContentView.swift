import SwiftUI

struct ContentView: View {
    init() {
        // Custom Tab Bar Appearance
        UITabBar.appearance().backgroundColor = UIColor(Theme.surface)
        UITabBar.appearance().unselectedItemTintColor = UIColor.gray
    }
    
    var body: some View {
        TabView {
            DashboardView()
                .tabItem {
                    Label("My Journey", systemImage: "chart.bar.fill")
                }
            
            ScanView()
                .tabItem {
                    Label("Scan Face", systemImage: "faceid")
                }
            
            LearnView()
                .tabItem {
                    Label("Learn", systemImage: "book.fill")
                }
            
            TrackerView()
                .tabItem {
                    Label("Tracker", systemImage: "camera.fill")
                }
        }
        .accentColor(Theme.primary)
        .preferredColorScheme(.dark)
    }
}
