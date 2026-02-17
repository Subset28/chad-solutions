import SwiftUI

struct GuideDetailView: View {
    let guide: Guide
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header Image Placeholder
                Rectangle()
                    .fill(Color.gray.opacity(0.3))
                    .frame(height: 250)
                    .overlay(
                        Image(systemName: "photo")
                            .font(.largeTitle)
                            .foregroundColor(.gray)
                    )
                
                VStack(alignment: .leading, spacing: 16) {
                    Text(guide.category.rawValue.uppercased())
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(4)
                    
                    Text(guide.title)
                        .font(.largeTitle)
                        .bold()
                        .foregroundColor(.primary)
                    
                    Text(guide.subtitle)
                        .font(.title3)
                        .foregroundColor(.secondary)
                    
                    Divider()
                        .padding(.vertical)
                    
                    // Markdown-like text rendering
                    Text(guide.content)
                        .font(.body)
                        .lineSpacing(6)
                }
                .padding()
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}
