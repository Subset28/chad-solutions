import SwiftUI

struct LearnView: View {
    let guides = GuideData.allGuides
    
    var categories: [GuideCategory] {
        GuideCategory.allCases
    }
    
    var body: some View {
        NavigationView {
            List {
                ForEach(categories, id: \.self) { category in
                    Section(header: Text(category.rawValue)) {
                        ForEach(guides.filter { $0.category == category }) { guide in
                            NavigationLink(destination: GuideDetailView(guide: guide)) {
                                GuideRow(title: guide.title, subtitle: guide.subtitle)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Knowledge Base")
        }
    }
}

struct GuideRow: View {
    let title: String
    let subtitle: String
    
    var body: some View {
        VStack(alignment: .leading) {
            Text(title)
                .font(.headline)
            Text(subtitle)
                .font(.caption)
                .foregroundColor(.gray)
        }
    }
}
