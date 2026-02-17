import Foundation

// MARK: - Analysis Result Models

/// Main analysis result containing PSL score, metrics, and recommendations
struct AnalysisResult: Codable, Identifiable {
    let id: UUID
    let timestamp: Date
    let overallPSL: Double
    let tier: PSLTier
    let metrics: [MetricResult]
    let potential: PotentialAnalysis
    let recommendations: [Recommendation]
    let imageUrl: String?
    
    init(id: UUID = UUID(), timestamp: Date = Date(), overallPSL: Double, tier: PSLTier, metrics: [MetricResult], potential: PotentialAnalysis, recommendations: [Recommendation], imageUrl: String? = nil) {
        self.id = id
        self.timestamp = timestamp
        self.overallPSL = overallPSL
        self.tier = tier
        self.metrics = metrics
        self.potential = potential
        self.recommendations = recommendations
        self.imageUrl = imageUrl
    }
}

// MARK: - PSL Tier

enum PSLTier: String, Codable, CaseIterable {
    case truecel = "Truecel"
    case subhuman = "Subhuman"
    case ltn = "LTN"
    case mtn = "MTN"
    case htn = "HTN"
    case chadlite = "Chadlite"
    case chad = "Chad"
    case gigachad = "Gigachad"
    
    var percentile: String {
        switch self {
        case .truecel: return "Bottom 0.5%"
        case .subhuman: return "Bottom 10%"
        case .ltn: return "Bottom 30%"
        case .mtn: return "50th Percentile"
        case .htn: return "Top 20%"
        case .chadlite: return "Top 5%"
        case .chad: return "Top 1%"
        case .gigachad: return "Top 0.1%"
        }
    }
    
    var color: String {
        switch self {
        case .truecel, .subhuman: return "red"
        case .ltn: return "orange"
        case .mtn: return "yellow"
        case .htn: return "green"
        case .chadlite, .chad: return "blue"
        case .gigachad: return "purple"
        }
    }
}

// MARK: - Metric Result

struct MetricResult: Codable, Identifiable {
    let id: UUID
    let name: String
    let displayName: String
    let value: Double
    let rating: MetricRating
    let idealRange: String
    let currentAssessment: String
    let importance: MetricImportance
    
    init(id: UUID = UUID(), name: String, displayName: String, value: Double, rating: MetricRating, idealRange: String, currentAssessment: String, importance: MetricImportance) {
        self.id = id
        self.name = name
        self.displayName = displayName
        self.value = value
        self.rating = rating
        self.idealRange = idealRange
        self.currentAssessment = currentAssessment
        self.importance = importance
    }
}

enum MetricRating: String, Codable {
    case excellent = "Excellent"
    case good = "Good"
    case average = "Average"
    case poor = "Poor"
    case critical = "Critical"
    
    var color: String {
        switch self {
        case .excellent: return "green"
        case .good: return "blue"
        case .average: return "yellow"
        case .poor: return "orange"
        case .critical: return "red"
        }
    }
}

enum MetricImportance: String, Codable {
    case critical = "Critical"
    case high = "High"
    case medium = "Medium"
    case low = "Low"
}

// MARK: - Potential Analysis

struct PotentialAnalysis: Codable {
    let currentPSL: Double
    let softmaxPotential: Double
    let hardmaxPotential: Double
    let ceiling: Double
    let limitingFactors: [String]
    let strengths: [String]
    
    var totalPotentialGain: Double {
        ceiling - currentPSL
    }
    
    var softmaxGain: Double {
        softmaxPotential - currentPSL
    }
    
    var hardmaxGain: Double {
        hardmaxPotential - currentPSL
    }
}

// MARK: - Recommendation

struct Recommendation: Codable, Identifiable {
    let id: UUID
    let category: RecommendationCategory
    let priority: RecommendationPriority
    let title: String
    let subtitle: String
    let description: String
    let difficulty: Difficulty
    let timeToResults: String
    let estimatedPSLGain: Double
    let guideId: String?
    let affectsMetrics: [String]
    
    init(id: UUID = UUID(), category: RecommendationCategory, priority: RecommendationPriority, title: String, subtitle: String, description: String, difficulty: Difficulty, timeToResults: String, estimatedPSLGain: Double, guideId: String? = nil, affectsMetrics: [String]) {
        self.id = id
        self.category = category
        self.priority = priority
        self.title = title
        self.subtitle = subtitle
        self.description = description
        self.difficulty = difficulty
        self.timeToResults = timeToResults
        self.estimatedPSLGain = estimatedPSLGain
        self.guideId = guideId
        self.affectsMetrics = affectsMetrics
    }
}

enum RecommendationCategory: String, Codable {
    case softmax = "Softmaxxing"
    case hardmax = "Hardmaxxing"
    case lifestyle = "Lifestyle"
    case emergency = "Emergency Fix"
}

enum RecommendationPriority: String, Codable, Comparable {
    case critical = "Critical"
    case high = "High"
    case medium = "Medium"
    case low = "Low"
    
    static func < (lhs: RecommendationPriority, rhs: RecommendationPriority) -> Bool {
        let order: [RecommendationPriority] = [.critical, .high, .medium, .low]
        guard let lhsIndex = order.firstIndex(of: lhs),
              let rhsIndex = order.firstIndex(of: rhs) else {
            return false
        }
        return lhsIndex < rhsIndex
    }
}

enum Difficulty: String, Codable {
    case veryEasy = "Very Easy"
    case easy = "Easy"
    case medium = "Medium"
    case hard = "Hard"
    case veryHard = "Very Hard"
    case surgery = "Surgical"
}
