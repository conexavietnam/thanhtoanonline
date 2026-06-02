UPDATE app_settings
SET data = jsonb_set(
    data,
    '{pdfTemplateConfig}',
    '{
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
    }'::jsonb,
    true
)
WHERE COALESCE(data->'pdfTemplateConfig', '{}'::jsonb) = '{}'::jsonb;

UPDATE app_settings
SET data = jsonb_set(
    data,
    '{pdfTemplateConfigPaid}',
    '{
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
    }'::jsonb,
    true
)
WHERE COALESCE(data->'pdfTemplateConfigPaid', '{}'::jsonb) = '{}'::jsonb;
