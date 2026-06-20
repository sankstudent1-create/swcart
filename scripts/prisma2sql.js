const fs = require('fs');

const prisma = fs.readFileSync('prisma/schema.prisma', 'utf8');

const sql = [];
let currentModel = null;
let currentFields = [];

const typeMap = {
  String: 'TEXT',
  Int: 'INTEGER',
  Float: 'DOUBLE PRECISION',
  Boolean: 'BOOLEAN',
  DateTime: 'TIMESTAMP(3)',
  Json: 'JSONB'
};

const lines = prisma.split('\n');
for (let line of lines) {
  line = line.trim();
  if (line.startsWith('model ')) {
    currentModel = line.split(' ')[1];
    currentFields = [];
  } else if (line.startsWith('}')) {
    if (currentModel) {
      const fieldsSql = currentFields.join(',\n    ');
      sql.push(`CREATE TABLE "${currentModel}" (\n    ${fieldsSql}\n);`);
      currentModel = null;
    }
  } else if (currentModel && line !== '' && !line.startsWith('//') && !line.startsWith('@@')) {
    const parts = line.split(/\s+/);
    const name = parts[0];
    let type = parts[1];
    if (!type) continue;
    
    // Check if type is a primitive
    let isArray = type.endsWith('[]');
    let isOptional = type.endsWith('?');
    let baseType = type.replace('?', '').replace('[]', '');
    
    if (!typeMap[baseType]) {
      continue; // It's a relation, skip for now.
    }
    
    let sqlBaseType = typeMap[baseType] || 'TEXT';
    if (isArray) sqlBaseType += '[]';
    
    let sqlLine = `"${name}" ${sqlBaseType}`;
    
    if (line.includes('@id')) {
      sqlLine += ' PRIMARY KEY';
    } else if (!isOptional && !isArray) {
      sqlLine += ' NOT NULL';
    }

    if (line.includes('@unique')) {
      sqlLine += ' UNIQUE';
    }
    
    if (line.includes('@default(now())')) {
      sqlLine += ' DEFAULT CURRENT_TIMESTAMP';
    } else if (line.includes('@default(false)')) {
      sqlLine += ' DEFAULT false';
    } else if (line.includes('@default(true)')) {
      sqlLine += ' DEFAULT true';
    } else if (line.includes('@default(')) {
      const match = line.match(/@default\((.*?)\)/);
      if (match) {
        let defVal = match[1];
        if (defVal === 'cuid()' || defVal.startsWith('cuid')) {
          // ignore cuid() for sql schema, it will be handled by app
        } else {
          if (defVal.startsWith('"') && defVal.endsWith('"')) {
            defVal = "'" + defVal.slice(1, -1) + "'";
          }
          sqlLine += ` DEFAULT ${defVal}`;
        }
      }
    }

    currentFields.push(sqlLine);
  }
}

// Read seed data
const seedData = fs.readFileSync('seed_data.sql', 'utf8');

fs.writeFileSync('supabase_setup.sql', sql.join('\n\n') + '\n\n' + seedData);
console.log('Schema generated and written to supabase_setup.sql');
