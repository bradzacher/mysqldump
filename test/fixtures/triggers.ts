import { config } from '../testConfig';

// unfortunately - for multi-statement triggers you need DELIMITER statements, which are a MYSQL CLI statement
//                 and are not supported via any driver... so you have to run each statement separately
const TRIGGERS = [
    'DROP TRIGGER IF EXISTS trigger_juan',
    `
    CREATE DEFINER = \`${config.user}\` @\`${
        config.host
    }\` TRIGGER trigger_juan BEFORE INSERT ON other_types
       FOR EACH ROW
     BEGIN
           SET NEW.populatedViaTrigger = 2;
       END`,

    'DROP TRIGGER IF EXISTS trigger_two',
    `
    CREATE DEFINER = \`${config.user}\` @\`${
        config.host
    }\` TRIGGER trigger_two AFTER UPDATE ON other_types
       FOR EACH ROW
     BEGIN
           UPDATE other_types
              SET populatedViaTrigger2 = 3
            WHERE ot_id = NEW.ot_id;
       END`,
] as const;

export { TRIGGERS };
