UPDATE app_settings
SET data = jsonb_set(
    data,
    '{pdfTemplateConfigPaid}',
    $${
      "fullName":[{"page":2,"x":650,"y":840.5,"width":760,"height":60,"fontSize":40,"color":"#33434c","align":"left"}],
      "phoneNumber":[{"page":2,"x":650,"y":753.5,"width":760,"height":60,"fontSize":40,"color":"#33434c","align":"left"}],
      "email":[{"page":2,"x":650,"y":675.5,"width":760,"height":60,"fontSize":36,"color":"#33434c","align":"left"}],
      "address":[{"page":2,"x":650,"y":573.5,"width":760,"height":84,"fontSize":34,"color":"#33434c","align":"left"}],
      "disc_percent_d":[{"page":20,"x":133,"y":494.5,"width":240,"height":68,"fontSize":38,"color":"#33434c","align":"left"}],
      "disc_percent_i":[{"page":20,"x":109,"y":412,"width":240,"height":68,"fontSize":38,"color":"#33434c","align":"left"}],
      "disc_percent_s":[{"page":20,"x":127,"y":329.5,"width":240,"height":68,"fontSize":38,"color":"#33434c","align":"left"}],
      "disc_percent_c":[{"page":20,"x":130,"y":247,"width":240,"height":68,"fontSize":38,"color":"#33434c","align":"left"}],
      "disc_primary_axis":[{"page":22,"x":100,"y":1462.5,"width":1100,"height":420,"fontSize":34,"color":"#33434c","align":"left"}],
      "disc_secondary_axis":[{"page":23,"x":100,"y":718.5,"width":1150,"height":430,"fontSize":34,"color":"#33434c","align":"left"}],
      "disc_low_zone":[{"page":25,"x":100,"y":1549.5,"width":980,"height":250,"fontSize":34,"color":"#33434c","align":"left"}],
      "disc_combination":[{"page":26,"x":100,"y":389.5,"width":1100,"height":360,"fontSize":34,"color":"#33434c","align":"left"}],
      "disc_archetype":[{"page":28,"x":100,"y":1049.5,"width":1180,"height":420,"fontSize":30,"color":"#33434c","align":"left"}],
      "disc_strengths":[{"page":30,"x":100,"y":702.5,"width":1220,"height":520,"fontSize":28,"color":"#33434c","align":"left"}],
      "disc_weaknesses":[{"page":32,"x":100,"y":1299.5,"width":1220,"height":500,"fontSize":28,"color":"#33434c","align":"left"}],
      "disc_motivation":[{"page":33,"x":100,"y":158.5,"width":1220,"height":420,"fontSize":28,"color":"#33434c","align":"left"}],
      "disc_stress_behavior":[{"page":35,"x":100,"y":1549.5,"width":1250,"height":250,"fontSize":28,"color":"#33434c","align":"left"}],
      "disc_communication_style":[{"page":36,"x":100,"y":809.5,"width":1300,"height":330,"fontSize":28,"color":"#33434c","align":"left"}],
      "disc_work_environment":[{"page":37,"x":100,"y":552.5,"width":1280,"height":350,"fontSize":28,"color":"#33434c","align":"left"}],
      "disc_career_fields":[{"page":38,"x":100,"y":703.5,"width":1220,"height":280,"fontSize":28,"color":"#33434c","align":"left"}],
      "disc_work_roles":[{"page":39,"x":100,"y":1122.5,"width":1220,"height":430,"fontSize":28,"color":"#33434c","align":"left"}]
    }$$::jsonb,
    true
)
WHERE COALESCE(data->'pdfTemplateConfigPaid', '{}'::jsonb) = '{}'::jsonb
   OR COALESCE(data#>>'{pdfTemplateConfigPaid,disc_D,0,appearance}', '') = 'card'
   OR COALESCE(data#>>'{pdfTemplateConfigPaid,disc_strengths,0,appearance}', '') = 'card'
   OR COALESCE(data#>>'{pdfTemplateConfigPaid,disc_percent_d,0,page}', '') = '';
