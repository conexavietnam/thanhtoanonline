UPDATE app_settings
SET data = jsonb_set(
    data,
    '{pdfTemplateConfigPaid}',
    '{
      "fullName": [
        {
          "page": 2,
          "x": 250,
          "y": 292,
          "width": 220,
          "height": 24,
          "fontSize": 15,
          "color": "#111111",
          "align": "left"
        }
      ],
      "phoneNumber": [
        {
          "page": 2,
          "x": 250,
          "y": 240,
          "width": 205,
          "height": 24,
          "fontSize": 15,
          "color": "#111111",
          "align": "left"
        }
      ],
      "email": [
        {
          "page": 2,
          "x": 250,
          "y": 188,
          "width": 235,
          "height": 26,
          "fontSize": 12,
          "color": "#111111",
          "align": "left"
        }
      ],
      "address": [
        {
          "page": 2,
          "x": 250,
          "y": 136,
          "width": 235,
          "height": 36,
          "fontSize": 12,
          "color": "#111111",
          "align": "left"
        }
      ],
      "disc_percent_d_value": [
        {
          "page": 71,
          "x": 168,
          "y": 73,
          "width": 30,
          "height": 22,
          "fontSize": 13,
          "color": "#111111",
          "align": "center"
        }
      ],
      "disc_percent_i_value": [
        {
          "page": 71,
          "x": 146,
          "y": 52,
          "width": 30,
          "height": 22,
          "fontSize": 13,
          "color": "#111111",
          "align": "center"
        }
      ],
      "disc_percent_s_value": [
        {
          "page": 72,
          "x": 159,
          "y": 768,
          "width": 30,
          "height": 22,
          "fontSize": 13,
          "color": "#111111",
          "align": "center"
        }
      ],
      "disc_percent_c_value": [
        {
          "page": 72,
          "x": 168,
          "y": 748,
          "width": 30,
          "height": 22,
          "fontSize": 13,
          "color": "#111111",
          "align": "center"
        }
      ],
      "DISC_MAIN": [
        {
          "page": 72,
          "x": 300,
          "y": 729,
          "width": 70,
          "height": 22,
          "fontSize": 12,
          "color": "#111111",
          "align": "center",
          "backgroundColor": "#ffffff"
        }
      ],
      "disc_support_type": [
        {
          "page": 72,
          "x": 292,
          "y": 708,
          "width": 58,
          "height": 22,
          "fontSize": 12,
          "color": "#111111",
          "align": "center",
          "backgroundColor": "#ffffff"
        }
      ],
      "core_decision_style": [
        {
          "page": 72,
          "x": 270,
          "y": 337,
          "width": 196,
          "height": 18,
          "fontSize": 11,
          "color": "#111111",
          "align": "left",
          "backgroundColor": "#ffffff"
        }
      ],
      "ideal_work_environment": [
        {
          "page": 72,
          "x": 246,
          "y": 316,
          "width": 212,
          "height": 18,
          "fontSize": 11,
          "color": "#111111",
          "align": "left",
          "backgroundColor": "#ffffff"
        }
      ],
      "best_energy_use": [
        {
          "page": 72,
          "x": 276,
          "y": 295,
          "width": 220,
          "height": 18,
          "fontSize": 11,
          "color": "#111111",
          "align": "left",
          "backgroundColor": "#ffffff"
        }
      ],
      "career_fit_1": [
        {
          "page": 72,
          "x": 90,
          "y": 176,
          "width": 248,
          "height": 22,
          "fontSize": 11,
          "color": "#111111",
          "align": "left",
          "backgroundColor": "#ffffff"
        }
      ],
      "career_fit_2": [
        {
          "page": 72,
          "x": 90,
          "y": 156,
          "width": 248,
          "height": 22,
          "fontSize": 11,
          "color": "#111111",
          "align": "left",
          "backgroundColor": "#ffffff"
        }
      ],
      "career_fit_3": [
        {
          "page": 72,
          "x": 90,
          "y": 136,
          "width": 248,
          "height": 22,
          "fontSize": 11,
          "color": "#111111",
          "align": "left",
          "backgroundColor": "#ffffff"
        }
      ],
      "career_caution_1": [
        {
          "page": 73,
          "x": 92,
          "y": 729,
          "width": 224,
          "height": 20,
          "fontSize": 11,
          "color": "#111111",
          "align": "left",
          "backgroundColor": "#ffffff"
        }
      ],
      "career_caution_2": [
        {
          "page": 73,
          "x": 92,
          "y": 708,
          "width": 224,
          "height": 20,
          "fontSize": 11,
          "color": "#111111",
          "align": "left",
          "backgroundColor": "#ffffff"
        }
      ],
      "preferred_role": [
        {
          "page": 73,
          "x": 232,
          "y": 606,
          "width": 228,
          "height": 20,
          "fontSize": 11,
          "color": "#111111",
          "align": "left",
          "backgroundColor": "#ffffff"
        }
      ],
      "learning_style": [
        {
          "page": 73,
          "x": 250,
          "y": 585,
          "width": 248,
          "height": 20,
          "fontSize": 11,
          "color": "#111111",
          "align": "left",
          "backgroundColor": "#ffffff"
        }
      ],
      "career_pace": [
        {
          "page": 73,
          "x": 272,
          "y": 564,
          "width": 248,
          "height": 20,
          "fontSize": 11,
          "color": "#111111",
          "align": "left",
          "backgroundColor": "#ffffff"
        }
      ]
    }'::jsonb,
    true
)
WHERE COALESCE(data->'pdfTemplateConfigPaid', '{}'::jsonb) = '{}'::jsonb
   OR COALESCE(data->'pdfTemplateConfigPaid', '{}'::jsonb) = '{
      "DISC_MAIN": [
        {
          "page": 1,
          "x": 248,
          "y": 655,
          "width": 100,
          "height": 36,
          "fontSize": 26,
          "color": "#4b1fa8",
          "align": "center"
        }
      ],
      "disc_score_d": [
        {
          "page": 1,
          "x": 130,
          "y": 520,
          "width": 48,
          "height": 22,
          "fontSize": 15,
          "color": "#111111",
          "align": "center"
        }
      ],
      "disc_score_i": [
        {
          "page": 1,
          "x": 415,
          "y": 520,
          "width": 48,
          "height": 22,
          "fontSize": 15,
          "color": "#111111",
          "align": "center"
        }
      ],
      "disc_score_c": [
        {
          "page": 1,
          "x": 130,
          "y": 340,
          "width": 48,
          "height": 22,
          "fontSize": 15,
          "color": "#111111",
          "align": "center"
        }
      ],
      "disc_score_s": [
        {
          "page": 1,
          "x": 415,
          "y": 340,
          "width": 48,
          "height": 22,
          "fontSize": 15,
          "color": "#111111",
          "align": "center"
        }
      ],
      "fullName": [
        {
          "page": 2,
          "x": 250,
          "y": 292,
          "width": 220,
          "height": 24,
          "fontSize": 15,
          "color": "#111111",
          "align": "left"
        }
      ],
      "phoneNumber": [
        {
          "page": 2,
          "x": 250,
          "y": 240,
          "width": 200,
          "height": 24,
          "fontSize": 15,
          "color": "#111111",
          "align": "left"
        }
      ],
      "email": [
        {
          "page": 2,
          "x": 250,
          "y": 188,
          "width": 235,
          "height": 26,
          "fontSize": 12,
          "color": "#111111",
          "align": "left"
        }
      ],
      "address": [
        {
          "page": 2,
          "x": 250,
          "y": 136,
          "width": 235,
          "height": 36,
          "fontSize": 12,
          "color": "#111111",
          "align": "left"
        }
      ]
    }'::jsonb;
