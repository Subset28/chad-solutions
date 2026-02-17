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
        
        // Load the web analysis engine - now pointing to the live GitHub Pages deployment
        if let url = URL(string: "https://Subset28.github.io/chad-solutions/analyze") {
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
        // Extract PSL data
        guard let psl = data["psl"] as? [String: Any],
              let score = psl["score"] as? Double,
              let rawTier = psl["tier"] as? String else {
            error = "Invalid PSL data format"
            isLoading = false
            return
        }
        
        // Map the long tier string (with percentile) to our enum
        let tier = mapTierString(rawTier)
        
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
            metrics: metrics.sorted(by: { $0.importance.rawValue < $1.importance.rawValue }),
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
    
    private func mapTierString(_ raw: String) -> PSLTier {
        if raw.contains("God") { return .gigachad }
        if raw.contains("Gigachad") { return .gigachad }
        if raw.contains("Chad") && !raw.contains("lite") { return .chad }
        if raw.contains("Chadlite") { return .chadlite }
        if raw.contains("HTN") || raw.contains("High-Tier Normie") { return .htn }
        if raw.contains("MTN") || raw.contains("Mid-Tier Normie") || raw.contains("Upper-Mid") { return .mtn }
        if raw.contains("LTN") || raw.contains("Low-Tier Normie") { return .ltn }
        if raw.contains("Truecel") { return .truecel }
        return .subhuman
    }
    
    private func formatMetricName(_ key: String) -> String {
        // Handle specific abbreviations
        if key == "ipdRatio" { return "IPD Ratio" }
        if key == "fwfhRatio" { return "FWHR" }
        
        // Convert camelCase to Title Case
        return key.replacingOccurrences(of: "([a-z])([A-Z])", with: "$1 $2", options: .regularExpression)
            .capitalized
    }
    
    private func rateMetric(_ key: String, value: Double) -> MetricRating {
        switch key {
        case "canthalTilt":
            if value >= 5 { return .excellent }
            if value >= 0 { return .good }
            if value >= -3 { return .average }
            return .critical
            
        case "fwfhRatio":
            if value >= 1.8 && value <= 2.0 { return .excellent }
            if value >= 1.7 && value <= 2.2 { return .good }
            return .poor
            
        case "midfaceRatio":
            if value >= 0.95 && value <= 1.05 { return .excellent }
            if value > 1.1 { return .critical }
            return .average
            
        case "gonialAngle":
            if value >= 115 && value <= 125 { return .excellent }
            if value > 135 { return .poor }
            return .good
            
        case "orbitalRimProtrusion", "maxillaryProtrusion", "browRidgeProtrusion":
            if value > 0.04 { return .excellent }
            if value > 0.02 { return .good }
            return .poor
            
        case "facialAsymmetry":
            if value < 0.02 { return .excellent }
            if value < 0.05 { return .good }
            return .critical
            
        default:
            return .average
        }
    }
    
    private func getIdealRange(_ key: String) -> String {
        switch key {
        case "canthalTilt": return "4° to 8° (Positive)"
        case "fwfhRatio": return "1.85 to 2.0"
        case "midfaceRatio": return "~1.0 (Compact)"
        case "gonialAngle": return "110° to 130°"
        case "chinToPhiltrumRatio": return "2.0 to 2.5"
        case "orbitalRimProtrusion": return "> 0.05 (Forward)"
        case "maxillaryProtrusion": return "Significant Forward Growth"
        case "facialAsymmetry": return "< 2%"
        default: return "Varies by Phenotype"
        }
    }
    
    private func getAssessment(_ key: String, value: Double) -> String {
        let valStr = String(format: "%.2f", value)
        switch key {
        case "canthalTilt":
            return value > 0 ? "Positive tilt (\(valStr)°). High aesthetic appeal." : "Negative tilt (\(valStr)°). Tired/droopy appearance."
        case "fwfhRatio":
            return value >= 1.8 ? "High (\(valStr)). Indicates Dimorphism." : "Low (\(valStr)). Long-face syndrome."
        case "orbitalRimProtrusion":
            return value > 0.03 ? "Strong forward support. Deep-set eyes." : "Weak support. Potential for bug-eyes."
        case "facialAsymmetry":
            return value < 0.05 ? "Excellent symmetry (\(valStr))." : "Significant asymmetry detected (\(valStr))."
        default:
            return "Measurement: \(valStr)"
        }
    }
    
    private func getImportance(_ key: String) -> MetricImportance {
        let criticals = ["canthalTilt", "fwfhRatio", "orbitalRimProtrusion", "maxillaryProtrusion", "gonialAngle", "midfaceRatio"]
        let highs = ["eyeSeparationRatio", "chinToPhiltrumRatio", "facialAsymmetry", "cheekboneProminence"]
        
        if criticals.contains(key) { return .critical }
        if highs.contains(key) { return .high }
        return .medium
    }
    
    private func createPotentialAnalysis(psl: Double, metrics: [MetricResult]) -> PotentialAnalysis {
        let poorMetrics = metrics.filter { $0.rating == .poor || $0.rating == .critical }
        let softmaxable = poorMetrics.filter { canSoftmax($0.name) }
        
        // Realistic gains
        let softmaxGain = Double(softmaxable.count) * 0.25
        let hardmaxGain = Double(poorMetrics.count - softmaxable.count) * 0.4
        
        let targetCeiling = min(8.0, psl + softmaxGain + hardmaxGain)
        
        return PotentialAnalysis(
            currentPSL: psl,
            softmaxPotential: min(8.0, psl + softmaxGain),
            hardmaxPotential: targetCeiling,
            ceiling: min(8.0, targetCeiling + 0.3), // Genetic peak
            limitingFactors: poorMetrics.map { $0.displayName },
            strengths: metrics.filter { $0.rating == .excellent }.map { $0.displayName }
        )
    }
    
    private func canSoftmax(_ metricName: String) -> Bool {
        let softmaxKeys = ["bodyFat", "skinQuality", "hairlineRecession", "facialHair", "eyebrowThickness"]
        return softmaxKeys.contains(metricName)
    }
    
    private func generateRecommendations(metrics: [MetricResult], psl: Double) -> [Recommendation] {
        var recs: [Recommendation] = []
        
        for metric in metrics where metric.rating == .poor || metric.rating == .critical {
            if let items = getBrutalRecommendations(metric) {
                recs.append(contentsOf: items)
            }
        }
        
        return recs.sorted { $0.priority < $1.priority }
    }
    
    private func getBrutalRecommendations(_ metric: MetricResult) -> [Recommendation]? {
        switch metric.name {
        case "canthalTilt":
            return [
                Recommendation(
                    category: .hardmax,
                    priority: .high,
                    title: "Canthoplasty / Canthopexy",
                    subtitle: "Correct Negative Tilt",
                    description: "Surgically reposition the lateral canthus to achieve a hunter-eye look.",
                    difficulty: .surgery,
                    timeToResults: "6 Months",
                    estimatedPSLGain: 0.5,
                    affectsMetrics: ["Canthal Tilt", "Eye Support"]
                )
            ]
        case "maxillaryProtrusion", "infraorbitalRimPosition":
            return [
                Recommendation(
                    category: .hardmax,
                    priority: .critical,
                    title: "LeFort I / Bimaxillary Osteotomy",
                    subtitle: "Fix Midface Recession",
                    description: "Advanced jaw surgery to move the maxilla forward for proper skeletal support.",
                    difficulty: .surgery,
                    timeToResults: "12-18 Months",
                    estimatedPSLGain: 1.2,
                    affectsMetrics: ["Maxillary Protrusion", "Midface Ratio"]
                )
            ]
        case "hairlineRecession":
            return [
                Recommendation(
                    category: .softmax,
                    priority: .high,
                    title: "The Big 3 Protocol",
                    subtitle: "Finasteride, Minoxidil, Microneedling",
                    description: "Standard medical protocol for reversing androgenetic alopecia.",
                    difficulty: .medium,
                    timeToResults: "4-6 Months",
                    estimatedPSLGain: 0.4,
                    affectsMetrics: ["Hairline"]
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
