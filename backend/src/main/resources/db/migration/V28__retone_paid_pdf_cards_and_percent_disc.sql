UPDATE app_settings
SET data = jsonb_set(
    data,
    '{pdfTemplateConfigPaid}',
    $${
      "fullName":[{"page":2,"x":650,"y":840.5,"width":760,"height":60,"fontSize":40,"color":"#33434c","align":"left"}],
      "phoneNumber":[{"page":2,"x":650,"y":753.5,"width":760,"height":60,"fontSize":40,"color":"#33434c","align":"left"}],
      "email":[{"page":2,"x":650,"y":675.5,"width":760,"height":60,"fontSize":36,"color":"#33434c","align":"left"}],
      "address":[{"page":2,"x":650,"y":573.5,"width":760,"height":84,"fontSize":34,"color":"#33434c","align":"left"}],
      "disc_D":[{"page":20,"x":68,"y":414.5,"width":680,"height":148,"fontSize":42,"color":"#33434c","align":"center","appearance":"card","backgroundColor":"#d8efc1","borderColor":"#b7d39f","borderWidth":1.5,"radius":24,"padding":18,"verticalAlign":"middle"}],
      "disc_I":[{"page":20,"x":824,"y":414.5,"width":680,"height":148,"fontSize":42,"color":"#33434c","align":"center","appearance":"card","backgroundColor":"#d8efc1","borderColor":"#b7d39f","borderWidth":1.5,"radius":24,"padding":18,"verticalAlign":"middle"}],
      "disc_S":[{"page":20,"x":68,"y":248.5,"width":680,"height":148,"fontSize":42,"color":"#33434c","align":"center","appearance":"card","backgroundColor":"#d8efc1","borderColor":"#b7d39f","borderWidth":1.5,"radius":24,"padding":18,"verticalAlign":"middle"}],
      "disc_C":[{"page":20,"x":824,"y":248.5,"width":680,"height":148,"fontSize":42,"color":"#33434c","align":"center","appearance":"card","backgroundColor":"#d8efc1","borderColor":"#b7d39f","borderWidth":1.5,"radius":24,"padding":18,"verticalAlign":"middle"}],
      "disc_primary_axis":[{"page":22,"x":68,"y":1462.5,"width":1100,"height":420,"fontSize":34,"color":"#33434c","align":"left","appearance":"card","backgroundColor":"#d8efc1","borderColor":"#b7d39f","borderWidth":1.5,"radius":28,"padding":26,"verticalAlign":"top"}],
      "disc_secondary_axis":[{"page":23,"x":68,"y":718.5,"width":1150,"height":430,"fontSize":34,"color":"#33434c","align":"left","appearance":"card","backgroundColor":"#d8efc1","borderColor":"#b7d39f","borderWidth":1.5,"radius":28,"padding":26,"verticalAlign":"top"}],
      "disc_low_zone":[{"page":25,"x":68,"y":1549.5,"width":980,"height":250,"fontSize":34,"color":"#33434c","align":"left","appearance":"card","backgroundColor":"#d8efc1","borderColor":"#b7d39f","borderWidth":1.5,"radius":28,"padding":24,"verticalAlign":"top"}],
      "disc_combination":[{"page":26,"x":68,"y":389.5,"width":1100,"height":360,"fontSize":34,"color":"#33434c","align":"left","appearance":"card","backgroundColor":"#d8efc1","borderColor":"#b7d39f","borderWidth":1.5,"radius":28,"padding":26,"verticalAlign":"top"}],
      "disc_archetype":[{"page":28,"x":68,"y":1049.5,"width":1180,"height":420,"fontSize":30,"color":"#33434c","align":"left","appearance":"card","backgroundColor":"#d8efc1","borderColor":"#b7d39f","borderWidth":1.5,"radius":28,"padding":26,"verticalAlign":"top"}],
      "disc_strengths":[{"page":30,"x":68,"y":702.5,"width":1220,"height":520,"fontSize":28,"color":"#33434c","align":"left","appearance":"card","backgroundColor":"#d8efc1","borderColor":"#b7d39f","borderWidth":1.5,"radius":28,"padding":26,"verticalAlign":"top"}],
      "disc_weaknesses":[{"page":32,"x":68,"y":1299.5,"width":1220,"height":500,"fontSize":28,"color":"#33434c","align":"left","appearance":"card","backgroundColor":"#d8efc1","borderColor":"#b7d39f","borderWidth":1.5,"radius":28,"padding":26,"verticalAlign":"top"}],
      "disc_motivation":[{"page":33,"x":68,"y":158.5,"width":1220,"height":420,"fontSize":28,"color":"#33434c","align":"left","appearance":"card","backgroundColor":"#d8efc1","borderColor":"#b7d39f","borderWidth":1.5,"radius":28,"padding":26,"verticalAlign":"top"}],
      "disc_stress_behavior":[{"page":35,"x":68,"y":1549.5,"width":1250,"height":250,"fontSize":28,"color":"#33434c","align":"left","appearance":"card","backgroundColor":"#d8efc1","borderColor":"#b7d39f","borderWidth":1.5,"radius":28,"padding":24,"verticalAlign":"top"}],
      "disc_communication_style":[{"page":36,"x":68,"y":809.5,"width":1300,"height":330,"fontSize":28,"color":"#33434c","align":"left","appearance":"card","backgroundColor":"#d8efc1","borderColor":"#b7d39f","borderWidth":1.5,"radius":28,"padding":26,"verticalAlign":"top"}],
      "disc_work_environment":[{"page":37,"x":68,"y":552.5,"width":1280,"height":350,"fontSize":28,"color":"#33434c","align":"left","appearance":"card","backgroundColor":"#d8efc1","borderColor":"#b7d39f","borderWidth":1.5,"radius":28,"padding":26,"verticalAlign":"top"}],
      "disc_career_fields":[{"page":38,"x":68,"y":703.5,"width":1220,"height":280,"fontSize":28,"color":"#33434c","align":"left","appearance":"card","backgroundColor":"#d8efc1","borderColor":"#b7d39f","borderWidth":1.5,"radius":28,"padding":24,"verticalAlign":"top"}],
      "disc_work_roles":[{"page":39,"x":68,"y":1122.5,"width":1220,"height":430,"fontSize":28,"color":"#33434c","align":"left","appearance":"card","backgroundColor":"#d8efc1","borderColor":"#b7d39f","borderWidth":1.5,"radius":28,"padding":26,"verticalAlign":"top"}]
    }$$::jsonb,
    true
)
WHERE COALESCE(data#>>'{pdfTemplateConfigPaid,disc_D,0,appearance}', '') = 'card'
  AND COALESCE(data#>>'{pdfTemplateConfigPaid,disc_D,0,backgroundColor}', '') = '#edf5e1'
  AND COALESCE(data#>>'{pdfTemplateConfigPaid,disc_strengths,0,backgroundColor}', '') = '#edf5e1';
