const PROCEDURES = [
    'DROP PROCEDURE IF EXISTS getOtherTypes',
    `
      CREATE PROCEDURE getOtherTypes()
        BEGIN
          SELECT * FROM other_types;
        END;
    `,
] as const;

export { PROCEDURES };
