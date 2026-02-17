import SwiftUI
import PhotosUI

struct ScanView: View {
    @StateObject private var scanEngine = ScanEngine()
    @State private var showImagePicker = false
    @State private var showCamera = false
    @State private var selectedImage: UIImage?
    @State private var showResults = false
    
    var body: some View {
        ZStack {
            Theme.background.edgesIgnoringSafeArea(.all)
            
            if let result = scanEngine.analysisResult, showResults {
                // Show results view
                ResultsView(result: result, onDismiss: {
                    showResults = false
                    scanEngine.analysisResult = nil
                    selectedImage = nil
                })
            } else {
                VStack(spacing: 30) {
                    Spacer()
                    
                    // Preview or Placeholder
                    ZStack {
                        if let image = selectedImage {
                            Image(uiImage: image)
                                .resizable()
                                .scaledToFit()
                                .frame(maxWidth: 300, maxHeight: 400)
                                .cornerRadius(20)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 20)
                                        .stroke(Theme.primary, lineWidth: 2)
                                )
                        } else {
                            // Animated Pulse Effect Placeholder
                            ZStack {
                                Circle()
                                    .stroke(Theme.primary.opacity(0.3), lineWidth: 2)
                                    .frame(width: 200, height: 200)
                                
                                Circle()
                                    .fill(Theme.primary.opacity(0.1))
                                    .frame(width: 150, height: 150)
                                
                                Image(systemName: "faceid")
                                    .font(.system(size: 60))
                                    .foregroundColor(Theme.primary)
                            }
                        }
                    }
                    
                    VStack(spacing: 12) {
                        Text("FACE AUDIT™ AI")
                            .font(.largeTitle)
                            .fontWeight(.black)
                            .foregroundColor(.white)
                        
                        Text(selectedImage == nil 
                            ? "Get your PSL Score, Canthal Tilt, and Gonial Angle analysis instantly."
                            : "Ready to analyze. Tap Scan Face to begin.")
                            .font(.body)
                            .foregroundColor(.gray)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 30)
                        
                        if let error = scanEngine.error {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(.red)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 30)
                        }
                    }
                    
                    Spacer()
                    
                    // Action Buttons
                    VStack(spacing: 15) {
                        if selectedImage == nil {
                            // Photo selection buttons
                            Button(action: { showCamera = true }) {
                                HStack {
                                    Image(systemName: "camera.fill")
                                    Text("TAKE PHOTO")
                                        .fontWeight(.bold)
                                }
                                .font(.title3)
                                .foregroundColor(.black)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Theme.primary)
                                .cornerRadius(15)
                                .padding(.horizontal, 30)
                            }
                            
                            Button(action: { showImagePicker = true }) {
                                HStack {
                                    Image(systemName: "photo.fill")
                                    Text("CHOOSE FROM LIBRARY")
                                        .fontWeight(.bold)
                                }
                                .font(.title3)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.white.opacity(0.1))
                                .cornerRadius(15)
                                .padding(.horizontal, 30)
                            }
                        } else {
                            // Analysis button
                            Button(action: analyzePhoto) {
                                HStack {
                                    if scanEngine.isLoading {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .black))
                                        Text("ANALYZING...")
                                            .fontWeight(.bold)
                                    } else {
                                        Image(systemName: "bolt.fill")
                                        Text("SCAN FACE")
                                            .fontWeight(.bold)
                                    }
                                }
                                .font(.title3)
                                .foregroundColor(.black)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Theme.primary)
                                .cornerRadius(15)
                                .padding(.horizontal, 30)
                            }
                            .disabled(scanEngine.isLoading)
                            
                            Button(action: { selectedImage = nil }) {
                                Text("Choose Different Photo")
                                    .font(.body)
                                    .foregroundColor(.gray)
                            }
                        }
                    }
                    
                    Text("*Powered by MediaPipe Technology")
                        .font(.caption)
                        .foregroundColor(.gray.opacity(0.5))
                        .padding(.bottom, 20)
                }
            }
        }
        .sheet(isPresented: $showImagePicker) {
            ImagePicker(selectedImage: $selectedImage)
        }
        .fullScreenCover(isPresented: $showCamera) {
            CameraPicker(selectedImage: $selectedImage)
        }
        .onChange(of: scanEngine.analysisResult) { result in
            if result != nil {
                showResults = true
            }
        }
    }
    
    private func analyzePhoto() {
        guard let image = selectedImage else { return }
        
        // Convert UIImage to JPEG data
        guard let imageData = image.jpegData(compressionQuality: 0.8) else {
            scanEngine.error = "Failed to process image"
            return
        }
        
        // Trigger analysis
        scanEngine.analyze(imageData: imageData)
    }
}

// MARK: - Image Picker

struct ImagePicker: UIViewControllerRepresentable {
    @Binding var selectedImage: UIImage?
    @Environment(\.dismiss) var dismiss
    
    func makeUIViewController(context: Context) -> PHPickerViewController {
        var config = PHPickerConfiguration()
        config.filter = .images
        config.selectionLimit = 1
        
        let picker = PHPickerViewController(configuration: config)
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: PHPickerViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, PHPickerViewControllerDelegate {
        let parent: ImagePicker
        
        init(_ parent: ImagePicker) {
            self.parent = parent
        }
        
        func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
            parent.dismiss()
            
            guard let result = results.first else { return }
            
            result.itemProvider.loadObject(ofClass: UIImage.self) { image, error in
                DispatchQueue.main.async {
                    self.parent.selectedImage = image as? UIImage
                }
            }
        }
    }
}

// MARK: - Camera Picker


struct CameraPicker: UIViewControllerRepresentable {
    @Binding var selectedImage: UIImage?
    @Environment(\.dismiss) var dismiss
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.cameraDevice = .front
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: CameraPicker
        
        init(_ parent: CameraPicker) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.selectedImage = image
            }
            parent.dismiss()
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}
