import SwiftUI

struct TrackerView: View {
    @StateObject private var viewModel = TrackerViewModel()
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    Text("Progress Log")
                        .font(.title2)
                        .bold()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal)
                    
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 100))], spacing: 10) {
                        // Add Button
                        Button(action: {
                            viewModel.addPhoto()
                        }) {
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.blue, style: StrokeStyle(lineWidth: 2, dash: [5]))
                                .aspectRatio(1, contentMode: .fit)
                                .overlay(
                                    Image(systemName: "plus")
                                        .font(.largeTitle)
                                        .foregroundColor(.blue)
                                )
                        }
                        
                        // Photos
                        ForEach(viewModel.photos) { photo in
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color.gray.opacity(0.3))
                                .aspectRatio(1, contentMode: .fit)
                                .overlay(
                                    VStack {
                                        Image(systemName: "photo")
                                            .font(.largeTitle)
                                            .foregroundColor(.gray)
                                        Text(photo.date, style: .date)
                                            .font(.caption2)
                                            .foregroundColor(.white)
                                            .padding(4)
                                            .background(Color.black.opacity(0.5))
                                            .cornerRadius(4)
                                    }
                                )
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Tracker")
        }
    }
}
