package com.example.app.dto.response;

import java.util.List;
import java.util.UUID;

/**
 * Lightweight view model tailored for the user-facing DISC test pages.
 */
public record DiscTestResultResponse(
    UUID sessionId,
    String testMode,
    List<String> topDimensions,
    List<DimensionScore> dimensionScores,
    List<TraitScore> bigFiveScores,
    List<TraitScore> ikigaiScores,
    boolean fullDetailUnlocked,
    int previewCoveragePercentage,
    boolean insightsEnabled,
    boolean careerRecommendationsEnabled,
    boolean developmentPlansEnabled,
    List<InsightItem> insights,
    List<CareerRecommendation> careerRecommendations,
    List<DevelopmentPlanItem> developmentPlans
) {
  public record DimensionScore(String dimension, int score) {
  }

  public record TraitScore(String dimension, double score) {
  }

  public record InsightItem(
      String dimension,
      String summary,
      String keyBehaviors,
      String strengths,
      String weaknesses
  ) {
  }

  public record CareerRecommendation(
      String jobTitle,
      String summary,
      int matchLevel,
      String skills,
      String learningResources
  ) {
  }

  public record DevelopmentPlanItem(
      String title,
      String description,
      String timeframe,
      String actions
  ) {
  }
}
