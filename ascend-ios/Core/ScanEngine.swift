import SwiftUI
import WebKit

/// Manages communication between iOS app and web-based face analysis engine
class ScanEngine: NSObject, ObservableObject {
    @Published var isLoading = false
    @Published var analysisResult: AnalysisResult?
    @Published var error: String?
    
    private var webView: WKWebView?
    private var currentImageData: Data?
    
    override init() {
        super.init()
        setupWebView()
    }
    
    private func setupWebView() {
        let configuration = WKWebViewConfiguration()
        configuration.preferences.javaScriptEnabled = true
        
        // Add message handler to receive analysis results from JavaScript
        let contentController = WKUserContentController()
        contentController.add(self, name: "analysisComplete")
        configuration.userContentController = contentController
        
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView?.navigationDelegate = self
        
        // Load the web analysis engine
        if let url = URL(string: "http://localhost:3000/analyze") {
            webView?.load(URLRequest(url: url))
        }
    }
    
    /// Analyze a face from image data
    func analyze(imageData: Data) {
        guard let webView = webView else {
            error = "WebView not initialized"
            return
        }
        
        isLoading = true
        currentImageData = imageData
        
        // Convert image to base64 for JavaScript
        let base64Image = imageData.base64EncodedString()
        let dataURL = "data:image/jpeg;base64,\(base64Image)"
        
        // Inject JavaScript to trigger analysis
        let script = """
        (function() {
            const imageElement = document.createElement('img');
            imageElement.src = '\(dataURL)';
            imageElement.onload = function() {
                // Trigger the web app's analysis function
                if (window.analyzeImage) {
                    window.analyzeImage('\(dataURL)');
                } else {
                    // Fallback: manually trigger file upload
                    const fileInput = document.querySelector('input[type="file"]');
                    if (fileInput) {
                        const dataTransfer = new DataTransfer();
                        fetch('\(dataURL)')
                            .then(res => res.blob())
                            .then(blob => {
                                const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
                                dataTransfer.items.add(file);
                                fileInput.files = dataTransfer.files;
                                fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                            });
                    }
                }
            };
        })();
        """
        
        webView.evaluateJavaScript(script) { [weak self] result, error in
            if let error = error {
                self?.isLoading = false
                self?.error = "Failed to start analysis: \(error.localizedDescription)"
            }
        }
    }
    
    /// Parse analysis results from web app
    private func parseResults(_ data: [String: Any]) {
        // Extract PSL score
        guard let psl = data["psl"] as? [String: Any],
              let score = psl["score"] as? Double,
              let tierString = psl["tier"] as? String,
              let tier = PSLTier(rawValue: tierString) else {
            error = "Invalid analysis data format"
            isLoading = false
            return
        }
        
        // Extract metrics
        guard let metricsDict = data["metrics"] as? [String: Double] else {
            error = "Missing metrics data"
            isLoading = false
            return
        }
        
        let metrics = metricsDict.map { key, value -> MetricResult in
            MetricResult(
                name: key,
                displayName: formatMetricName(key),
                value: value,
                rating: rateMetric(key, value: value),
                idealRange: getIdealRange(key),
                currentAssessment: getAssessment(key, value: value),
                importance: getImportance(key)
            )
        }
        
        // Create potential analysis
        let potential = createPotentialAnalysis(psl: score, metrics: metrics)
        
        // Generate recommendations
        let recommendations = generateRecommendations(metrics: metrics, psl: score)
        
        // Create final result
        let result = AnalysisResult(
            overallPSL: score,
            tier: tier,
            metrics: metrics,
            potential: potential,
            recommendations: recommendations,
            imageUrl: data["imageUrl"] as? String
        )
        
        DispatchQueue.main.async {
            self.analysisResult = result
            self.isLoading = false
        }
    }
    
    // MARK: - Helper Methods
    
    private func formatMetricName(_ key: String) -> String {
        // Convert camelCase to Title Case
        key.replacingOccurrences(of: "([a-z])([A-Z])", with: "$1 $2", options: .regularExpression)
            .capitalized
    }
    
    private func rateMetric(_ key: String, value: Double) -> MetricRating {
        // Simplified rating logic - should be expanded based on metric type
        switch key {
        case "canthalTilt":
            if value > 5 { return .excellent }
            else if value > 0 { return .good }
            else if value > -3 { return .average }
            else { return .poor }
        case "fwfhRatio":
            if value >= 1.8 && value <= 2.0 { return .excellent }
            else if value >= 1.7 && value <= 2.1 { return .good }
            else { return .average }
        default:
            return .average
        }
    }
    
    private func getIdealRange(_ key: String) -> String {
        switch key {
        case "canthalTilt": return "4-8°"
        case "fwfhRatio": return "1.8-2.0"
        case "gonialAngle": return "110-130°"
        default: return "Varies"
        }
    }
    
    private func getAssessment(_ key: String, value: Double) -> String {
        // This should match the web app's getMetricExplanation logic
        return "Assessment for \(key): \(value)"
    }
    
    private func getImportance(_ key: String) -> MetricImportance {
        switch key {
        case "canthalTilt", "fwfhRatio", "gonialAngle": return .critical
        case "midfaceRatio", "eyeSeparationRatio": return .high
        default: return .medium
        }
    }
    
    private func createPotentialAnalysis(psl: Double, metrics: [MetricResult]) -> PotentialAnalysis {
        // Calculate potential based on metric improvements
        let poorMetrics = metrics.filter { $0.rating == .poor || $0.rating == .critical }
        let softmaxGain = Double(poorMetrics.filter { canSoftmax($0.name) }.count) * 0.3
        let hardmaxGain = Double(poorMetrics.count) * 0.5
        
        return PotentialAnalysis(
            currentPSL: psl,
            softmaxPotential: min(8.0, psl + softmaxGain),
            hardmaxPotential: min(8.0, psl + hardmaxGain),
            ceiling: min(8.0, psl + hardmaxGain + 0.5),
            limitingFactors: poorMetrics.map { $0.displayName },
            strengths: metrics.filter { $0.rating == .excellent || $0.rating == .good }.map { $0.displayName }
        )
    }
    
    private func canSoftmax(_ metricName: String) -> Bool {
        // Metrics that can be improved without surgery
        ["bodyFat", "skinQuality", "hairline", "facialHair"].contains(metricName)
    }
    
    private func generateRecommendations(metrics: [MetricResult], psl: Double) -> [Recommendation] {
        var recommendations: [Recommendation] = []
        
        // Add recommendations based on poor metrics
        for metric in metrics where metric.rating == .poor || metric.rating == .critical {
            if let recs = getRecommendationsForMetric(metric) {
                recommendations.append(contentsOf: recs)
            }
        }
        
        // Sort by priority
        return recommendations.sorted { $0.priority < $1.priority }
    }
    
    private func getRecommendationsForMetric(_ metric: MetricResult) -> [Recommendation]? {
        switch metric.name {
        case "canthalTilt":
            return [
                Recommendation(
                    category: .hardmax,
                    priority: .high,
                    title: "Canthal Tilt Surgery",
                    subtitle: "Canthoplasty procedure",
                    description: "Surgical procedure to adjust eye tilt for more attractive appearance",
                    difficulty: .surgery,
                    timeToResults: "6-12 months",
                    estimatedPSLGain: 0.5,
                    affectsMetrics: ["canthalTilt", "eyeArea"]
                )
            ]
        case "gonialAngle":
            return [
                Recommendation(
                    category: .softmax,
                    priority: .critical,
                    title: "Mewing Protocol",
                    subtitle: "Proper tongue posture",
                    description: "Practice correct tongue posture 24/7 to improve jawline over time",
                    difficulty: .easy,
                    timeToResults: "6-12 months",
                    estimatedPSLGain: 0.3,
                    guideId: "mewing-guide",
                    affectsMetrics: ["gonialAngle", "jawline"]
                )
            ]
        default:
            return nil
        }
    }
}

// MARK: - WKScriptMessageHandler

extension ScanEngine: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "analysisComplete", let data = message.body as? [String: Any] {
            parseResults(data)
        }
    }
}

// MARK: - WKNavigationDelegate

extension ScanEngine: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("Web analysis engine loaded successfully")
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        self.error = "Failed to load analysis engine: \(error.localizedDescription)"
        isLoading = false
    }
}
