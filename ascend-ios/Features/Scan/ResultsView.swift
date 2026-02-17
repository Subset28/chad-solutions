import SwiftUI

struct ResultsView: View {
    let result: AnalysisResult
    let onDismiss: () -> Void
    
    @State private var selectedTab = 0
    
    var body: some View {
        ZStack {
            Theme.background.edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 0) {
                // Header
                header
                
                // Tab Selector
                tabSelector
                
                // Tab Content
                TabView(selection: $selectedTab) {
                    OverviewTab(result: result)
                        .tag(0)
                    
                    MetricsTab(metrics: result.metrics)
                        .tag(1)
                    
                    PotentialTab(potential: result.potential)
                        .tag(2)
                    
                    ActionPlanTab(recommendations: result.recommendations)
                        .tag(3)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                
                // Bottom Actions
                bottomActions
            }
        }
    }
    
    private var header: some View {
        VStack(spacing: 8) {
            HStack {
                Button(action: onDismiss) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title2)
                        .foregroundColor(.gray)
                }
                Spacer()
                Text("Analysis Results")
                    .font(.headline)
                    .foregroundColor(.white)
                Spacer()
                Button(action: { /* Share */ }) {
                    Image(systemName: "square.and.arrow.up")
                        .font(.title3)
                        .foregroundColor(Theme.primary)
                }
            }
            .padding(.horizontal)
            .padding(.top)
        }
    }
    
    private var tabSelector: some View {
        HStack(spacing: 0) {
            TabButton(title: "Overview", isSelected: selectedTab == 0) {
                withAnimation { selectedTab = 0 }
            }
            TabButton(title: "Metrics", isSelected: selectedTab == 1) {
                withAnimation { selectedTab = 1 }
            }
            TabButton(title: "Potential", isSelected: selectedTab == 2) {
                withAnimation { selectedTab = 2 }
            }
            TabButton(title: "Plan", isSelected: selectedTab == 3) {
                withAnimation { selectedTab = 3 }
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
    }
    
    private var bottomActions: some View {
        VStack(spacing: 12) {
            Button(action: onDismiss) {
                Text("Scan Again")
                    .fontWeight(.bold)
                    .foregroundColor(.black)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Theme.primary)
                    .cornerRadius(15)
            }
        }
        .padding()
    }
}

// MARK: - Tab Button

struct TabButton: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Text(title)
                    .font(.caption)
                    .fontWeight(isSelected ? .bold : .regular)
                    .foregroundColor(isSelected ? Theme.primary : .gray)
                
                if isSelected {
                    Rectangle()
                        .fill(Theme.primary)
                        .frame(height: 2)
                        .transition(.scale)
                } else {
                    Rectangle()
                        .fill(Color.clear)
                        .frame(height: 2)
                }
            }
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Overview Tab

struct OverviewTab: View {
    let result: AnalysisResult
    
    var body: some View {
        ScrollView {
            VStack(spacing: 25) {
                // PSL Score Card
                VStack(spacing: 15) {
                    Text(String(format: "%.1f", result.overallPSL))
                        .font(.system(size: 72, weight: .black))
                        .foregroundColor(Theme.primary)
                    
                    Text("PSL SCORE")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.gray)
                        .tracking(2)
                    
                    // Tier Badge
                    HStack {
                        Text(result.tier.rawValue.uppercased())
                            .font(.title3)
                            .fontWeight(.heavy)
                            .foregroundColor(.white)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 8)
                            .background(tierColor(result.tier))
                            .cornerRadius(10)
                    }
                    
                    Text(result.tier.percentile)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Theme.surface)
                .cornerRadius(20)
                
                // Quick Stats
                HStack(spacing: 15) {
                    StatCard(
                        title: "Strengths",
                        value: "\(result.potential.strengths.count)",
                        icon: "star.fill",
                        color: .green
                    )
                    
                    StatCard(
                        title: "Weaknesses",
                        value: "\(result.potential.limitingFactors.count)",
                        icon: "exclamationmark.triangle.fill",
                        color: .orange
                    )
                    
                    StatCard(
                        title: "Potential",
                        value: String(format: "+%.1f", result.potential.totalPotentialGain),
                        icon: "arrow.up.circle.fill",
                        color: .blue
                    )
                }
                
                // Strengths
                if !result.potential.strengths.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("✅ Your Strengths")
                            .font(.headline)
                            .foregroundColor(.white)
                        
                        ForEach(result.potential.strengths, id: \.self) { strength in
                            Text("• \(strength)")
                                .font(.body)
                                .foregroundColor(.gray)
                        }
                    }
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Theme.surface)
                    .cornerRadius(15)
                }
                
                // Limiting Factors
                if !result.potential.limitingFactors.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("⚠️ Areas to Improve")
                            .font(.headline)
                            .foregroundColor(.white)
                        
                        ForEach(result.potential.limitingFactors, id: \.self) { factor in
                            Text("• \(factor)")
                                .font(.body)
                                .foregroundColor(.gray)
                        }
                    }
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Theme.surface)
                    .cornerRadius(15)
                }
            }
            .padding()
        }
    }
    
    private func tierColor(_ tier: PSLTier) -> Color {
        switch tier.color {
        case "red": return .red
        case "orange": return .orange
        case "yellow": return .yellow
        case "green": return .green
        case "blue": return .blue
        case "purple": return .purple
        default: return .gray
        }
    }
}

// MARK: - Metrics Tab

struct MetricsTab: View {
    let metrics: [MetricResult]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                ForEach(metrics.sorted(by: { $0.importance.rawValue < $1.importance.rawValue })) { metric in
                    MetricCard(metric: metric)
                }
            }
            .padding()
        }
    }
}

struct MetricCard: View {
    let metric: MetricResult
    @State private var isExpanded = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(metric.displayName)
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    Text(String(format: "%.2f", metric.value))
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                
                Spacer()
                
                // Rating Badge
                Text(metric.rating.rawValue)
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(ratingColor(metric.rating))
                    .cornerRadius(8)
                
                Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                    .foregroundColor(.gray)
            }
            
            if isExpanded {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Ideal Range: \(metric.idealRange)")
                        .font(.caption)
                        .foregroundColor(.gray)
                    
                    Text(metric.currentAssessment)
                        .font(.body)
                        .foregroundColor(.white.opacity(0.8))
                }
                .padding(.top, 4)
            }
        }
        .padding()
        .background(Theme.surface)
        .cornerRadius(15)
        .onTapGesture {
            withAnimation {
                isExpanded.toggle()
            }
        }
    }
    
    private func ratingColor(_ rating: MetricRating) -> Color {
        switch rating.color {
        case "green": return .green
        case "blue": return .blue
        case "yellow": return .yellow
        case "orange": return .orange
        case "red": return .red
        default: return .gray
        }
    }
}

// MARK: - Potential Tab

struct PotentialTab: View {
    let potential: PotentialAnalysis
    
    var body: some View {
        ScrollView {
            VStack(spacing: 25) {
                // Current vs Potential Gauge
                VStack(spacing: 15) {
                    Text("Your PSL Potential")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    HStack(alignment: .bottom, spacing: 20) {
                        PotentialBar(
                            title: "Current",
                            value: potential.currentPSL,
                            color: .gray
                        )
                        
                        PotentialBar(
                            title: "Softmax",
                            value: potential.softmaxPotential,
                            color: .blue
                        )
                        
                        PotentialBar(
                            title: "Hardmax",
                            value: potential.hardmaxPotential,
                            color: .purple
                        )
                        
                        PotentialBar(
                            title: "Ceiling",
                            value: potential.ceiling,
                            color: Theme.primary
                        )
                    }
                    .frame(height: 200)
                }
                .padding()
                .background(Theme.surface)
                .cornerRadius(20)
                
                // Gains Breakdown
                VStack(spacing: 15) {
                    GainRow(
                        title: "Softmaxxing Potential",
                        subtitle: "Diet, skincare, grooming",
                        gain: potential.softmaxGain,
                        color: .blue
                    )
                    
                    GainRow(
                        title: "Hardmaxxing Potential",
                        subtitle: "Surgery, orthodontics",
                        gain: potential.hardmaxGain,
                        color: .purple
                    )
                    
                    Divider()
                        .background(Color.gray.opacity(0.3))
                    
                    HStack {
                        Text("Total Potential Gain")
                            .font(.headline)
                            .foregroundColor(.white)
                        Spacer()
                        Text(String(format: "+%.1f PSL", potential.totalPotentialGain))
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(Theme.primary)
                    }
                }
                .padding()
                .background(Theme.surface)
                .cornerRadius(20)
                
                // Reality Check
                VStack(alignment: .leading, spacing: 10) {
                    Text("💡 Reality Check")
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    Text("Your realistic ceiling is \(String(format: "%.1f", potential.ceiling)) PSL. This accounts for genetic limitations and assumes optimal looksmaxxing. Most gains come from softmaxxing (bodyfat, grooming, style).")
                        .font(.body)
                        .foregroundColor(.gray)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Theme.surface)
                .cornerRadius(15)
            }
            .padding()
        }
    }
}

struct PotentialBar: View {
    let title: String
    let value: Double
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            ZStack(alignment: .bottom) {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 50)
                
                RoundedRectangle(cornerRadius: 8)
                    .fill(color)
                    .frame(width: 50, height: CGFloat(value / 8.0) * 200)
            }
            
            Text(String(format: "%.1f", value))
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            Text(title)
                .font(.caption2)
                .foregroundColor(.gray)
        }
    }
}

struct GainRow: View {
    let title: String
    let subtitle: String
    let gain: Double
    let color: Color
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.body)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            Text(String(format: "+%.1f", gain))
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(color)
        }
    }
}

// MARK: - Action Plan Tab

struct ActionPlanTab: View {
    let recommendations: [Recommendation]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                ForEach(recommendations) { recommendation in
                    RecommendationCard(recommendation: recommendation)
                }
            }
            .padding()
        }
    }
}

struct RecommendationCard: View {
    let recommendation: Recommendation
    @State private var isExpanded = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                // Priority Indicator
                Circle()
                    .fill(priorityColor(recommendation.priority))
                    .frame(width: 12, height: 12)
                    .padding(.top, 4)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(recommendation.title)
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    Text(recommendation.subtitle)
                        .font(.caption)
                        .foregroundColor(.gray)
                    
                    HStack(spacing: 12) {
                        Label(recommendation.difficulty.rawValue, systemImage: "gauge")
                            .font(.caption2)
                            .foregroundColor(.gray)
                        
                        Label(recommendation.timeToResults, systemImage: "clock")
                            .font(.caption2)
                            .foregroundColor(.gray)
                        
                        Label(String(format: "+%.1f PSL", recommendation.estimatedPSLGain), systemImage: "arrow.up")
                            .font(.caption2)
                            .foregroundColor(Theme.primary)
                    }
                }
                
                Spacer()
                
                Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                    .foregroundColor(.gray)
            }
            
            if isExpanded {
                VStack(alignment: .leading, spacing: 8) {
                    Text(recommendation.description)
                        .font(.body)
                        .foregroundColor(.white.opacity(0.8))
                    
                    if !recommendation.affectsMetrics.isEmpty {
                        Text("Affects: \(recommendation.affectsMetrics.joined(separator: ", "))")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                    
                    if recommendation.guideId != nil {
                        Button(action: {}) {
                            Text("View Detailed Guide →")
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundColor(Theme.primary)
                        }
                    }
                }
                .padding(.top, 4)
            }
        }
        .padding()
        .background(Theme.surface)
        .cornerRadius(15)
        .onTapGesture {
            withAnimation {
                isExpanded.toggle()
            }
        }
    }
    
    private func priorityColor(_ priority: RecommendationPriority) -> Color {
        switch priority {
        case .critical: return .red
        case .high: return .orange
        case .medium: return .yellow
        case .low: return .green
        }
    }
}

// MARK: - Stat Card

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.gray)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Theme.surface)
        .cornerRadius(15)
    }
}
